import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { createSession, getSessions, getSession, updateSession, deleteSession } from '../controllers/counseling.controller';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission(PermissionCategory.COUNSELING_CREATE), createSession);
router.get('/', requirePermission(PermissionCategory.COUNSELING_READ_ALL), getSessions);
router.get('/:id', requirePermission(PermissionCategory.COUNSELING_READ_ALL), getSession);
router.put('/:id', requirePermission(PermissionCategory.COUNSELING_UPDATE), updateSession);
router.delete('/:id', requirePermission(PermissionCategory.COUNSELING_DELETE), deleteSession);
export default router;
