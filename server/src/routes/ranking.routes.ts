import { Router } from 'express';
import {
  calculateRankings,
  getStudentRanking,
  getSectionRankings,
  getGradeRankings,
  getStreamRankings,
  getSchoolRankings,
  getTopPerformersController,
  getSubjectTopPerformersController,
  getMyRanking,
  recalculateStudentRanking,
} from '../controllers/ranking.controller';
import {
  authenticate,
  requirePermission,
  PermissionCategory,
  authorize,
} from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   POST /api/rankings/calculate
 * @desc    Calculate rankings for all students
 * @access  Private (Academic Head, School Director)
 */
router.post(
  '/calculate',
  requirePermission(PermissionCategory.GRADE_CALCULATE),
  calculateRankings
);

/**
 * @route   GET /api/rankings/my-ranking
 * @desc    Get student's own ranking
 * @access  Private (Students only)
 */
router.get(
  '/my-ranking',
  authorize(UserRole.STUDENT),
  getMyRanking
);

/**
 * @route   GET /api/rankings/top-performers
 * @desc    Get top performers school-wide
 * @access  Private (Staff)
 */
router.get(
  '/top-performers',
  requirePermission(PermissionCategory.ANALYTICS_VIEW),
  getTopPerformersController
);

/**
 * @route   GET /api/rankings/school
 * @desc    Get school-wide rankings
 * @access  Private (Staff with analytics view)
 */
router.get(
  '/school',
  requirePermission(PermissionCategory.ANALYTICS_VIEW),
  getSchoolRankings
);

/**
 * @route   GET /api/rankings/student/:id
 * @desc    Get ranking for a specific student
 * @access  Private (Staff, Students can only see own)
 */
router.get(
  '/student/:id',
  requirePermission(PermissionCategory.GRADE_READ_ALL),
  getStudentRanking
);

/**
 * @route   GET /api/rankings/section/:id
 * @desc    Get rankings for a specific section
 * @access  Private (Staff)
 */
router.get(
  '/section/:id',
  requirePermission(PermissionCategory.GRADE_READ_SECTION),
  getSectionRankings
);

/**
 * @route   GET /api/rankings/grade/:grade
 * @desc    Get rankings for a specific grade
 * @access  Private (Staff with grade read permission)
 */
router.get(
  '/grade/:grade',
  requirePermission(PermissionCategory.GRADE_READ_ALL),
  getGradeRankings
);

/**
 * @route   GET /api/rankings/stream/:grade/:stream
 * @desc    Get rankings for a specific stream (grades 11-12)
 * @access  Private (Staff with grade read permission)
 */
router.get(
  '/stream/:grade/:stream',
  requirePermission(PermissionCategory.GRADE_READ_ALL),
  getStreamRankings
);

/**
 * @route   GET /api/rankings/subject/:subjectId/top-performers
 * @desc    Get top performers for a specific subject
 * @access  Private (Staff)
 */
router.get(
  '/subject/:subjectId/top-performers',
  requirePermission(PermissionCategory.ANALYTICS_VIEW),
  getSubjectTopPerformersController
);

/**
 * @route   POST /api/rankings/student/:studentId/recalculate
 * @desc    Recalculate rankings for a specific student
 * @access  Private (Academic Head, School Director)
 */
router.post(
  '/student/:studentId/recalculate',
  requirePermission(PermissionCategory.GRADE_CALCULATE),
  recalculateStudentRanking
);

export default router;