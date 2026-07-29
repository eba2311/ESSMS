import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { getAuditLogs, getAuditLog, getAuditStats } from '../controllers/audit.controller';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission(PermissionCategory.AUDIT_READ), getAuditLogs);
router.get('/stats', requirePermission(PermissionCategory.AUDIT_REPORT), getAuditStats);
router.get('/:id', requirePermission(PermissionCategory.AUDIT_READ), getAuditLog);
export default router;
