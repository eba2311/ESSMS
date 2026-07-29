import { Router } from 'express';
import {
  getSections, getSectionData, assignTeacher, removeAssignment,
  getSubjectMarks, saveSubjectMarks, getTeachers, getTeacherAssignments,
} from '../controllers/sectionAssign.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();
router.use(authenticate);

router.get('/sections', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
  UserRole.REGISTRAR, UserRole.TEACHER,
), getSections);

router.get('/teachers', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD,
), getTeachers);

router.get('/teacher-assignments', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
), getTeacherAssignments);

router.get('/:sectionId/data', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR,
  UserRole.REGISTRAR, UserRole.TEACHER,
), getSectionData);

router.post('/assign-teacher', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD,
), assignTeacher);

router.delete('/assignment/:assignmentId', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD,
), removeAssignment);

router.get('/:sectionId/subject/:subjectId/marks', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD,
  UserRole.TEACHER,
), getSubjectMarks);

router.post('/:sectionId/subject/:subjectId/marks', authorize(
  UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD,
  UserRole.TEACHER,
), saveSubjectMarks);

export default router;
