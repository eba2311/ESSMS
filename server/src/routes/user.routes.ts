import { Router } from 'express';
import {
  getUserProfile,
  getUserById,
  changeUserRole,
  updateUserProfile,
  toggleUserStatus,
  listUsers,
  createUser,
  resetUserPassword,
  deleteUser,
} from '../controllers/user.controller';
import { 
  authenticate, 
  authorize, 
  requirePermission, 
  PermissionCategory 
} from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private (All authenticated users)
 */
router.get('/me', getUserProfile);

/**
 * @route   GET /api/users
 * @desc    List all users
 * @access  Private (System Admin, School Director)
 */
router.get(
  '/',
  requirePermission(PermissionCategory.USER_CREATE),
  listUsers
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (System Admin only)
 */
router.post(
  '/',
  authorize(UserRole.SYSTEM_ADMIN),
  requirePermission(PermissionCategory.USER_CREATE),
  createUser
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (System Admin, School Director)
 */
router.get(
  '/:id',
  requirePermission(PermissionCategory.USER_CREATE),
  getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (System Admin, School Director)
 */
router.put(
  '/:id',
  requirePermission(PermissionCategory.USER_UPDATE),
  updateUserProfile
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Change user role
 * @access  Private (System Admin only)
 * @note    Implements Req 1.9 - immediate permission updates
 */
router.put(
  '/:id/role',
  authorize(UserRole.SYSTEM_ADMIN),
  requirePermission(PermissionCategory.USER_ROLE_CHANGE),
  changeUserRole
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Activate/Deactivate user
 * @access  Private (System Admin only)
 */
router.put(
  '/:id/status',
  authorize(UserRole.SYSTEM_ADMIN),
  requirePermission(PermissionCategory.USER_UPDATE),
  toggleUserStatus
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password (admin)
 * @access  Private (System Admin only)
 */
router.put(
  '/:id/reset-password',
  authorize(UserRole.SYSTEM_ADMIN),
  requirePermission(PermissionCategory.USER_UPDATE),
  resetUserPassword
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user permanently
 * @access  Private (System Admin only)
 */
router.delete(
  '/:id',
  authorize(UserRole.SYSTEM_ADMIN),
  requirePermission(PermissionCategory.USER_DELETE),
  deleteUser
);

export default router;
