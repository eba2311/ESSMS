import { Router } from 'express';
import {
  markAttendance,
  listAttendance,
  getStudentAttendance,
  getSectionAttendanceSheet,
  getSectionAttendanceSummary,
  getChronicAbsentees,
  getMyAttendance,
  getChildrenAttendance,
  updateAttendance,
  deleteAttendance,
  requestCorrection,
  listCorrections,
  reviewCorrection,
  getSchoolAttendanceSummary,
  getTodayDashboard,
} from '../controllers/attendance.controller';
import {
  authenticate,
  requirePermission,
  PermissionCategory,
  authorize,
} from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PermissionCategory.ATTENDANCE_MARK), markAttendance);

router.get('/', requirePermission(PermissionCategory.ATTENDANCE_REPORT), listAttendance);

router.get('/dashboard/today', requirePermission(PermissionCategory.ATTENDANCE_REPORT), getTodayDashboard);

router.get('/my-attendance', authorize(UserRole.STUDENT), getMyAttendance);

router.get('/my-children-attendance', authorize(UserRole.PARENT), getChildrenAttendance);

router.get('/chronic-absentees', requirePermission(PermissionCategory.ATTENDANCE_REPORT), getChronicAbsentees);

router.get('/school-summary', requirePermission(PermissionCategory.ATTENDANCE_REPORT), getSchoolAttendanceSummary);

router.get('/student/:id', requirePermission(PermissionCategory.ATTENDANCE_READ_ALL), getStudentAttendance);

router.get('/section/:id/sheet', requirePermission(PermissionCategory.ATTENDANCE_READ_SECTION), getSectionAttendanceSheet);
router.get('/section/:id/sheet/:dateStr', requirePermission(PermissionCategory.ATTENDANCE_READ_SECTION), getSectionAttendanceSheet);
router.get('/reports/summary', requirePermission(PermissionCategory.ATTENDANCE_REPORT), getSectionAttendanceSummary);
router.get('/section/:id/summary', requirePermission(PermissionCategory.ATTENDANCE_REPORT), getSectionAttendanceSummary);

router.put('/:id', requirePermission(PermissionCategory.ATTENDANCE_MARK), updateAttendance);

router.delete('/:id', requirePermission(PermissionCategory.ATTENDANCE_DELETE), deleteAttendance);

router.post('/corrections', requirePermission(PermissionCategory.ATTENDANCE_CORRECTION_REQUEST), requestCorrection);
router.get('/corrections', requirePermission(PermissionCategory.ATTENDANCE_CORRECTION_REVIEW), listCorrections);
router.put('/corrections/:id/review', requirePermission(PermissionCategory.ATTENDANCE_CORRECTION_REVIEW), reviewCorrection);

export default router;
