import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { getAlumni, getAlumnus, updateAlumnus, getAlumniStats } from '../controllers/alumni.controller';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission(PermissionCategory.ALUMNI_READ), getAlumni);
router.get('/stats', requirePermission(PermissionCategory.ALUMNI_REPORT), getAlumniStats);
router.get('/:id', requirePermission(PermissionCategory.ALUMNI_READ), getAlumnus);
router.put('/:id', requirePermission(PermissionCategory.ALUMNI_UPDATE), updateAlumnus);
export default router;
