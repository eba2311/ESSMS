import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Event } from '../models';
import { ApiError } from '../middleware/errorHandler';

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const event = await Event.create({ ...req.body, organizer: req.user.id });
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
};

export const getEvents = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, eventType, page = 1, limit = 100 } = _req.query;
    const filter: any = {};
    if (startDate) filter.startDate = { $gte: new Date(startDate as string) };
    if (endDate) filter.endDate = { $lte: new Date(endDate as string) };
    if (eventType) filter.eventType = eventType;
    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).populate('organizer', 'firstName lastName').sort({ startDate: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);
    res.json({ success: true, data: { events, pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) } } });
  } catch (error) { next(error); }
};

export const getEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'firstName lastName');
    if (!event) throw new ApiError(404, 'Event not found');
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) throw new ApiError(404, 'Event not found');
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) throw new ApiError(404, 'Event not found');
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
};
