import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { getHealthRecord, createHealthRecord, updateHealthRecord, addVisit, addImmunization } from '../controllers/health.controller';

const router = Router();
router.use(authenticate);
router.get('/:studentId', requirePermission(PermissionCategory.STUDENT_READ), getHealthRecord);
router.post('/', requirePermission(PermissionCategory.STUDENT_CREATE), createHealthRecord);
router.put('/:studentId', requirePermission(PermissionCategory.STUDENT_UPDATE), updateHealthRecord);
router.post('/:studentId/visits', requirePermission(PermissionCategory.STUDENT_UPDATE), addVisit);
router.post('/:studentId/immunizations', requirePermission(PermissionCategory.STUDENT_UPDATE), addImmunization);
export default router;
