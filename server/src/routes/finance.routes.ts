import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  createFeeStructure,
  recordPayment,
  generateReceipt,
  getStudentFeeStatus,
  getFeeCollectionReport,
  getOutstandingFeesReport,
  listFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
} from '../controllers/finance.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Fee structure management
router.post('/', requirePermission(PermissionCategory.FINANCE_CREATE_FEE), createFeeStructure);
router.get('/structures', requirePermission(PermissionCategory.FINANCE_READ), listFeeStructures);
router.put('/structures/:id', requirePermission(PermissionCategory.FINANCE_CREATE_FEE), updateFeeStructure);
router.delete('/structures/:id', requirePermission(PermissionCategory.FINANCE_CREATE_FEE), deleteFeeStructure);

// Payment management
router.post('/payments', requirePermission(PermissionCategory.FINANCE_RECORD_PAYMENT), recordPayment);
router.get('/payments/:id/receipt', requirePermission(PermissionCategory.FINANCE_GENERATE_RECEIPT), generateReceipt);

// Student fee status
router.get('/students/:id/status', requirePermission(PermissionCategory.FINANCE_READ), getStudentFeeStatus);

// Reports
router.get('/reports/collection', requirePermission(PermissionCategory.FINANCE_REPORT), getFeeCollectionReport);
router.get('/reports/outstanding', requirePermission(PermissionCategory.FINANCE_REPORT), getOutstandingFeesReport);

export default router;