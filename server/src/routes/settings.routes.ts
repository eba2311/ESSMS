import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();
router.use(authenticate);
router.get('/', getSettings);
router.put('/', authorize(UserRole.SYSTEM_ADMIN), updateSettings);
export default router;
