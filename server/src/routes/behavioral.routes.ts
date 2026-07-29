import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { createReport, getReports, getReport, updateReport, deleteReport } from '../controllers/behavioral.controller';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission(PermissionCategory.BEHAVIORAL_REPORT_CREATE), createReport);
router.get('/', requirePermission(PermissionCategory.BEHAVIORAL_REPORT_READ), getReports);
router.get('/:id', requirePermission(PermissionCategory.BEHAVIORAL_REPORT_READ), getReport);
router.put('/:id', requirePermission(PermissionCategory.BEHAVIORAL_REPORT_UPDATE), updateReport);
router.delete('/:id', requirePermission(PermissionCategory.BEHAVIORAL_REPORT_UPDATE), deleteReport);
export default router;
