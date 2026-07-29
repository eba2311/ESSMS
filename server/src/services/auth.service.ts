import { User } from '../models';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { AuditLog } from '../models';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    userId: string;
    username: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  requiresMFA?: boolean;
  accountLocked?: boolean;
  lockoutEndsAt?: Date;
  passwordExpired?: boolean;
  forcePasswordChange?: boolean;
}

/**
 * Authenticate user with username/email and password
 */
export const loginUser = async (
  usernameOrEmail: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> => {
  try {
    const normalizedLogin = usernameOrEmail.trim().toLowerCase();

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: normalizedLogin }, { email: normalizedLogin }],
    }).select('+passwordHash');

    if (!user) {
      try {
        await AuditLog.create({
          activityType: 'LOGIN_FAILED',
          success: false,
          errorMessage: 'User not found',
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });
      } catch {
        // Ignore audit log failures
      }

      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      try {
        await AuditLog.create({
          userId: user._id,
          activityType: 'LOGIN_ATTEMPTED_WHILE_LOCKED',
          success: false,
          errorMessage: 'Account locked',
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });
      } catch {
        // Ignore audit log failures
      }

      const lockoutMinutes = config.accountLockoutDurationMinutes;
      return {
        success: false,
        accountLocked: true,
        lockoutEndsAt: user.accountLockedUntil,
        message: `Too many login attempts, please try again after ${lockoutMinutes} minutes`,
      };
    }

    // Check if account is active
    if (!user.isActive) {
      try {
        await AuditLog.create({
          userId: user._id,
          activityType: 'LOGIN_INACTIVE_ACCOUNT',
          success: false,
          errorMessage: 'Account inactive',
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });
      } catch {
        // Ignore audit log failures
      }

      return {
        success: false,
        message: 'Account is inactive',
      };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account if max attempts exceeded
      if (user.failedLoginAttempts >= config.maxFailedLoginAttempts) {
        user.accountLockedUntil = new Date(
          Date.now() + config.accountLockoutDurationMinutes * 60 * 1000
        );
        user.failedLoginAttempts = 0;
      }

      try {
        await user.save();
      } catch {
        // Ignore save failures
      }

      try {
        await AuditLog.create({
          userId: user._id,
          activityType: 'LOGIN_FAILED',
          success: false,
          errorMessage: 'Invalid password',
          ipAddress,
          userAgent,
          timestamp: new Date(),
          metadata: {
            failedAttempts: user.failedLoginAttempts,
            accountLocked: !!user.accountLockedUntil,
          },
        });
      } catch {
        // Ignore audit log failures
      }

      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Reset failed attempts on successful password verification
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      try {
        await user.save();
      } catch {
        // Ignore save failures
      }
      return {
        success: true,
        requiresMFA: true,
        user: {
          id: user._id.toString(),
          userId: user.userId,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        message: 'MFA verification required',
      };
    }

    // Check if password has expired or force change is required
    const passwordExpired = isPasswordExpired(user.passwordChangedAt) || (user.forcePasswordChange === true);

    // Update last login
    user.lastLogin = new Date();
    try {
      await user.save();
    } catch (saveError) {
      logger.error('Failed to update last login:', saveError);
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.userId,
      id: user._id.toString(),
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Log successful login
    try {
      await AuditLog.create({
        userId: user._id,
        activityType: 'LOGIN_SUCCESS',
        success: true,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
    } catch (auditError) {
      logger.error('Failed to create audit log:', auditError);
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
      passwordExpired,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user and invalidate tokens
 */
export const logoutUser = async (
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  const user = await User.findById(userId);
  
  if (user) {
    await AuditLog.create({
      userId: user._id,
      activityType: 'LOGOUT',
      success: true,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }
};

/**
 * Check if password has expired
 */
export const isPasswordExpired = (passwordChangedAt?: Date): boolean => {
  if (!passwordChangedAt) return false;

  const expiryDate = new Date(passwordChangedAt);
  expiryDate.setDate(expiryDate.getDate() + config.passwordExpiryDays);

  return new Date() > expiryDate;
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new ApiError(404, 'User not found');

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) throw new ApiError(400, 'Current password is incorrect');

  if (newPassword.length < 6) throw new ApiError(400, 'New password must be at least 6 characters');

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.forcePasswordChange = false;
  await user.save();
};

interface ResetTokenEntry {
  token: string;
  email: string;
  expiresAt: Date;
}

const resetTokens = new Map<string, ResetTokenEntry>();

export const requestPasswordReset = async (email: string): Promise<string | undefined> => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return undefined;
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  resetTokens.set(token, { token, email: email.toLowerCase().trim(), expiresAt });

  return token;
};

export const executePasswordReset = async (email: string, token: string, newPassword: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = resetTokens.get(token);

  if (!entry || entry.email !== normalizedEmail) {
    throw new ApiError(400, 'Invalid or expired reset code');
  }

  if (new Date() > entry.expiresAt) {
    resetTokens.delete(token);
    throw new ApiError(400, 'Reset code has expired');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.forcePasswordChange = false;
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = undefined;
  await user.save();

  resetTokens.delete(token);
};
