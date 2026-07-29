import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import {
  createItem,
  listItems,
  getItemById,
  updateItem,
  deleteItem,
  getInventoryReport,
} from '../controllers/inventory.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PermissionCategory.RESOURCE_MANAGE), createItem);
router.get('/', requirePermission(PermissionCategory.RESOURCE_READ), listItems);
router.get('/report', requirePermission(PermissionCategory.RESOURCE_READ), getInventoryReport);
router.get('/:id', requirePermission(PermissionCategory.RESOURCE_READ), getItemById);
router.put('/:id', requirePermission(PermissionCategory.RESOURCE_MANAGE), updateItem);
router.delete('/:id', requirePermission(PermissionCategory.RESOURCE_MANAGE), deleteItem);

export default router;
