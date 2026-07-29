import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { FeeStructure, Payment, Student, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { PaymentMethod, GradeLevel } from '../types';
import { logger } from '../utils/logger';

/**
 * Create fee structure for a grade
 * Implements Req 10.1
 */
export const createFeeStructure = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { academicYear, grade, components, dueDate } = req.body;

    if (!academicYear || !grade || !components || !Array.isArray(components)) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Validate grade
    if (![9, 10, 11, 12].includes(grade)) {
      throw new ApiError(400, 'Invalid grade');
    }

    // Validate components
    if (components.length === 0) {
      throw new ApiError(400, 'At least one fee component is required');
    }

    for (const component of components) {
      if (!component.name || typeof component.amount !== 'number' || component.amount < 0) {
        throw new ApiError(400, 'Invalid fee component structure');
      }
    }

    // Check if fee structure already exists
    const existing = await FeeStructure.findOne({ academicYear, grade });
    if (existing) {
      throw new ApiError(400, `Fee structure for grade ${grade} in ${academicYear} already exists`);
    }

    // Create fee structure
    const feeStructure = await FeeStructure.create({
      academicYear,
      grade,
      components,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isActive: true,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'FEE_STRUCTURE_CREATE',
      description: `Fee structure created for grade ${grade}`,
      ipAddress: req.ip,
      metadata: {
        academicYear,
        grade,
        totalAmount: feeStructure.totalAmount,
        componentsCount: components.length,
        createdBy: req.user.userId,
      },
    });

    logger.info(`Fee structure created`, {
      academicYear,
      grade,
      totalAmount: feeStructure.totalAmount,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      data: feeStructure,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record payment
 * Implements Req 10.3, 10.4
 */
export const recordPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const {
      studentId,
      academicYear,
      amount,
      paymentMethod,
      transactionReference,
      date,
      remarks,
    } = req.body;

    if (!studentId || !academicYear || !amount || !paymentMethod) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new ApiError(400, 'Invalid payment method');
    }

    // Validate amount
    if (amount <= 0) {
      throw new ApiError(400, 'Payment amount must be positive');
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Create payment record (paymentId and receiptNumber auto-generated)
    const payment = await Payment.create({
      student: studentId,
      academicYear,
      amount,
      currency: 'ETB',
      paymentMethod,
      transactionReference,
      date: date ? new Date(date) : new Date(),
      receivedBy: req.user.id,
      remarks,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'PAYMENT_RECORD',
      description: `Payment recorded for student ${student.studentId}`,
      ipAddress: req.ip,
      metadata: {
        paymentId: payment.paymentId,
        receiptNumber: payment.receiptNumber,
        studentId: student.studentId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        receivedBy: req.user.userId,
      },
    });

    logger.info(`Payment recorded`, {
      paymentId: payment.paymentId,
      studentId: student.studentId,
      amount: payment.amount,
      receivedBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate digital receipt
 * Implements Req 10.4
 */
export const generateReceipt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('student', 'studentId firstName lastName section')
      .populate('receivedBy', 'firstName lastName')
      .populate({
        path: 'student',
        populate: {
          path: 'section',
          select: 'name grade',
        },
      });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // Generate receipt data
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.paymentId,
      student: {
        studentId: (payment.student as any).studentId,
        fullName: `${(payment.student as any).firstName} ${(payment.student as any).lastName}`,
        grade: (payment.student as any).section?.grade,
        section: (payment.student as any).section?.name,
      },
      payment: {
        amount: payment.amount,
        currency: payment.currency,
        method: payment.paymentMethod,
        date: payment.date,
        transactionReference: payment.transactionReference,
        remarks: payment.remarks,
      },
      receivedBy: {
        name: `${(payment.receivedBy as any).firstName} ${(payment.receivedBy as any).lastName}`,
      },
      academicYear: payment.academicYear,
      generatedAt: new Date(),
    };

    res.json({
      success: true,
      data: receiptData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate outstanding fees for a student
 * Implements Req 10.5, 10.6
 */
export const getStudentFeeStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: studentId } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const student = await Student.findById(studentId).populate('section', 'grade');
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    const grade = (student.section as any)?.grade;
    if (!grade) {
      throw new ApiError(400, 'Student must be assigned to a section');
    }

    // Get fee structure for student's grade
    const feeStructure = await FeeStructure.findOne({
      academicYear,
      grade,
      isActive: true,
    });

    if (!feeStructure) {
      throw new ApiError(404, `No fee structure found for grade ${grade} in ${academicYear}`);
    }

    // Get all payments by student for this academic year
    const payments = await Payment.find({
      student: studentId,
      academicYear,
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalBilled = feeStructure.totalAmount;
    const outstanding = Math.max(0, totalBilled - totalPaid);
    const isOverdue = feeStructure.dueDate && new Date() > feeStructure.dueDate && outstanding > 0;

    const feeStatus = {
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        grade,
      },
      academicYear,
      feeStructure: {
        totalAmount: totalBilled,
        components: feeStructure.components,
        dueDate: feeStructure.dueDate,
      },
      payments: {
        totalPaid,
        paymentCount: payments.length,
        payments: payments.sort((a, b) => b.date.getTime() - a.date.getTime()),
      },
      summary: {
        totalBilled,
        totalPaid,
        outstanding,
        isFullyPaid: outstanding === 0,
        isOverdue,
        paymentPercentage: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0,
      },
    };

    res.json({
      success: true,
      data: feeStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get fee collection report
 * Implements Req 10.7
 */
export const getFeeCollectionReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, grade, startDate, endDate } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const filter: any = { academicYear };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    // Get payments with student details
    let payments = await Payment.find(filter)
      .populate({
        path: 'student',
        select: 'studentId firstName lastName section',
        populate: {
          path: 'section',
          select: 'name grade',
        },
      })
      .sort({ date: -1 });

    // Filter by grade if specified
    if (grade) {
      payments = payments.filter((payment: any) => payment.student.section?.grade === Number(grade));
    }

    // Calculate summary statistics
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentsByMethod = payments.reduce((acc: any, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
      return acc;
    }, {});

    const paymentsByGrade = payments.reduce((acc: any, payment: any) => {
      const studentGrade = payment.student.section?.grade;
      if (studentGrade) {
        acc[studentGrade] = (acc[studentGrade] || 0) + payment.amount;
      }
      return acc;
    }, {});

    // Daily collection summary
    const dailyCollection = payments.reduce((acc: any, payment) => {
      const date = payment.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + payment.amount;
      return acc;
    }, {});

    const report = {
      academicYear,
      reportPeriod: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Current',
      },
      summary: {
        totalPayments: payments.length,
        totalAmount,
        currency: 'ETB',
        averagePayment: payments.length > 0 ? Math.round(totalAmount / payments.length) : 0,
      },
      breakdown: {
        byPaymentMethod: paymentsByMethod,
        byGrade: paymentsByGrade,
        dailyCollection: Object.entries(dailyCollection)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30), // Last 30 days
      },
      recentPayments: payments.slice(0, 20),
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get outstanding fees report
 * Implements Req 10.5, 10.8
 */
export const getOutstandingFeesReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, grade, threshold = 0 } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    // Get all fee structures for the academic year
    const filter: any = { academicYear, isActive: true };
    if (grade) filter.grade = Number(grade);

    const feeStructures = await FeeStructure.find(filter);

    const outstandingReport = [];

    for (const feeStructure of feeStructures) {
      // Get all students in this grade
      const students = await Student.find({
        status: 'Active',
      }).populate({
        path: 'section',
        match: { grade: feeStructure.grade },
        select: 'name grade',
      });

      const studentsInGrade = students.filter((s) => s.section);

      for (const student of studentsInGrade) {
        // Get payments for this student
        const payments = await Payment.find({
          student: student._id,
          academicYear,
        });

        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const outstanding = Math.max(0, feeStructure.totalAmount - totalPaid);

        if (outstanding > Number(threshold)) {
          const isOverdue = feeStructure.dueDate && new Date() > feeStructure.dueDate;

          outstandingReport.push({
            student: {
              id: student._id,
              studentId: student.studentId,
              fullName: student.fullName,
              grade: feeStructure.grade,
              section: (student.section as any).name,
            },
            fees: {
              totalBilled: feeStructure.totalAmount,
              totalPaid,
              outstanding,
              dueDate: feeStructure.dueDate,
              isOverdue,
              daysPastDue: isOverdue && feeStructure.dueDate 
                ? Math.floor((Date.now() - feeStructure.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0,
            },
          });
        }
      }
    }

    // Sort by outstanding amount (highest first)
    outstandingReport.sort((a, b) => b.fees.outstanding - a.fees.outstanding);

    const summary = {
      totalStudentsWithOutstanding: outstandingReport.length,
      totalOutstandingAmount: outstandingReport.reduce((sum, item) => sum + item.fees.outstanding, 0),
      overdueCount: outstandingReport.filter((item) => item.fees.isOverdue).length,
      totalOverdueAmount: outstandingReport
        .filter((item) => item.fees.isOverdue)
        .reduce((sum, item) => sum + item.fees.outstanding, 0),
    };

    res.json({
      success: true,
      data: {
        academicYear,
        summary,
        outstandingFees: outstandingReport,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List fee structures
 */
export const listFeeStructures = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, grade, isActive } = req.query;

    const filter: any = {};
    if (academicYear) filter.academicYear = academicYear;
    if (grade) filter.grade = Number(grade);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const feeStructures = await FeeStructure.find(filter).sort({ grade: 1, academicYear: -1 });

    res.json({
      success: true,
      data: feeStructures,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update fee structure
 */
export const updateFeeStructure = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { components, dueDate, isActive, academicYear, grade } = req.body;

    const feeStructure = await FeeStructure.findById(id);
    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found');
    }

    const oldStructure = { ...feeStructure.toObject() };

    if (components) {
      // Validate components
      for (const component of components) {
        if (!component.name || typeof component.amount !== 'number' || component.amount < 0) {
          throw new ApiError(400, 'Invalid fee component structure');
        }
      }
      feeStructure.components = components;
    }

    if (dueDate !== undefined) {
      feeStructure.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    if (isActive !== undefined) {
      feeStructure.isActive = isActive;
    }

    if (academicYear !== undefined) {
      feeStructure.academicYear = academicYear;
    }

    if (grade !== undefined) {
      feeStructure.grade = grade;
    }

    await feeStructure.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'FEE_STRUCTURE_UPDATE',
      description: `Fee structure updated for grade ${feeStructure.grade}`,
      ipAddress: req.ip,
      metadata: {
        feeStructureId: feeStructure._id,
        oldTotalAmount: oldStructure.totalAmount,
        newTotalAmount: feeStructure.totalAmount,
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Fee structure updated successfully',
      data: feeStructure,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFeeStructure = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const feeStructure = await FeeStructure.findById(id);
    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found');
    }

    await FeeStructure.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'FEE_STRUCTURE_DELETE',
      description: `Fee structure deleted for grade ${feeStructure.grade} (${feeStructure.academicYear})`,
      ipAddress: req.ip,
      metadata: {
        feeStructureId: feeStructure._id,
        deletedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Fee structure deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};