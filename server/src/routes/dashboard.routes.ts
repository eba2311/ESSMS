import { Router } from 'express';
import { getDashboardStats, getTeacherDashboard, getStudentDashboard } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

router.get(
  '/stats',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR),
  getDashboardStats
);
router.get('/teacher', getTeacherDashboard);
router.get('/student', getStudentDashboard);

export default router;
