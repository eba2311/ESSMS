import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/communication.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Notification management - static routes before parameterized routes
router.post('/notifications', requirePermission(PermissionCategory.NOTIFICATION_SEND), createNotification);
router.get('/notifications', authenticate, getUserNotifications); // Users get their own notifications
router.put('/notifications/read-all', authenticate, markAllNotificationsRead); // Must come before /:id/read
router.put('/notifications/:id/read', authenticate, markNotificationRead);
router.delete('/notifications/:id', authenticate, deleteNotification);

export default router;