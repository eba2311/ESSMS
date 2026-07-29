import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, activityType, success, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (activityType) filter.activityType = activityType;
    if (success !== undefined) filter.success = success === 'true';
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('userId', 'firstName lastName email').sort({ timestamp: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data: { logs, pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) } } });
  } catch (error) { next(error); }
};

export const getAuditLog = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('userId', 'firstName lastName email');
    if (!log) throw new ApiError(404, 'Audit log not found');
    res.json({ success: true, data: log });
  } catch (error) { next(error); }
};

export const getAuditStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const total = await AuditLog.countDocuments();
    const byType = await AuditLog.aggregate([{ $group: { _id: '$activityType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const successRate = await AuditLog.aggregate([{ $group: { _id: null, total: { $sum: 1 }, success: { $sum: { $cond: ['$success', 1, 0] } } } }]);
    const recent = await AuditLog.find().sort({ timestamp: -1 }).limit(5).populate('userId', 'firstName lastName');
    res.json({ success: true, data: { total, byType, successRate: successRate[0] || { total: 0, success: 0 }, recent } });
  } catch (error) { next(error); }
};
