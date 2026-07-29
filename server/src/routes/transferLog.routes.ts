import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  getTransferLogs,
  getTransferLogById,
  deleteTransferLog,
  restoreTransferLog,
} from '../controllers/transferLog.controller';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PermissionCategory.TRANSFER_LOG_READ), getTransferLogs);
router.get('/:id', requirePermission(PermissionCategory.TRANSFER_LOG_READ), getTransferLogById);
router.delete('/:id', requirePermission(PermissionCategory.TRANSFER_LOG_DELETE), deleteTransferLog);
router.patch('/:id/restore', requirePermission(PermissionCategory.TRANSFER_LOG_DELETE), restoreTransferLog);

export default router;
