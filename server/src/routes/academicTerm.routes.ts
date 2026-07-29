import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  createTerm,
  listTerms,
  getCurrentTerm,
  setCurrentTerm,
  updateTerm,
  deleteTerm,
} from '../controllers/academicTerm.controller';

const router = Router();
router.use(authenticate);

router.post('/', requirePermission(PermissionCategory.SYSTEM_CONFIG), createTerm);
router.get('/', requirePermission(PermissionCategory.SECTION_READ), listTerms);
router.get('/current', requirePermission(PermissionCategory.SECTION_READ), getCurrentTerm);
router.put('/:id/current', requirePermission(PermissionCategory.SYSTEM_CONFIG), setCurrentTerm);
router.put('/:id', requirePermission(PermissionCategory.SYSTEM_CONFIG), updateTerm);
router.delete('/:id', requirePermission(PermissionCategory.SYSTEM_CONFIG), deleteTerm);

export default router;
