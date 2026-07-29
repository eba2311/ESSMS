import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Settings } from '../models';

export const getSettings = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create(req.body);
    else Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};
