import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  sendMessage,
  getInbox,
  getOutbox,
  getThread,
  markMessageRead,
  markAllMessagesRead,
  deleteMessage,
  getUnreadCount,
} from '../controllers/message.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PermissionCategory.MESSAGE_SEND), sendMessage);
router.get('/inbox', requirePermission(PermissionCategory.MESSAGE_READ), getInbox);
router.get('/outbox', requirePermission(PermissionCategory.MESSAGE_SEND), getOutbox);
router.put('/read-all', requirePermission(PermissionCategory.MESSAGE_READ), markAllMessagesRead);
router.get('/unread-count', requirePermission(PermissionCategory.MESSAGE_READ), getUnreadCount);
router.get('/thread/:threadId', requirePermission(PermissionCategory.MESSAGE_READ), getThread);
router.put('/:id/read', requirePermission(PermissionCategory.MESSAGE_READ), markMessageRead);
router.delete('/:id', requirePermission(PermissionCategory.MESSAGE_READ), deleteMessage);

export default router;
