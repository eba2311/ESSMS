import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  listGradeScales, createGradeScale, updateGradeScale,
  deleteGradeScale, getActiveGradeScale,
} from '../controllers/gradescale.controller';

const router = Router();
router.use(authenticate);

router.get('/active', getActiveGradeScale);
router.get('/', requirePermission(PermissionCategory.GRADE_CONFIG), listGradeScales);
router.post('/', requirePermission(PermissionCategory.GRADE_CONFIG), createGradeScale);
router.put('/:id', requirePermission(PermissionCategory.GRADE_CONFIG), updateGradeScale);
router.delete('/:id', requirePermission(PermissionCategory.GRADE_CONFIG), deleteGradeScale);

export default router;
