import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Classroom, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const createClassroom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { roomNumber, building, floor, capacity, type, facilities } = req.body;
    if (!roomNumber || !capacity) throw new ApiError(400, 'Room number and capacity are required');
    const existing = await Classroom.findOne({ roomNumber });
    if (existing) throw new ApiError(400, 'Room number already exists');
    const classroom = await Classroom.create({ roomNumber, building, floor, capacity, type, facilities });
    await AuditLog.create({ userId: req.user.id, activityType: 'CLASSROOM_CREATE', description: `Classroom ${roomNumber} created`, ipAddress: req.ip });
    res.status(201).json({ success: true, data: classroom });
  } catch (error) { next(error); }
};

export const getClassrooms = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, type, page = 1, limit = 100 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const skip = (Number(page) - 1) * Number(limit);
    const [classrooms, total] = await Promise.all([
      Classroom.find(filter).sort({ roomNumber: 1 }).skip(skip).limit(Number(limit)),
      Classroom.countDocuments(filter),
    ]);
    res.json({ success: true, data: { classrooms, pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) } } });
  } catch (error) { next(error); }
};

export const getClassroom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) throw new ApiError(404, 'Classroom not found');
    res.json({ success: true, data: classroom });
  } catch (error) { next(error); }
};

export const updateClassroom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!classroom) throw new ApiError(404, 'Classroom not found');
    res.json({ success: true, data: classroom });
  } catch (error) { next(error); }
};

export const deleteClassroom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) throw new ApiError(404, 'Classroom not found');
    res.json({ success: true, message: 'Classroom deleted' });
  } catch (error) { next(error); }
};
