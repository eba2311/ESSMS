import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  createTimetable,
  getTimetables,
  getTimetableBySection,
  updateTimetable,
  deleteTimetable,
  addScheduleSlot,
  removeScheduleSlot,
} from '../controllers/timetable.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PermissionCategory.TIMETABLE_CREATE), createTimetable);
router.get('/', requirePermission(PermissionCategory.TIMETABLE_READ), getTimetables);
router.get('/section/:sectionId', requirePermission(PermissionCategory.TIMETABLE_READ), getTimetableBySection);
router.put('/:id', requirePermission(PermissionCategory.TIMETABLE_CREATE), updateTimetable);
router.delete('/:id', requirePermission(PermissionCategory.TIMETABLE_CREATE), deleteTimetable);
router.post('/:id/slots', requirePermission(PermissionCategory.TIMETABLE_CREATE), addScheduleSlot);
router.delete('/:id/slots/:slotId', requirePermission(PermissionCategory.TIMETABLE_CREATE), removeScheduleSlot);

export default router;
