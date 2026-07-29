import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { createClassroom, getClassrooms, getClassroom, updateClassroom, deleteClassroom } from '../controllers/classroom.controller';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission(PermissionCategory.RESOURCE_MANAGE), createClassroom);
router.get('/', requirePermission(PermissionCategory.RESOURCE_READ), getClassrooms);
router.get('/:id', requirePermission(PermissionCategory.RESOURCE_READ), getClassroom);
router.put('/:id', requirePermission(PermissionCategory.RESOURCE_MANAGE), updateClassroom);
router.delete('/:id', requirePermission(PermissionCategory.RESOURCE_MANAGE), deleteClassroom);
export default router;
