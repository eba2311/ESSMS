import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TransferLog } from '../models';
import { ApiError } from '../middleware/errorHandler';

export const getTransferLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1', limit = '50', type, studentId, sectionId,
      fromDate, toDate, includeDeleted,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));

    const filter: any = {};
    if (includeDeleted !== 'true') filter.isDeleted = false;
    if (type) filter.type = type;
    if (studentId) filter.student = studentId;
    if (sectionId) {
      filter.$or = [{ fromSection: sectionId }, { toSection: sectionId }];
    }
    if (fromDate || toDate) {
      filter.transferredAt = {};
      if (fromDate) filter.transferredAt.$gte = new Date(fromDate as string);
      if (toDate) filter.transferredAt.$lte = new Date(toDate as string);
    }

    const [logs, total] = await Promise.all([
      TransferLog.find(filter)
        .populate('student', 'firstName lastName studentId')
        .populate('fromSection', 'name grade stream')
        .populate('toSection', 'name grade stream')
        .populate('transferredBy', 'firstName lastName username role')
        .sort({ transferredAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      TransferLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { logs, total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransferLogById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const log = await TransferLog.findById(req.params.id)
      .populate('student', 'firstName lastName studentId grade')
      .populate('fromSection', 'name grade stream')
      .populate('toSection', 'name grade stream')
      .populate('transferredBy', 'firstName lastName username role');

    if (!log) throw new ApiError(404, 'Transfer log not found');

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const deleteTransferLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const log = await TransferLog.findById(req.params.id);
    if (!log) throw new ApiError(404, 'Transfer log not found');

    log.isDeleted = true;
    await log.save();

    res.json({ success: true, message: 'Transfer log deleted' });
  } catch (error) {
    next(error);
  }
};

export const restoreTransferLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const log = await TransferLog.findById(req.params.id);
    if (!log) throw new ApiError(404, 'Transfer log not found');
    if (!log.isDeleted) throw new ApiError(400, 'Transfer log is not deleted');

    log.isDeleted = false;
    await log.save();

    res.json({ success: true, message: 'Transfer log restored' });
  } catch (error) {
    next(error);
  }
};
