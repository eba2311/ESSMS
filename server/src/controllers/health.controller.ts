import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { HealthRecord } from '../models';
import { ApiError } from '../middleware/errorHandler';

export const getHealthRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await HealthRecord.findOne({ student: req.params.studentId }).populate('student', 'firstName lastName userId');
    if (!record) throw new ApiError(404, 'Health record not found');
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const createHealthRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { studentId, bloodType, allergies, chronicConditions, medications, emergencyContact } = req.body;
    const existing = await HealthRecord.findOne({ student: studentId });
    if (existing) throw new ApiError(400, 'Health record already exists for this student');
    const record = await HealthRecord.create({ student: studentId, bloodType, allergies, chronicConditions, medications, emergencyContact });
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const updateHealthRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const record = await HealthRecord.findOneAndUpdate({ student: req.params.studentId }, req.body, { new: true, runValidators: true });
    if (!record) throw new ApiError(404, 'Health record not found');
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const addVisit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { date, reason, diagnosis, treatment, notes, attendedBy } = req.body;
    if (!date || !reason) throw new ApiError(400, 'Date and reason are required');
    const record = await HealthRecord.findOne({ student: req.params.studentId });
    if (!record) throw new ApiError(404, 'Health record not found');
    record.visits.push({ date, reason, diagnosis, treatment, notes, attendedBy } as any);
    await record.save();
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const addImmunization = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { name, date, notes } = req.body;
    if (!name || !date) throw new ApiError(400, 'Name and date are required');
    const record = await HealthRecord.findOne({ student: req.params.studentId });
    if (!record) throw new ApiError(404, 'Health record not found');
    record.immunizations.push({ name, date, notes } as any);
    await record.save();
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};
