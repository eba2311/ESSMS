import { Router } from 'express';
import {
  createSection,
  getSectionById,
  updateSection,
  listSections,
  getSectionStudents,
  getSectionSubjects,
  deleteSection,
  archiveSection,
  restoreSection,
  assignStudentsToSection,
  removeStudentFromSection,
  transferStudent,
  getSectionTransfers,
  getSectionPerformance,
  getSectionAttendance,
  getSectionDashboard,
  balanceSections,
  getSectionHistory,
  bulkCreateSections,
  rolloverSections,
  getSectionEnrollmentTrend,
  generateSectionReport,
  getSectionSubjectsDetail,
  getSectionAnalytics,
  archiveMultipleSections,
  assignHomeroomTeacher,
  mergeSections,
  bulkTransferStudents,
  getSectionClassRoster,
} from '../controllers/section.controller';
import {
  authenticate,
  requirePermission,
  PermissionCategory,
  authorize,
} from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

/* ────────── Non-parameterized routes FIRST ────────── */

router.get(
  '/dashboard',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  getSectionDashboard
);

router.post(
  '/balance',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  balanceSections
);

router.post(
  '/bulk-create',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  bulkCreateSections
);

router.post(
  '/rollover',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  rolloverSections
);

router.post(
  '/archive-multiple',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  archiveMultipleSections
);

router.post(
  '/merge',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  mergeSections
);

router.post(
  '/bulk-transfer',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  bulkTransferStudents
);

/* ────────── Core CRUD ────────── */

router.post(
  '/',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  createSection
);

router.get(
  '/',
  requirePermission(PermissionCategory.SECTION_READ),
  listSections
);

router.get(
  '/:id',
  requirePermission(PermissionCategory.SECTION_READ),
  getSectionById
);

router.put(
  '/:id',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  updateSection
);

/* ────────── Lifecycle ────────── */

router.delete(
  '/:id',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  deleteSection
);

router.post(
  '/:id/archive',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  archiveSection
);

router.post(
  '/:id/restore',
  authorize(UserRole.SYSTEM_ADMIN),
  restoreSection
);

router.get(
  '/:id/history',
  requirePermission(PermissionCategory.SECTION_READ),
  getSectionHistory
);

/* ────────── Student Assignment ────────── */

router.get(
  '/:id/students',
  requirePermission(PermissionCategory.SECTION_READ),
  getSectionStudents
);

router.post(
  '/:id/students',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  assignStudentsToSection
);

router.delete(
  '/:id/students/:studentId',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  removeStudentFromSection
);

router.get(
  '/:id/subjects',
  requirePermission(PermissionCategory.SECTION_READ),
  getSectionSubjects
);

/* ────────── Transfers ────────── */

router.post(
  '/transfer/:studentId',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  transferStudent
);

router.get(
  '/:id/transfers',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  getSectionTransfers
);

/* ────────── Performance & Analytics ────────── */

router.get(
  '/:id/performance',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD),
  getSectionPerformance
);

router.get(
  '/:id/attendance',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD, UserRole.COUNSELOR),
  getSectionAttendance
);

/* ────────── Reports & Analytics ────────── */

router.get(
  '/:id/report',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD),
  generateSectionReport
);

router.get(
  '/:id/analytics',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD),
  getSectionAnalytics
);

router.get(
  '/:id/subjects-detail',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD),
  getSectionSubjectsDetail
);

router.get(
  '/:id/enrollment-trend',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  getSectionEnrollmentTrend
);

/* ────────── Homeroom Teacher ────────── */

router.put(
  '/:id/homeroom-teacher',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD),
  assignHomeroomTeacher
);

/* ────────── Class Roster ────────── */

router.get(
  '/:id/class-roster',
  requirePermission(PermissionCategory.SECTION_READ),
  getSectionClassRoster
);

export default router;
