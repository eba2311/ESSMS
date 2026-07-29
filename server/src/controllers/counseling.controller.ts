import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CounselingSession, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';

const decryptNotes = (session: any) => {
  const obj = session.toObject();
  obj.confidentialNotes = session.getDecryptedNotes();
  return obj;
};

export const createSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { studentId, sessionDate, sessionType, confidentialNotes, followUpDate, followUpRequired, status } = req.body;
    if (!studentId || !sessionDate || !sessionType || !confidentialNotes) throw new ApiError(400, 'Missing required fields: studentId, sessionDate, sessionType, confidentialNotes');
    const session = await CounselingSession.create({
      student: studentId, counselor: req.user.id, sessionDate, sessionType, confidentialNotes,
      followUpDate, followUpRequired: followUpRequired || false, status: status || 'Scheduled',
    });
    const populated = await CounselingSession.findById(session._id).select('+confidentialNotes')
      .populate('student', 'firstName lastName userId studentId')
      .populate('counselor', 'firstName lastName');
    if (!populated) throw new ApiError(500, 'Failed to create session');
    res.status(201).json({ success: true, data: decryptNotes(populated) });
  } catch (error) { next(error); }
};

export const getSessions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, status, type, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (studentId) filter.student = studentId;
    if (status) filter.status = status;
    if (type) filter.sessionType = type;
    const skip = (Number(page) - 1) * Number(limit);
    const [sessions, total] = await Promise.all([
      CounselingSession.find(filter).select('+confidentialNotes')
        .populate('student', 'firstName lastName userId studentId')
        .populate('counselor', 'firstName lastName')
        .sort({ sessionDate: -1 }).skip(skip).limit(Number(limit)),
      CounselingSession.countDocuments(filter),
    ]);
    const data = sessions.map(decryptNotes);
    res.json({ success: true, data: { sessions: data, pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) } } });
  } catch (error) { next(error); }
};

export const getSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await CounselingSession.findById(req.params.id).select('+confidentialNotes')
      .populate('student', 'firstName lastName userId studentId')
      .populate('counselor', 'firstName lastName userId');
    if (!session) throw new ApiError(404, 'Session not found');
    res.json({ success: true, data: decryptNotes(session) });
  } catch (error) { next(error); }
};

export const updateSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const session = await CounselingSession.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('+confidentialNotes')
      .populate('student', 'firstName lastName userId studentId')
      .populate('counselor', 'firstName lastName');
    if (!session) throw new ApiError(404, 'Session not found');
    res.json({ success: true, data: decryptNotes(session) });
  } catch (error) { next(error); }
};

export const deleteSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const session = await CounselingSession.findByIdAndDelete(req.params.id);
    if (!session) throw new ApiError(404, 'Session not found');
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'COUNSELING_DELETE',
      description: `Counseling session deleted for student`,
      ipAddress: req.ip,
      metadata: { sessionId: req.params.id },
    });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) { next(error); }
};
