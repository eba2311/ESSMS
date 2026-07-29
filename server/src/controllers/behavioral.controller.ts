import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { BehavioralReport, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';

export const createReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { studentId, incidentDate, incidentType, severity, description, actionTaken, followUp, parentNotified } = req.body;
    if (!studentId || !incidentDate || !incidentType || !severity || !description) throw new ApiError(400, 'Missing required fields');
    const report = await BehavioralReport.create({
      student: studentId, reportedBy: req.user.id, incidentDate, incidentType, severity, description,
      actionTaken, followUp, parentNotified, notificationDate: parentNotified ? new Date() : undefined,
    });
    const populated = await BehavioralReport.findById(report._id).populate('student', 'firstName lastName userId').populate('reportedBy', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, incidentType, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (studentId) filter.student = studentId;
    if (incidentType) filter.incidentType = incidentType;
    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      BehavioralReport.find(filter).populate('student', 'firstName lastName userId').populate('reportedBy', 'firstName lastName')
        .sort({ incidentDate: -1 }).skip(skip).limit(Number(limit)),
      BehavioralReport.countDocuments(filter),
    ]);
    res.json({ success: true, data: { reports, pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) } } });
  } catch (error) { next(error); }
};

export const getReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await BehavioralReport.findById(req.params.id).populate('student', 'firstName lastName userId').populate('reportedBy', 'firstName lastName');
    if (!report) throw new ApiError(404, 'Report not found');
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const updateReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const report = await BehavioralReport.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('student', 'firstName lastName').populate('reportedBy', 'firstName lastName');
    if (!report) throw new ApiError(404, 'Report not found');
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const deleteReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const report = await BehavioralReport.findByIdAndDelete(req.params.id);
    if (!report) throw new ApiError(404, 'Report not found');
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'BEHAVIORAL_REPORT_DELETE',
      description: `Deleted behavioral report for student`,
      ipAddress: req.ip,
      metadata: { reportId: report._id, studentId: report.student },
    });
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) { next(error); }
};
