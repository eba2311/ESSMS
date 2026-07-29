import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  createBus,
  listBuses,
  getBusById,
  updateBus,
  deleteBus,
  getTransportReport,
} from '../controllers/transport.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PermissionCategory.TRANSPORT_CREATE), createBus);
router.get('/', requirePermission(PermissionCategory.TRANSPORT_READ), listBuses);
router.get('/reports/summary', requirePermission(PermissionCategory.TRANSPORT_REPORT), getTransportReport);
router.get('/:id', requirePermission(PermissionCategory.TRANSPORT_READ), getBusById);
router.put('/:id', requirePermission(PermissionCategory.TRANSPORT_UPDATE), updateBus);
router.delete('/:id', requirePermission(PermissionCategory.TRANSPORT_DELETE), deleteBus);

export default router;
