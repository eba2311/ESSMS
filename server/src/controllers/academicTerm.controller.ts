import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AcademicTerm } from '../models';
import { ApiError } from '../middleware/errorHandler';

export const createTerm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const term = await AcademicTerm.create(req.body);
    res.status(201).json({ success: true, data: term });
  } catch (error) {
    if ((error as any)?.code === 11000) {
      next(new ApiError(409, 'Term with this academic year and term already exists'));
      return;
    }
    next(error);
  }
};

export const listTerms = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const terms = await AcademicTerm.find().sort({ academicYear: -1, term: 1 });
    res.json({ success: true, data: terms });
  } catch (error) {
    next(error);
  }
};

export const getCurrentTerm = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const term = await AcademicTerm.findOne({ isCurrent: true });
    if (!term) throw new ApiError(404, 'No current term set');
    res.json({ success: true, data: term });
  } catch (error) {
    next(error);
  }
};

export const setCurrentTerm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const term = await AcademicTerm.findById(id);
    if (!term) throw new ApiError(404, 'Term not found');

    await AcademicTerm.updateMany({ isCurrent: true }, { isCurrent: false });
    term.isCurrent = true;
    await term.save();

    res.json({ success: true, data: term });
  } catch (error) {
    next(error);
  }
};

export const updateTerm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const term = await AcademicTerm.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!term) throw new ApiError(404, 'Term not found');
    res.json({ success: true, data: term });
  } catch (error) {
    if ((error as any)?.code === 11000) {
      next(new ApiError(409, 'Term with this academic year and term already exists'));
      return;
    }
    next(error);
  }
};

export const deleteTerm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const term = await AcademicTerm.findByIdAndDelete(req.params.id);
    if (!term) throw new ApiError(404, 'Term not found');
    res.json({ success: true, message: 'Term deleted' });
  } catch (error) {
    next(error);
  }
};
