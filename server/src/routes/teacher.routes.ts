import { Router } from 'express';
import {
  registerTeacher, listTeachers, getTeacherById, updateTeacherProfile, deleteTeacher,
  assignTeacher, unassignTeacher, getTeacherAssignments, getTeacherWorkload,
  recordTeacherAttendance, getTeacherAttendance,
  requestLeave, approveLeave, transferTeacher,
  getTeacherDashboard, getTeacherPerformance, updateTeacherPerformance,
  getMyDashboard, getMyTimetable, getMySections, getMySectionStudents,
  getMySectionAttendance, getMySubjects, getMySectionSubjects, getMySectionAssessments, getMyAssessments,
  getMyMarks, saveMarks, getMyPerformance, getMyReports, recordMyAttendance,
  addTraining, getTrainings, deleteTraining,
  addDisciplinaryRecord, getDisciplinaryRecords, updateDisciplinaryStatus,
  getTeacherTimetable,
} from '../controllers/teacher.controller';
import {
  authenticate, requirePermission, PermissionCategory, authorize,
} from '../middleware/auth.middleware';
import { UserRole } from '../types';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

/* ───── Dashboard (MUST be before /:id) ───── */
router.get('/dashboard', requirePermission(PermissionCategory.REPORT_ACADEMIC), getTeacherDashboard);

/* ───── Teacher My (self-service — MUST be before /:id) ───── */
router.get('/my/dashboard', authorize(UserRole.TEACHER), getMyDashboard);
router.get('/my/timetable', authorize(UserRole.TEACHER), getMyTimetable);
router.get('/my/sections', authorize(UserRole.TEACHER), getMySections);
router.get('/my/sections/:sectionId/students', authorize(UserRole.TEACHER), getMySectionStudents);
router.get('/my/sections/:sectionId/attendance', authorize(UserRole.TEACHER), getMySectionAttendance);
router.get('/my/subjects', authorize(UserRole.TEACHER), getMySubjects);
router.get('/my/section-subjects', authorize(UserRole.TEACHER), getMySectionSubjects);
router.get('/my/sections/:sectionId/assessments', authorize(UserRole.TEACHER), getMySectionAssessments);
router.get('/my/assessments', authorize(UserRole.TEACHER), getMyAssessments);
router.get('/my/marks', authorize(UserRole.TEACHER), getMyMarks);
router.post('/my/marks', authorize(UserRole.TEACHER), saveMarks);
router.post('/my/attendance', authorize(UserRole.TEACHER), recordMyAttendance);
router.get('/my/performance', authorize(UserRole.TEACHER), getMyPerformance);
router.get('/my/reports/:type', authorize(UserRole.TEACHER, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR), getMyReports);

/* ───── Assignments (MUST be before /:id) ───── */
router.post('/assign', requirePermission(PermissionCategory.TEACHER_ASSIGN), assignTeacher);
router.delete('/assignments/:assignmentId', requirePermission(PermissionCategory.TEACHER_ASSIGN), unassignTeacher);

/* ───── CRUD ───── */
router.post('/', requirePermission(PermissionCategory.TEACHER_CREATE), uploadSingle('photo'), registerTeacher);
router.get('/', requirePermission(PermissionCategory.TEACHER_READ), listTeachers);
router.get('/:id', requirePermission(PermissionCategory.TEACHER_READ), getTeacherById);
router.put('/:id', requirePermission(PermissionCategory.TEACHER_UPDATE), uploadSingle('photo'), updateTeacherProfile);
router.delete('/:id', requirePermission(PermissionCategory.TEACHER_DELETE), deleteTeacher);

/* ───── Per-teacher routes ───── */
router.get('/:id/assignments', requirePermission(PermissionCategory.TEACHER_READ), getTeacherAssignments);
router.get('/:id/workload', requirePermission(PermissionCategory.TEACHER_WORKLOAD), getTeacherWorkload);
router.post('/:id/attendance', requirePermission(PermissionCategory.TEACHER_UPDATE), recordTeacherAttendance);
router.get('/:id/attendance', requirePermission(PermissionCategory.TEACHER_READ), getTeacherAttendance);
router.post('/:id/leaves', requirePermission(PermissionCategory.TEACHER_UPDATE), requestLeave);
router.put('/:id/leaves/:leaveId', authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR), approveLeave);
router.post('/:id/transfer', requirePermission(PermissionCategory.TEACHER_ASSIGN), transferTeacher);
router.get('/:id/performance', requirePermission(PermissionCategory.REPORT_ACADEMIC), getTeacherPerformance);
router.put('/:id/performance', requirePermission(PermissionCategory.TEACHER_UPDATE), updateTeacherPerformance);
router.get('/:id/timetable', requirePermission(PermissionCategory.TEACHER_READ), getTeacherTimetable);

/* ───── Training & Certifications ───── */
router.get('/:id/trainings', requirePermission(PermissionCategory.TEACHER_READ), getTrainings);
router.post('/:id/trainings', requirePermission(PermissionCategory.TEACHER_UPDATE), addTraining);
router.delete('/:id/trainings/:trainingId', requirePermission(PermissionCategory.TEACHER_UPDATE), deleteTraining);

/* ───── Disciplinary Records ───── */
router.get('/:id/disciplinary', requirePermission(PermissionCategory.TEACHER_READ), getDisciplinaryRecords);
router.post('/:id/disciplinary', requirePermission(PermissionCategory.TEACHER_UPDATE), addDisciplinaryRecord);
router.put('/:id/disciplinary/:recordId', requirePermission(PermissionCategory.TEACHER_UPDATE), updateDisciplinaryStatus);

export default router;
