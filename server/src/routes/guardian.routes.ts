import { Router } from 'express';
import {
  registerGuardian,
  getGuardianById,
  updateGuardianProfile,
  linkGuardianToStudent,
  unlinkGuardianFromStudent,
  listGuardians,
  getMyGuardianProfile,
} from '../controllers/guardian.controller';
import {
  authenticate,
  requirePermission,
  PermissionCategory,
} from '../middleware/auth.middleware';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   POST /api/guardians
 * @desc    Register a new guardian
 * @access  Private (Registrar, School Director)
 */
router.post(
  '/',
  requirePermission(PermissionCategory.GUARDIAN_CREATE),
  registerGuardian
);

/**
 * @route   GET /api/guardians
 * @desc    List guardians with filtering
 * @access  Private (Staff with guardian read permission)
 */
router.get(
  '/',
  requirePermission(PermissionCategory.GUARDIAN_READ),
  listGuardians
);

/**
 * @route   GET /api/guardians/me
 * @desc    Get logged-in guardian's profile with linked students
 * @access  Private (Parent self-service)
 */
router.get(
  '/me',
  authenticate,
  getMyGuardianProfile
);

/**
 * @route   GET /api/guardians/:id
 * @desc    Get guardian by ID
 * @access  Private (Staff with guardian read permission)
 */
router.get(
  '/:id',
  requirePermission(PermissionCategory.GUARDIAN_READ),
  getGuardianById
);

/**
 * @route   PUT /api/guardians/:id
 * @desc    Update guardian profile
 * @access  Private (Registrar, School Director)
 */
router.put(
  '/:id',
  requirePermission(PermissionCategory.GUARDIAN_UPDATE),
  updateGuardianProfile
);

/**
 * @route   POST /api/guardians/:id/link-student
 * @desc    Link guardian to student
 * @access  Private (Registrar, School Director)
 */
router.post(
  '/:id/link-student',
  requirePermission(PermissionCategory.GUARDIAN_UPDATE),
  linkGuardianToStudent
);

/**
 * @route   POST /api/guardians/:id/unlink-student
 * @desc    Unlink guardian from student
 * @access  Private (Registrar, School Director)
 */
router.post(
  '/:id/unlink-student',
  requirePermission(PermissionCategory.GUARDIAN_UPDATE),
  unlinkGuardianFromStudent
);

export default router;
