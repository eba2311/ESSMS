import { Router } from 'express';
import { authenticate, authorize, requirePermission } from '../middleware/auth.middleware';
import { UserRole } from '../types';
import { PermissionCategory } from '../config/permissions';
import {
  listAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement,
  deleteAnnouncement, publishAnnouncement, unpublishAnnouncement,
  archiveAnnouncement, markAnnouncementRead, getAnnouncementStats,
} from '../controllers/announcement.controller';

const router = Router();
router.use(authenticate);

/* ───── List / Stats ───── */
router.get('/', listAnnouncements);
router.get('/stats', authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD), getAnnouncementStats);

/* ───── CRUD ───── */
router.post('/', requirePermission(PermissionCategory.ANNOUNCEMENT_CREATE), createAnnouncement);
router.get('/:id', listAnnouncements);
router.put('/:id', requirePermission(PermissionCategory.ANNOUNCEMENT_CREATE), updateAnnouncement);
router.delete('/:id', requirePermission(PermissionCategory.ANNOUNCEMENT_CREATE), deleteAnnouncement);

/* ───── Status Actions ───── */
router.post('/:id/publish', requirePermission(PermissionCategory.ANNOUNCEMENT_CREATE), publishAnnouncement);
router.post('/:id/unpublish', requirePermission(PermissionCategory.ANNOUNCEMENT_CREATE), unpublishAnnouncement);
router.post('/:id/archive', requirePermission(PermissionCategory.ANNOUNCEMENT_CREATE), archiveAnnouncement);

/* ───── Read Tracking ───── */
router.post('/:id/read', markAnnouncementRead);

export default router;