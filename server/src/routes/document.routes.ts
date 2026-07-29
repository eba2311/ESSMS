import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { uploadSingle } from '../middleware/upload.middleware';
import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  verifyDocument,
} from '../controllers/document.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PermissionCategory.DOCUMENT_CERTIFICATE), uploadSingle('file'), uploadDocument);
router.get('/', requirePermission(PermissionCategory.DOCUMENT_READ_OWN), listDocuments);
router.get('/:id', requirePermission(PermissionCategory.DOCUMENT_READ_OWN), getDocumentById);
router.get('/:id/download', requirePermission(PermissionCategory.DOCUMENT_READ_OWN), downloadDocument);
router.put('/:id/verify', requirePermission(PermissionCategory.DOCUMENT_TRANSCRIPT), verifyDocument);
router.delete('/:id', requirePermission(PermissionCategory.DOCUMENT_CERTIFICATE), deleteDocument);

export default router;
