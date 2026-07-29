import { Router } from 'express';
import {
  getAssignmentDashboard, getUnassignedStudents, getSectionOverview,
  batchAssignTeacher, checkTeacherWorkload, assignSectionSubjectTeacher,
  getAssignmentReports, getTeacherAssignments, batchAssignStudents,
  getAssignmentHistory,
} from '../controllers/assignment.controller';
import { authenticate, requirePermission, PermissionCategory, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();
router.use(authenticate);

/* ───── Dashboard ───── */
router.get('/dashboard', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
), getAssignmentDashboard);

/* ───── Unassigned Students ───── */
router.get('/students/unassigned', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR,
), getUnassignedStudents);

/* ───── Batch Assign Students to Section ───── */
router.post('/students/batch-assign', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR,
), batchAssignStudents);

/* ───── Section Overview (subjects + teachers) ───── */
router.get('/sections/:id/overview', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
  UserRole.REGISTRAR, UserRole.TEACHER,
), getSectionOverview);

/* ───── Teacher Batch Assignment ───── */
router.post('/teachers/batch-assign', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD,
), batchAssignTeacher);

/* ───── Teacher Workload Check ───── */
router.get('/teachers/:id/workload-check', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
), checkTeacherWorkload);

/* ───── Section-Subject-Teacher Assignment ───── */
router.post('/section-subject-teacher', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD,
), assignSectionSubjectTeacher);

/* ───── Teacher Assignments Overview ───── */
router.get('/teachers-assignments', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
), getTeacherAssignments);

/* ───── Assignment History ───── */
router.get('/history', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
), getAssignmentHistory);

/* ───── Reports ───── */
router.get('/reports', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
), getAssignmentReports);

export default router;