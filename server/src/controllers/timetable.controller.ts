import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Timetable, Section, Subject, Teacher, Classroom, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const createTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { sectionId, academicYear, schedule, effectiveFrom, effectiveTo } = req.body;

    if (!sectionId || !academicYear || !schedule || !effectiveFrom) {
      throw new ApiError(400, 'sectionId, academicYear, schedule, and effectiveFrom are required');
    }

    const section = await Section.findById(sectionId);
    if (!section) throw new ApiError(404, 'Section not found');

    const existing = await Timetable.findOne({ section: sectionId, academicYear, isActive: true });
    if (existing) {
      throw new ApiError(400, 'Active timetable already exists for this section and academic year');
    }

    const timetable = await Timetable.create({
      section: sectionId,
      academicYear,
      schedule: schedule.map((s: any) => ({
        dayOfWeek: s.dayOfWeek,
        periodNumber: s.periodNumber,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subjectId || undefined,
        teacher: s.teacherId || undefined,
        classroom: s.classroomId || undefined,
      })),
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      createdBy: req.user.id,
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('section', 'name grade section')
      .populate('schedule.subject', 'name code')
      .populate('schedule.teacher', 'firstName lastName')
      .populate('schedule.classroom', 'roomNumber building');

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TIMETABLE_CREATE',
      description: `Timetable created for section ${section.name} (${academicYear})`,
      ipAddress: req.ip,
      metadata: { timetableId: timetable._id, section: sectionId, academicYear },
    });

    logger.info(`Timetable created for section ${section.name}`);
    res.status(201).json({ success: true, message: 'Timetable created', data: populated });
  } catch (error) {
    next(error);
  }
};

export const getTimetables = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sectionId, academicYear, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (sectionId) filter.section = sectionId;
    if (academicYear) filter.academicYear = academicYear;

    const skip = (Number(page) - 1) * Number(limit);
    const [timetables, total] = await Promise.all([
      Timetable.find(filter)
        .populate('section', 'name grade section')
        .populate('schedule.subject', 'name code')
        .populate('schedule.teacher', 'firstName lastName')
        .populate('schedule.classroom', 'roomNumber building')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Timetable.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        timetables,
        pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTimetableBySection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const { academicYear } = req.query;

    const filter: any = { section: sectionId, isActive: true };
    if (academicYear) filter.academicYear = academicYear;

    const timetable = await Timetable.findOne(filter)
      .populate('section', 'name grade section')
      .populate('schedule.subject', 'name code')
      .populate('schedule.teacher', 'firstName lastName')
      .populate('schedule.classroom', 'roomNumber building');

    if (!timetable) {
      res.json({ success: true, data: null, message: 'No timetable found for this section' });
      return;
    }

    res.json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
};

export const updateTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { schedule, effectiveFrom, effectiveTo, isActive } = req.body;

    const timetable = await Timetable.findById(id);
    if (!timetable) throw new ApiError(404, 'Timetable not found');

    if (schedule) {
      timetable.schedule = schedule.map((s: any) => ({
        dayOfWeek: s.dayOfWeek,
        periodNumber: s.periodNumber,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subjectId || undefined,
        teacher: s.teacherId || undefined,
        classroom: s.classroomId || undefined,
      }));
    }
    if (effectiveFrom) timetable.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined) timetable.effectiveTo = effectiveTo ? new Date(effectiveTo) : undefined;
    if (isActive !== undefined) timetable.isActive = isActive;

    await timetable.save();

    const populated = await Timetable.findById(timetable._id)
      .populate('section', 'name grade section')
      .populate('schedule.subject', 'name code')
      .populate('schedule.teacher', 'firstName lastName')
      .populate('schedule.classroom', 'roomNumber building');

    res.json({ success: true, message: 'Timetable updated', data: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const timetable = await Timetable.findById(id);
    if (!timetable) throw new ApiError(404, 'Timetable not found');

    timetable.isActive = false;
    await timetable.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TIMETABLE_DELETE',
      description: `Timetable deactivated for section`,
      ipAddress: req.ip,
      metadata: { timetableId: id },
    });

    res.json({ success: true, message: 'Timetable deactivated' });
  } catch (error) {
    next(error);
  }
};

export const addScheduleSlot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { dayOfWeek, periodNumber, startTime, endTime, subjectId, teacherId, classroomId } = req.body;

    if (!dayOfWeek || !periodNumber || !startTime || !endTime) {
      throw new ApiError(400, 'dayOfWeek, periodNumber, startTime, and endTime are required');
    }

    const timetable = await Timetable.findById(id);
    if (!timetable) throw new ApiError(404, 'Timetable not found');

    const conflict = timetable.schedule.find(
      s => s.dayOfWeek === dayOfWeek && s.periodNumber === periodNumber
    );
    if (conflict) throw new ApiError(400, 'Slot already exists for this day and period');

    timetable.schedule.push({
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      subject: subjectId || undefined,
      teacher: teacherId || undefined,
      classroom: classroomId || undefined,
    } as any);

    await timetable.save();
    res.json({ success: true, message: 'Slot added', data: timetable });
  } catch (error) {
    next(error);
  }
};

export const removeScheduleSlot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id, slotId } = req.params;

    const timetable = await Timetable.findById(id);
    if (!timetable) throw new ApiError(404, 'Timetable not found');

    const slotIdx = timetable.schedule.findIndex(s => s._id?.toString() === slotId);
    if (slotIdx === -1) throw new ApiError(404, 'Slot not found');

    timetable.schedule.splice(slotIdx, 1);
    await timetable.save();

    res.json({ success: true, message: 'Slot removed', data: timetable });
  } catch (error) {
    next(error);
  }
};
