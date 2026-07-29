import { Router } from 'express';
import {
  registerStudent,
  approveStudentAdmission,
  getStudentById,
  updateStudentProfile,
  promoteStudent,
  transferStudent,
  withdrawStudent,
  graduateStudent,
  suspendStudent,
  archiveStudent,
  restoreStudent,
  listStudents,
  getStudentHistory,
  getStudentTranscript,
  getStudentFullDetails,
  advancedSearchStudents,
  bulkUpdateStatus,
  bulkPromoteStudents,
  assignStudentSection,
  getStudentSubjects,
  getMyProfile,
  updateMyProfile,
  getMySubjects,
  getStudentTransfers,
} from '../controllers/student.controller';
import {
  authenticate,
  requirePermission,
  PermissionCategory,
} from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/students
 * @desc    Register a new student
 * @access  Private (Registrar, System Admin)
 */
router.post(
  '/',
  requirePermission(PermissionCategory.STUDENT_CREATE),
  uploadSingle('photo'),
  registerStudent
);

/**
 * @route   GET /api/students
 * @desc    List students with filtering
 * @access  Private (All staff with student read permission)
 */
router.get(
  '/',
  requirePermission(PermissionCategory.STUDENT_READ),
  listStudents
);

/**
 * @route   POST /api/students/advanced-search
 * @desc    Advanced search students
 * @access  Private (Staff with student read)
 */
router.post(
  '/advanced-search',
  requirePermission(PermissionCategory.STUDENT_READ),
  advancedSearchStudents
);

/**
 * @route   POST /api/students/bulk-status
 * @desc    Bulk update student status
 * @access  Private (System Admin, Registrar)
 */
router.post(
  '/bulk-status',
  requirePermission(PermissionCategory.STUDENT_UPDATE, PermissionCategory.STUDENT_PROMOTE),
  bulkUpdateStatus
);

/**
 * @route   POST /api/students/bulk-promote
 * @desc    Bulk promote students to next grade
 * @access  Private (Academic Head, System Admin)
 */
router.post(
  '/bulk-promote',
  requirePermission(PermissionCategory.STUDENT_PROMOTE),
  bulkPromoteStudents
);

/**
 * @route   POST /api/students/:id/approve
 * @desc    Approve student admission - creates user account + activates
 * @access  Private (System Admin, Academic Head, Registrar)
 */
router.post(
  '/:id/approve',
  requirePermission(PermissionCategory.STUDENT_UPDATE),
  approveStudentAdmission
);

/**
 * @route   GET /api/students/me
 * @desc    Get logged-in student's own profile
 * @access  Private (Student self)
 */
router.get(
  '/me',
  authenticate,
  getMyProfile
);

/**
 * @route   PUT /api/students/me
 * @desc    Update logged-in student's own profile
 * @access  Private (Student self)
 */
router.put(
  '/me',
  authenticate,
  uploadSingle('photo'),
  updateMyProfile
);

/**
 * @route   GET /api/students/me/subjects
 * @desc    Get logged-in student's enrolled subjects
 * @access  Private (Student self)
 */
router.get(
  '/me/subjects',
  authenticate,
  getMySubjects
);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Private (All staff with student read permission)
 */
router.get(
  '/:id',
  requirePermission(PermissionCategory.STUDENT_READ),
  getStudentById
);

/**
 * @route   GET /api/students/:id/full-details
 * @desc    Get student full details with related records
 * @access  Private (Staff with student read)
 */
router.get(
  '/:id/full-details',
  requirePermission(PermissionCategory.STUDENT_READ),
  getStudentFullDetails
);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student profile
 * @access  Private (Registrar, School Director)
 */
router.put(
  '/:id',
  requirePermission(PermissionCategory.STUDENT_UPDATE),
  uploadSingle('photo'),
  updateStudentProfile
);

/**
 * @route   POST /api/students/:id/promote
 * @desc    Promote student to next grade
 * @access  Private (Registrar, Academic Head, School Director)
 */
router.post(
  '/:id/promote',
  requirePermission(PermissionCategory.STUDENT_PROMOTE),
  promoteStudent
);

/**
 * @route   POST /api/students/:id/transfer
 * @desc    Transfer student to another school
 * @access  Private (Registrar, School Director)
 */
router.post(
  '/:id/transfer',
  requirePermission(PermissionCategory.STUDENT_TRANSFER),
  transferStudent
);

/**
 * @route   POST /api/students/:id/withdraw
 * @desc    Withdraw student
 * @access  Private (Registrar, School Director)
 */
router.post(
  '/:id/withdraw',
  requirePermission(PermissionCategory.STUDENT_TRANSFER),
  withdrawStudent
);

/**
 * @route   POST /api/students/:id/suspend
 * @desc    Suspend a student
 * @access  Private (System Admin, School Director)
 */
router.post(
  '/:id/suspend',
  requirePermission(PermissionCategory.STUDENT_UPDATE),
  suspendStudent
);

/**
 * @route   POST /api/students/:id/archive
 * @desc    Archive a student
 * @access  Private (System Admin)
 */
router.post(
  '/:id/archive',
  requirePermission(PermissionCategory.STUDENT_DELETE),
  archiveStudent
);

/**
 * @route   POST /api/students/:id/restore
 * @desc    Restore a suspended/archived student
 * @access  Private (System Admin, Registrar)
 */
router.post(
  '/:id/restore',
  requirePermission(PermissionCategory.STUDENT_UPDATE),
  restoreStudent
);

/**
 * @route   POST /api/students/:id/graduate
 * @desc    Mark student as graduated
 * @access  Private (Registrar, School Director)
 */
router.post(
  '/:id/graduate',
  requirePermission(PermissionCategory.STUDENT_GRADUATE),
  graduateStudent
);

/**
 * @route   GET /api/students/:id/history
 * @desc    Get student's complete history
 * @access  Private (Registrar, School Director, Academic Head)
 */
router.get(
  '/:id/history',
  requirePermission(PermissionCategory.STUDENT_READ),
  getStudentHistory
);

/**
 * @route   GET /api/students/:id/transcript
 * @desc    Get student transcript
 * @access  Private (Staff with transcript permission)
 */
router.get(
  '/:id/transcript',
  requirePermission(PermissionCategory.DOCUMENT_TRANSCRIPT),
  getStudentTranscript
);

/**
 * @route   PUT /api/students/:id/section
 * @desc    Assign section to student (individual assignment)
 * @access  Private (System Admin, Academic Head, Registrar)
 */
router.put(
  '/:id/section',
  requirePermission(PermissionCategory.STUDENT_UPDATE),
  assignStudentSection
);

/**
 * @route   GET /api/students/:id/subjects
 * @desc    Get subjects a student is enrolled in
 * @access  Private (Staff with student read, student self)
 */
router.get(
  '/:id/subjects',
  requirePermission(PermissionCategory.STUDENT_READ),
  getStudentSubjects
);

/**
 * @route   GET /api/students/:id/transfers
 * @desc    Get student's section/school transfer history
 * @access  Private (Staff with student read)
 */
router.get(
  '/:id/transfers',
  requirePermission(PermissionCategory.STUDENT_READ),
  getStudentTransfers
);

export default router;
