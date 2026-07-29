import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { PermissionCategory } from '../config/permissions';
import { uploadSingle } from '../middleware/upload.middleware';
import {
  addBook,
  issueBook,
  returnBook,
  searchBooks,
  getBorrowingHistory,
  getOverdueBooksReport,
  getLibraryStatistics,
  updateBook,
  listBooks,
  deleteBook,
  listBorrowings,
  getMyBorrowings,
} from '../controllers/library.controller';

const router = Router();

router.use(authenticate);

// Book management
router.post('/books', requirePermission(PermissionCategory.LIBRARY_MANAGE_BOOKS), uploadSingle('coverImage'), addBook);
router.get('/books', requirePermission(PermissionCategory.LIBRARY_READ), listBooks);
router.get('/books/search', requirePermission(PermissionCategory.LIBRARY_READ), searchBooks);
router.put('/books/:id', requirePermission(PermissionCategory.LIBRARY_MANAGE_BOOKS), uploadSingle('coverImage'), updateBook);
router.delete('/books/:id', requirePermission(PermissionCategory.LIBRARY_MANAGE_BOOKS), deleteBook);

// Borrowing management
router.get('/borrowings', requirePermission(PermissionCategory.LIBRARY_READ), listBorrowings);
router.get('/borrowings/my', requirePermission(PermissionCategory.LIBRARY_BORROW), getMyBorrowings);
router.get('/borrowings/user/:id', requirePermission(PermissionCategory.LIBRARY_READ), getBorrowingHistory);
router.post('/borrowings', requirePermission(PermissionCategory.LIBRARY_BORROW), issueBook);
router.put('/borrowings/:id/return', requirePermission(PermissionCategory.LIBRARY_RETURN), returnBook);

// Reports and statistics
router.get('/reports/overdue', requirePermission(PermissionCategory.LIBRARY_REPORT), getOverdueBooksReport);
router.get('/statistics', requirePermission(PermissionCategory.LIBRARY_READ), getLibraryStatistics);

export default router;
