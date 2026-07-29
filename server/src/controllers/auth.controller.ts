import { Request, Response, NextFunction } from 'express';
import { loginUser, logoutUser, changePassword as changePasswordService, requestPasswordReset, executePasswordReset } from '../services/auth.service';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { setupMFA, verifyAndEnableMFA, verifyMFAToken, disableMFA } from '../services/mfa.service';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models';

/**
 * Login controller
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      throw new ApiError(400, 'Username/email and password are required');
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await loginUser(usernameOrEmail, password, ipAddress, userAgent);

    if (!result.success) {
      if (result.accountLocked) {
        res.status(423).json({
          success: false,
          message: result.message,
          lockedUntil: result.lockoutEndsAt,
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: result.message,
      });
      return;
    }

    if (result.requiresMFA) {
      res.status(200).json({
        success: true,
        requiresMFA: true,
        message: result.message,
        data: {
          user: result.user,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        passwordExpired: result.passwordExpired,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout controller
 */
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    await logoutUser(req.user.id, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token controller
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User no longer exists or is inactive');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      id: decoded.id,
      role: decoded.role,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      next(new ApiError(401, error.message));
    } else {
      next(new ApiError(401, 'Invalid refresh token'));
    }
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = await User.findById(req.user.id).select('-passwordHash -mfaSecret');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const mfaSetup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try { if (!req.user) throw new ApiError(401, 'Not authenticated');
    const result = await setupMFA(req.user.id); res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const mfaVerifyAndEnable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try { if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { token } = req.body; if (!token) throw new ApiError(400, 'Token is required');
    await verifyAndEnableMFA(req.user.id, token); res.json({ success: true, message: 'MFA enabled successfully' });
  } catch (error) { next(error); }
};

export const mfaVerifyLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const { email, token } = req.body; if (!email || !token) throw new ApiError(400, 'Email and token are required');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw new ApiError(404, 'User not found');
    const verified = await verifyMFAToken(user._id.toString(), token); if (!verified) throw new ApiError(401, 'Invalid MFA token');
    const accessToken = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.userId, id: user._id.toString(), role: user.role });
    res.json({ success: true, data: { accessToken, refreshToken } });
  } catch (error) { next(error); }
};

export const mfaDisable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try { if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { password } = req.body; if (!password) throw new ApiError(400, 'Password is required');
    await disableMFA(req.user.id, password); res.json({ success: true, message: 'MFA disabled successfully' });
  } catch (error) { next(error); }
};

/**
 * Update current user profile (self-service)
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { firstName, lastName, email } = req.body;
    const updateData: Record<string, string> = {};

    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user.id } });
      if (existing) throw new ApiError(409, 'Email is already in use');
      updateData.email = normalizedEmail;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No fields to update');
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true, runValidators: true }).select('-passwordHash -mfaSecret');

    if (!user) throw new ApiError(404, 'User not found');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new ApiError(400, 'Current and new password are required');
    if (newPassword.length < 6) throw new ApiError(400, 'New password must be at least 6 characters');
    await changePasswordService(req.user.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const passwordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email) {
      throw new ApiError(400, 'Email is required');
    }

    if (token && newPassword) {
      await executePasswordReset(email, token, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } else {
      const resetToken = await requestPasswordReset(email);
      if (resetToken) {
        res.json({
          success: true,
          message: 'Reset code sent to your email',
          data: { resetToken },
        });
      } else {
        res.json({
          success: true,
          message: 'If the email is registered, a reset code has been sent',
        });
      }
    }
  } catch (error) {
    next(error);
  }
};
