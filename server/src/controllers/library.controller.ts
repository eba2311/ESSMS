import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Book, Borrowing, Student, Teacher, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Add book to library
 * Implements Req 11.1
 */
export const addBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { isbn, title, author, category, publisher, publicationYear, quantity, location } = req.body;

    if (!title || !author || !category || !quantity) {
      throw new ApiError(400, 'Missing required fields');
    }

    if (quantity < 0) {
      throw new ApiError(400, 'Quantity must be non-negative');
    }

    // Check for duplicate ISBN if provided
    if (isbn) {
      const existing = await Book.findOne({ isbn });
      if (existing) {
        throw new ApiError(400, 'Book with this ISBN already exists');
      }
    }

    const book = await Book.create({
      isbn,
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      publisher: publisher?.trim(),
      publicationYear,
      quantity,
      availableCopies: quantity, // Initially all copies are available
      location: location?.trim(),
      addedBy: req.user.id,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'BOOK_ADD',
      description: `Book "${title}" added to library`,
      ipAddress: req.ip,
      metadata: {
        bookId: book._id,
        isbn: book.isbn,
        title: book.title,
        quantity: book.quantity,
        addedBy: req.user.userId,
      },
    });

    logger.info(`Book added to library`, {
      bookId: book._id,
      title: book.title,
      addedBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Issue book to borrower
 * Implements Req 11.2, 11.3
 */
export const issueBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { bookId, borrowerId, borrowerType, dueDate, finePerDay = 2 } = req.body;

    if (!bookId || !borrowerId || !borrowerType) {
      throw new ApiError(400, 'Missing required fields');
    }

    if (!['Student', 'Teacher'].includes(borrowerType)) {
      throw new ApiError(400, 'Invalid borrower type');
    }

    // Validate book exists
    const bookExists = await Book.exists({ _id: bookId });
    if (!bookExists) {
      throw new ApiError(404, 'Book not found');
    }

    // Validate borrower exists
    let borrower;
    if (borrowerType === 'Student') {
      borrower = await Student.findById(borrowerId);
    } else {
      borrower = await Teacher.findById(borrowerId);
    }

    if (!borrower) {
      throw new ApiError(404, `${borrowerType} not found`);
    }

    // Check if borrower already has this book
    const existingBorrowing = await Borrowing.findOne({
      book: bookId,
      borrower: borrowerId,
      status: { $in: ['Borrowed', 'Overdue'] },
    });

    if (existingBorrowing) {
      throw new ApiError(400, 'Borrower already has this book');
    }

    // Calculate due date (default 14 days)
    const issueDate = new Date();
    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    if (calculatedDueDate <= issueDate) {
      throw new ApiError(400, 'Due date must be in the future');
    }

    // Atomically decrement available copies (avoids race condition)
    const book = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    if (!book) {
      throw new ApiError(400, 'No copies available for borrowing');
    }

    // Create borrowing record
    const borrowing = await Borrowing.create({
      book: bookId,
      borrower: borrowerId,
      borrowerType,
      issueDate,
      dueDate: calculatedDueDate,
      finePerDay,
      issuedBy: req.user.id,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'BOOK_ISSUE',
      description: `Book "${book.title}" issued to ${borrowerType.toLowerCase()}`,
      ipAddress: req.ip,
      metadata: {
        borrowingId: borrowing.borrowingId,
        bookTitle: book.title,
        borrowerType,
        borrowerId: borrowerType === 'Student' ? (borrower as any).studentId : (borrower as any).teacherId,
        dueDate: calculatedDueDate,
        issuedBy: req.user.userId,
      },
    });

    const populatedBorrowing = await Borrowing.findById(borrowing._id)
      .populate('book', 'title author isbn')
      .populate('borrower', borrowerType === 'Student' ? 'studentId firstName lastName' : 'teacherId firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: populatedBorrowing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return book
 * Implements Req 11.4, 11.5
 */
export const returnBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id: borrowingId } = req.params;
    const { returnDate } = req.body;

    const borrowing = await Borrowing.findById(borrowingId)
      .populate('book', 'title author availableCopies quantity')
      .populate('borrower', 'firstName lastName studentId teacherId');

    if (!borrowing) {
      throw new ApiError(404, 'Borrowing record not found');
    }

    if (borrowing.status === 'Returned') {
      throw new ApiError(400, 'Book already returned');
    }

    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();

    if (actualReturnDate < borrowing.issueDate) {
      throw new ApiError(400, 'Return date cannot be before issue date');
    }

    // Calculate fine if overdue
    let fine = 0;
    if (actualReturnDate > borrowing.dueDate) {
      const daysOverdue = Math.ceil((actualReturnDate.getTime() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fine = daysOverdue * borrowing.finePerDay;
    }

    // Update borrowing record
    borrowing.returnDate = actualReturnDate;
    borrowing.fine = fine;
    borrowing.status = 'Returned';
    borrowing.returnedTo = new mongoose.Types.ObjectId(req.user.id);
    await borrowing.save();

    // Atomically increment available copies (avoids race condition)
    await Book.findByIdAndUpdate(borrowing.book, { $inc: { availableCopies: 1 } });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'BOOK_RETURN',
      description: `Book "${(borrowing.book as any).title}" returned`,
      ipAddress: req.ip,
      metadata: {
        borrowingId: borrowing.borrowingId,
        bookTitle: (borrowing.book as any).title,
        borrowerType: borrowing.borrowerType,
        returnDate: actualReturnDate,
        fine,
        returnedTo: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: fine > 0 ? `Book returned with fine of ${fine} ETB` : 'Book returned successfully',
      data: {
        borrowing,
        fine: {
          amount: fine,
          currency: 'ETB',
          reason: fine > 0 ? 'Late return' : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search books in library
 * Implements Req 11.6
 */
export const searchBooks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, category, author, isbn, available = 'all' } = req.query;

    const filter: any = {};

    // Text search across title, author, and category
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (author) {
      filter.author = { $regex: author, $options: 'i' };
    }

    if (isbn) {
      filter.isbn = isbn;
    }

    if (available === 'true') {
      filter.availableCopies = { $gt: 0 };
    }

    const books = await Book.find(filter)
      .populate('addedBy', 'firstName lastName')
      .sort({ title: 1 });

    res.json({
      success: true,
      data: {
        books,
        count: books.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get borrowing history for a user
 * Implements Req 11.7
 */
export const getBorrowingHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: borrowerId } = req.params;
    const { borrowerType, status } = req.query;

    if (!borrowerType || !['Student', 'Teacher'].includes(borrowerType as string)) {
      throw new ApiError(400, 'Valid borrower type is required');
    }

    const filter: any = {
      borrower: borrowerId,
      borrowerType,
    };

    if (status) {
      filter.status = status;
    }

    const borrowings = await Borrowing.find(filter)
      .populate('book', 'title author isbn category')
      .populate('issuedBy', 'firstName lastName')
      .populate('returnedTo', 'firstName lastName')
      .sort({ issueDate: -1 });

    // Calculate statistics
    const stats = {
      totalBorrowings: borrowings.length,
      currentBorrowings: borrowings.filter((b) => ['Borrowed', 'Overdue'].includes(b.status)).length,
      totalFines: borrowings.reduce((sum, b) => sum + b.fine, 0),
      overdueBooks: borrowings.filter((b) => b.status === 'Overdue').length,
    };

    res.json({
      success: true,
      data: {
        borrowings,
        statistics: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue books report
 * Implements Req 11.8
 */
export const getOverdueBooksReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const overdueBooks = await Borrowing.find({
      dueDate: { $lt: new Date() },
      status: { $in: ['Borrowed', 'Overdue'] },
    })
      .populate('book', 'title author isbn')
      .populate('borrower', 'firstName lastName studentId teacherId')
      .populate('issuedBy', 'firstName lastName')
      .sort({ dueDate: 1 });

    // Update status to 'Overdue' and calculate fines
    const updatedOverdueBooks = [];
    for (const borrowing of overdueBooks) {
      if (borrowing.status !== 'Overdue') {
        borrowing.status = 'Overdue';
        await borrowing.save();
      }

      // Calculate current fine
      const daysOverdue = Math.ceil((Date.now() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const currentFine = daysOverdue * borrowing.finePerDay;

      updatedOverdueBooks.push({
        ...borrowing.toObject(),
        daysOverdue,
        currentFine,
      });
    }

    const summary = {
      totalOverdueBooks: updatedOverdueBooks.length,
      totalFineAmount: updatedOverdueBooks.reduce((sum, book) => sum + book.currentFine, 0),
      oldestOverdueDate: updatedOverdueBooks.length > 0 ? updatedOverdueBooks[0].dueDate : null,
    };

    res.json({
      success: true,
      data: {
        summary,
        overdueBooks: updatedOverdueBooks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get library statistics
 */
export const getLibraryStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Book statistics
    const totalBooks = await Book.countDocuments();
    const totalCopies = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]);
    const availableCopies = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$availableCopies' } } }]);
    const borrowedCopies = (totalCopies[0]?.total || 0) - (availableCopies[0]?.total || 0);

    // Borrowing statistics
    const activeBorrowings = await Borrowing.countDocuments({ status: { $in: ['Borrowed', 'Overdue'] } });
    const overdueBorrowings = await Borrowing.countDocuments({ status: 'Overdue' });
    const totalBorrowings = await Borrowing.countDocuments();

    // Category breakdown
    const categoryStats = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalCopies: { $sum: '$quantity' },
          availableCopies: { $sum: '$availableCopies' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentIssues = await Borrowing.countDocuments({ issueDate: { $gte: thirtyDaysAgo } });
    const recentReturns = await Borrowing.countDocuments({ 
      returnDate: { $gte: thirtyDaysAgo, $ne: null } 
    });

    const statistics = {
      books: {
        totalTitles: totalBooks,
        totalCopies: totalCopies[0]?.total || 0,
        availableCopies: availableCopies[0]?.total || 0,
        borrowedCopies,
        utilizationRate: totalCopies[0]?.total > 0 
          ? Math.round((borrowedCopies / (totalCopies[0]?.total)) * 100) 
          : 0,
      },
      borrowings: {
        active: activeBorrowings,
        overdue: overdueBorrowings,
        total: totalBorrowings,
        overdueRate: activeBorrowings > 0 
          ? Math.round((overdueBorrowings / activeBorrowings) * 100) 
          : 0,
      },
      categories: categoryStats,
      recentActivity: {
        issuesLast30Days: recentIssues,
        returnsLast30Days: recentReturns,
      },
    };

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update book details
 */
export const updateBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { title, author, category, publisher, publicationYear, quantity, location } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    const oldBook = { ...book.toObject() };

    // Update fields
    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (category) book.category = category.trim();
    if (publisher !== undefined) book.publisher = publisher?.trim();
    if (publicationYear !== undefined) book.publicationYear = publicationYear;
    if (location !== undefined) book.location = location?.trim();

    // Handle quantity changes
    if (quantity !== undefined) {
      if (quantity < 0) {
        throw new ApiError(400, 'Quantity must be non-negative');
      }

      const currentBorrowedCopies = book.quantity - book.availableCopies;
      if (quantity < currentBorrowedCopies) {
        throw new ApiError(400, `Cannot reduce quantity below ${currentBorrowedCopies} (currently borrowed copies)`);
      }

      const quantityDiff = quantity - book.quantity;
      book.quantity = quantity;
      book.availableCopies += quantityDiff; // Adjust available copies
    }

    await book.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'BOOK_UPDATE',
      description: `Book "${book.title}" updated`,
      ipAddress: req.ip,
      metadata: {
        bookId: book._id,
        oldTitle: oldBook.title,
        newTitle: book.title,
        oldQuantity: oldBook.quantity,
        newQuantity: book.quantity,
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all books with pagination
 */
/**
 * Delete book from library
 */
export const deleteBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    // Check if book has active borrowings
    const activeBorrowings = await Borrowing.countDocuments({
      book: id,
      status: { $in: ['Borrowed', 'Overdue'] },
    });

    if (activeBorrowings > 0) {
      throw new ApiError(400, `Cannot delete book with ${activeBorrowings} active borrowings`);
    }

    await Book.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'BOOK_DELETE',
      description: `Book "${book.title}" deleted from library`,
      ipAddress: req.ip,
      metadata: {
        bookId: book._id,
        title: book.title,
        deletedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all borrowings with filters
 */
export const listBorrowings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, borrowerType, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (borrowerType) filter.borrowerType = borrowerType;

    const skip = (Number(page) - 1) * Number(limit);

    const [borrowings, total] = await Promise.all([
      Borrowing.find(filter)
        .populate('book', 'title author isbn')
        .populate('borrower', 'firstName lastName studentId teacherId')
        .populate('issuedBy', 'firstName lastName')
        .populate('returnedTo', 'firstName lastName')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Borrowing.countDocuments(filter),
    ]);

    const now = Date.now();
    const enriched = borrowings.map((b) => {
      const obj: Record<string, any> = b.toObject();
      if (['Borrowed', 'Overdue'].includes(b.status) && b.dueDate) {
        const daysOverdue = Math.ceil((now - b.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        obj.daysOverdue = Math.max(0, daysOverdue);
        obj.currentFine = obj.daysOverdue * b.finePerDay;
      } else {
        obj.daysOverdue = 0;
        obj.currentFine = 0;
      }
      return obj;
    });

    res.json({
      success: true,
      data: {
        borrowings: enriched,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's borrowings
 */
export const getMyBorrowings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const student = await Student.findOne({ userId: req.user.id });
    const teacher = await Teacher.findOne({ userId: req.user.id });

    let borrowerId: string | null = null;
    let borrowerType: 'Student' | 'Teacher' | null = null;

    if (student) {
      borrowerId = student._id.toString();
      borrowerType = 'Student';
    } else if (teacher) {
      borrowerId = teacher._id.toString();
      borrowerType = 'Teacher';
    } else {
      res.json({ success: true, data: { borrowings: [], statistics: {} } });
      return;
    }

    const borrowings = await Borrowing.find({ borrower: borrowerId, borrowerType })
      .populate('book', 'title author isbn category')
      .populate('issuedBy', 'firstName lastName')
      .sort({ issueDate: -1 });

    const stats = {
      totalBorrowings: borrowings.length,
      currentBorrowings: borrowings.filter((b) => ['Borrowed', 'Overdue'].includes(b.status)).length,
      returnedBorrowings: borrowings.filter((b) => b.status === 'Returned').length,
      totalFines: borrowings.reduce((sum, b) => sum + b.fine, 0),
    };

    res.json({
      success: true,
      data: { borrowings, statistics: stats },
    });
  } catch (error) {
    next(error);
  }
};

export const listBooks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, category, available } = req.query;

    const filter: any = {};
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (available === 'true') filter.availableCopies = { $gt: 0 };

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate('addedBy', 'firstName lastName')
        .sort({ title: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Book.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};