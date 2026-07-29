import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Alumni } from '../models';
import { ApiError } from '../middleware/errorHandler';

export const getAlumni = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { graduationYear, stream, page = 1, limit = 50 } = _req.query;
    const filter: any = {};
    if (graduationYear) filter.graduationYear = Number(graduationYear);
    if (stream) filter.stream = stream;
    const skip = (Number(page) - 1) * Number(limit);
    const [alumni, total] = await Promise.all([
      Alumni.find(filter).populate('student', 'firstName lastName userId').sort({ graduationYear: -1 }).skip(skip).limit(Number(limit)),
      Alumni.countDocuments(filter),
    ]);
    res.json({ success: true, data: { alumni, pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) } } });
  } catch (error) { next(error); }
};

export const getAlumnus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alumnus = await Alumni.findById(req.params.id).populate('student', 'firstName lastName userId');
    if (!alumnus) throw new ApiError(404, 'Alumnus not found');
    res.json({ success: true, data: alumnus });
  } catch (error) { next(error); }
};

export const updateAlumnus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alumnus = await Alumni.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alumnus) throw new ApiError(404, 'Alumnus not found');
    res.json({ success: true, data: alumnus });
  } catch (error) { next(error); }
};

export const getAlumniStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const total = await Alumni.countDocuments();
    const byYear = await Alumni.aggregate<{ _id: number; count: number }>([{ $group: { _id: '$graduationYear', count: { $sum: 1 } } }, { $sort: { _id: -1 } }]);
    const byStatus = await Alumni.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$currentEmployment.status', count: { $sum: 1 } } }]);
    res.json({ success: true, data: { total, byYear, byStatus } });
  } catch (error) { next(error); }
};
