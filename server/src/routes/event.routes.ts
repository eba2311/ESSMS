import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent } from '../controllers/event.controller';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission(PermissionCategory.EVENT_CREATE), createEvent);
router.get('/', requirePermission(PermissionCategory.EVENT_READ), getEvents);
router.get('/:id', requirePermission(PermissionCategory.EVENT_READ), getEvent);
router.put('/:id', requirePermission(PermissionCategory.EVENT_UPDATE), updateEvent);
router.delete('/:id', requirePermission(PermissionCategory.EVENT_CREATE), deleteEvent);
export default router;
