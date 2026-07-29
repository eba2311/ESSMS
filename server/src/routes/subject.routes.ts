import { Router } from 'express';
import { authenticate, requirePermission, PermissionCategory, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';
import {
  createSubject, listSubjects, getSubject, updateSubject, deleteSubject, toggleSubjectStatus,
  createAssignment, listAssignments, deleteAssignment, copyAssignments,
  createResource, listResources, updateResource, deleteResource,
  createMaterial, listMaterials, deleteMaterial,
  createSchedule, listSchedules, updateSchedule, deleteSchedule,
  getSubjectDashboard, getSubjectReport,
  getSubjectPerformanceReport, getSubjectRankingReport, getSectionPerformanceReport,
} from '../controllers/subject.controller';

const router = Router();
router.use(authenticate);

/* ───── Static routes first (before /:id) ───── */
router.get('/dashboard', requirePermission(PermissionCategory.REPORT_ACADEMIC), getSubjectDashboard);

router.get('/reports/performance', requirePermission(PermissionCategory.REPORT_ACADEMIC), getSubjectPerformanceReport);
router.get('/reports/ranking', requirePermission(PermissionCategory.REPORT_ACADEMIC), getSubjectRankingReport);
router.get('/reports/section-performance', requirePermission(PermissionCategory.REPORT_ACADEMIC), getSectionPerformanceReport);

router.post('/assignments', requirePermission(PermissionCategory.SUBJECT_ASSIGN), createAssignment);
router.get('/assignments', requirePermission(PermissionCategory.SUBJECT_ASSIGN), listAssignments);
router.post('/assignments/copy', requirePermission(PermissionCategory.SUBJECT_ASSIGN), copyAssignments);
router.delete('/assignments/:id', requirePermission(PermissionCategory.SUBJECT_ASSIGN), deleteAssignment);

router.post('/resources', requirePermission(PermissionCategory.SUBJECT_RESOURCE_MANAGE), createResource);
router.get('/resources', requirePermission(PermissionCategory.SECTION_READ), listResources);
router.put('/resources/:id', requirePermission(PermissionCategory.SUBJECT_RESOURCE_MANAGE), updateResource);
router.delete('/resources/:id', requirePermission(PermissionCategory.SUBJECT_RESOURCE_MANAGE), deleteResource);

router.post('/materials', requirePermission(PermissionCategory.SUBJECT_MATERIAL_MANAGE), createMaterial);
router.get('/materials', requirePermission(PermissionCategory.SUBJECT_MATERIAL_VIEW), listMaterials);
router.delete('/materials/:id', requirePermission(PermissionCategory.SUBJECT_MATERIAL_MANAGE), deleteMaterial);

router.post('/schedules', requirePermission(PermissionCategory.CURRICULUM_MANAGE), createSchedule);
router.get('/schedules', requirePermission(PermissionCategory.SECTION_READ), listSchedules);
router.put('/schedules/:id', requirePermission(PermissionCategory.CURRICULUM_MANAGE), updateSchedule);
router.delete('/schedules/:id', requirePermission(PermissionCategory.CURRICULUM_MANAGE), deleteSchedule);

/* ───── Subject CRUD ───── */
router.post('/', requirePermission(PermissionCategory.CURRICULUM_MANAGE), createSubject);
router.get('/', requirePermission(PermissionCategory.SECTION_READ), listSubjects);
router.get('/:id', requirePermission(PermissionCategory.SECTION_READ), getSubject);
router.get('/:id/report', requirePermission(PermissionCategory.REPORT_ACADEMIC), getSubjectReport);
router.put('/:id', requirePermission(PermissionCategory.CURRICULUM_MANAGE), updateSubject);
router.put('/:id/status', requirePermission(PermissionCategory.CURRICULUM_MANAGE), toggleSubjectStatus);
router.delete('/:id', requirePermission(PermissionCategory.CURRICULUM_MANAGE), deleteSubject);

export default router;
