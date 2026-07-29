import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';
import {
  saveSemesterMarks,
  getSemesterRoster,
  getAnnualRoster,
  calculateSemesterRoster,
  calculateAnnualRoster,
  getDashboardStats,
  bulkSaveMarks,
  promoteStudents,
  getSectionsForRoster,
  getMyResults,
  getSubjectBreakdown,
  getEnhancedDashboard,
  transitionAcademicYear,
  getReportCard,
} from '../controllers/roster.controller';

const router = Router();

router.use(authenticate);

const adminRoles = [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR];
const teacherRoles = [...adminRoles, UserRole.TEACHER];
const allReadRoles = [...adminRoles, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];

// Dashboard
router.get('/dashboard', authorize(...adminRoles), getDashboardStats);
router.get('/dashboard/enhanced', authorize(...adminRoles), getEnhancedDashboard);

// Marks entry
router.post('/mark', authorize(...teacherRoles), saveSemesterMarks);
router.put('/marks', authorize(...teacherRoles), bulkSaveMarks);

// Semester roster
router.get('/semester', authorize(...allReadRoles), getSemesterRoster);
router.post('/semester/calculate', authorize(...adminRoles), calculateSemesterRoster);

// Annual roster
router.get('/annual', authorize(...allReadRoles), getAnnualRoster);
router.post('/annual/calculate', authorize(...adminRoles), calculateAnnualRoster);

// Student self-service
router.get('/my-results', authorize(...allReadRoles), getMyResults);

// Subject breakdown
router.get('/subject-breakdown', authorize(...allReadRoles), getSubjectBreakdown);

// Report card
router.get('/report-card', authorize(...allReadRoles), getReportCard);

// Promotions
router.post('/promote', authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD), promoteStudents);

// Academic year transition
router.post('/transition', authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD), transitionAcademicYear);

// Sections for roster
router.get('/sections', authorize(...adminRoles), getSectionsForRoster);

export default router;
