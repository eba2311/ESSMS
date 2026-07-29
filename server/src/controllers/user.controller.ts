import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from '../types';
import { logger } from '../utils/logger';
import { hashPassword, validatePasswordStrength } from '../utils/password.util';
import { generateAccount } from '../utils/account.util';

/**
 * Get user profile
 */
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-passwordHash');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user role
 * Implements Requirement 1.9: Immediate permission updates on role change
 * Only System Admins can change roles
 */
export const changeUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { role, reason } = req.body;

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      throw new ApiError(400, 'Invalid role provided');
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent self role change
    if (user._id.toString() === req.user.id) {
      throw new ApiError(400, 'Cannot change your own role');
    }

    const oldRole = user.role;

    // Change role (Req 1.9 - immediate update)
    user.role = role;
    await user.save();

    // Log role change with audit trail
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ROLE_CHANGE',
      description: `Changed user role from ${oldRole} to ${role}`,
      ipAddress: req.ip,
      metadata: {
        targetUserId: user._id,
        targetUserEmail: user.email,
        oldRole,
        newRole: role,
        reason: reason || 'No reason provided',
        changedBy: req.user.userId,
      },
    });

    logger.info(`Role changed for user ${user.userId}`, {
      userId: user._id,
      oldRole,
      newRole: role,
      changedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'User role updated successfully. New permissions are now in effect.',
      data: {
        userId: user.userId,
        email: user.email,
        oldRole,
        newRole: role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const updates = req.body;

    // Prevent role change through this endpoint
    if (updates.role) {
      throw new ApiError(400, 'Use the role change endpoint to modify user roles');
    }

    // Prevent password change through this endpoint
    if (updates.password || updates.passwordHash) {
      throw new ApiError(400, 'Use the password change endpoint to modify passwords');
    }

    // Prevent userId change
    if (updates.userId) {
      throw new ApiError(400, 'User ID cannot be modified');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'mfaEnabled'];
    
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        (user as any)[field] = updates[field];
      }
    });

    await user.save();

    // Log profile update
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'PROFILE_UPDATE',
      description: 'User profile updated',
      ipAddress: req.ip,
      metadata: {
        targetUserId: user._id,
        updatedFields: Object.keys(updates),
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate/Deactivate user
 */
export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent self deactivation
    if (user._id.toString() === req.user.id && !isActive) {
      throw new ApiError(400, 'Cannot deactivate your own account');
    }

    const oldStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    // Log status change
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'USER_STATUS_CHANGE',
      description: `User ${isActive ? 'activated' : 'deactivated'}`,
      ipAddress: req.ip,
      metadata: {
        targetUserId: user._id,
        targetUserEmail: user.email,
        oldStatus,
        newStatus: isActive,
        reason: reason || 'No reason provided',
      },
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: user.userId,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all users
 */
export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, isActive, search, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    // Filter by role
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filter.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(filter)
      .select('-passwordHash -mfaSecret -backupCodes')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 */
/**
 * Reset user password (admin only)
 */
export const resetUserPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters');
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throw new ApiError(400, strength.message || 'Password does not meet strength requirements');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updateOne(
      { _id: id },
      {
        $set: {
          passwordHash,
          forcePasswordChange: true,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      }
    );

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'PASSWORD_RESET',
      description: `Password reset for user ${user.email}`,
      ipAddress: req.ip,
      metadata: {
        targetUserId: user._id,
        targetUserEmail: user.email,
        resetBy: req.user.userId,
      },
    });

    logger.info(`Password reset for user ${user.userId}`, {
      userId: user._id,
      resetBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Password reset successfully. User must change password on next login.',
      data: {
        userId: user.userId,
        email: user.email,
        newPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user permanently
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent self deletion
    if (user._id.toString() === req.user.id) {
      throw new ApiError(400, 'Cannot delete your own account');
    }

    const deletedEmail = user.email;
    const deletedRole = user.role;

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'USER_DELETE',
      description: `User ${deletedEmail} deleted`,
      ipAddress: req.ip,
      metadata: {
        deletedUserId: user._id,
        deletedUserEmail: deletedEmail,
        deletedUserRole: deletedRole,
        deletedBy: req.user.userId,
      },
    });

    logger.info(`User deleted: ${deletedEmail}`, {
      userId: user._id,
      deletedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { email, password, role, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !role || !firstName || !lastName) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Create user
    let tempPassword = password;
    let passwordHash = await hashPassword(password);
    let usernameVal = undefined;
    if (!password || password.length < 6) {
      const account = await generateAccount(role);
      usernameVal = account.username;
      tempPassword = account.tempPassword;
      passwordHash = account.hashedPassword;
    } else {
      const strength = validatePasswordStrength(password);
      if (!strength.valid) {
        throw new ApiError(400, strength.message || 'Password does not meet strength requirements');
      }
    }
    const user = await User.create({
      username: usernameVal,
      email,
      passwordHash,
      role,
      firstName,
      lastName,
      phone: phone || undefined,
      forcePasswordChange: !password || password.length < 6,
    });

    // Log user creation
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'USER_CREATE',
      description: `New user created with role ${role}`,
      ipAddress: req.ip,
      metadata: {
        newUserId: user._id,
        newUserEmail: user.email,
        newUserRole: role,
        createdBy: req.user.userId,
      },
    });

    logger.info(`New user created`, {
      userId: user.userId,
      email: user.email,
      role: user.role,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        tempPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};
