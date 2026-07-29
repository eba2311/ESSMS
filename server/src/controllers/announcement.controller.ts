import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Announcement, User, Section, AuditLog, Notification } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from '../types';
import { logger } from '../utils/logger';

/* ───────── HELPERS ───────── */

const AUDIENCE_OPTIONS = ['All', 'Students', 'Teachers', 'Parents', 'Staff', 'SubjectTeachers'];
const STATUSES = ['Draft', 'Scheduled', 'Published', 'Expired', 'Archived'];

function canCreateByRole(role: string): string[] {
  switch (role) {
    case UserRole.SYSTEM_ADMIN: return AUDIENCE_OPTIONS;
    case UserRole.SCHOOL_DIRECTOR: return ['All', 'Students', 'Teachers', 'Parents', 'Staff'];
    case UserRole.ACADEMIC_HEAD: return ['All', 'Students', 'Teachers'];
    case UserRole.REGISTRAR: return ['Students', 'Parents'];
    case UserRole.FINANCE_OFFICER: return ['Students', 'Parents'];
    case UserRole.TEACHER: return ['Students'];
    case UserRole.COUNSELOR: return ['Students', 'Teachers', 'Parents'];
    default: return [];
  }
}

function canPublishByRole(role: string): boolean {
  return [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD].includes(role as any);
}

async function buildAudienceFilter(announcement: any, userId: string, userRole: string): Promise<any> {
  const filter: any = { isActive: true, status: 'Published', publishDate: { $lte: new Date() } };
  const orClauses: any[] = [];

  const audiences = announcement?.targetAudience || [];
  if (audiences.includes('All')) return filter;

  if (audiences.includes('Students') && ['student', 'parent'].includes(userRole)) {
    orClauses.push({ targetAudience: 'Students' });
  }
  if (audiences.includes('Teachers') && userRole === 'teacher') {
    orClauses.push({ targetAudience: 'Teachers' });
  }
  if (audiences.includes('Parents') && userRole === 'parent') {
    orClauses.push({ targetAudience: 'Parents' });
  }
  if (audiences.includes('Staff') && ['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'counselor', 'librarian'].includes(userRole)) {
    orClauses.push({ targetAudience: 'Staff' });
  }

  if (orClauses.length > 0) filter.$or = orClauses;
  return filter;
}

/* ───────── LIST ANNOUNCEMENTS ───────── */

export const listAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { category, status, priority, search, page = 1, limit = 20 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    const filter: any = { isActive: true };
    if (category) filter.category = category;
    if (status) filter.status = status;
    else if (![UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD].includes(userRole as any)) {
      filter.status = { $in: ['Published', 'Scheduled'] };
    }
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { content: { $regex: String(search), $options: 'i' } },
      ];
    }

    // Role-based visibility — users see only what's targeted at them
    if (![UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD].includes(userRole as any)) {
      const roleFilters: any[] = [];
      if (['student', 'parent'].includes(userRole)) roleFilters.push({ targetAudience: 'All' }, { targetAudience: 'Students' });
      if (userRole === 'parent') roleFilters.push({ targetAudience: 'Parents' });
      if (['teacher'].includes(userRole)) roleFilters.push({ targetAudience: 'Teachers' }, { targetAudience: 'All' });
      if (['counselor', 'librarian', 'registrar', 'finance_officer'].includes(userRole)) roleFilters.push({ targetAudience: 'Staff' }, { targetAudience: 'All' });
      if (roleFilters.length > 0) filter.$or = roleFilters;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('publishedBy', 'firstName lastName role')
        .populate('targetSections', 'name grade')
        .sort({ priority: -1, publishDate: -1 })
        .skip(skip).limit(Number(limit)),
      Announcement.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: announcements,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) { next(error); }
};

/* ───────── GET SINGLE ───────── */

export const getAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id)
      .populate('publishedBy', 'firstName lastName role')
      .populate('targetSections', 'name grade')
      .populate('targetSubjects', 'name code');
    if (!announcement) throw new ApiError(404, 'Announcement not found');
    res.json({ success: true, data: announcement });
  } catch (error) { next(error); }
};

/* ───────── CREATE ───────── */

export const createAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const role = req.user.role;
    const allowedAudiences = canCreateByRole(role);
    if (allowedAudiences.length === 0) throw new ApiError(403, 'Your role cannot create announcements');

    const {
      title, content, category, priority, status, targetAudience, targetGrades,
      targetSections, targetSubjects, publishDate, scheduledAt, expiryDate, attachments,
    } = req.body;

    if (!title || !content) throw new ApiError(400, 'Title and content are required');

    // Validate audience against role permissions
    const audiences: string[] = Array.isArray(targetAudience) ? targetAudience : [targetAudience || 'All'];
    for (const a of audiences) {
      if (!allowedAudiences.includes(a)) throw new ApiError(403, `You cannot target "${a}"`);
    }

    // Subject teachers: validate subjects
    if (role === UserRole.TEACHER) {
      const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
      const teacherAssignments = await mongoose.model('TeacherAssignment').find({ teacher: teacher?._id, isActive: true }).distinct('subject');
      if (targetSubjects) {
        for (const subId of targetSubjects) {
          if (!teacherAssignments.some((ta: any) => ta.toString() === subId)) {
            throw new ApiError(403, 'You can only send announcements for your assigned subjects');
          }
        }
      }
    }

    const finalStatus = status === 'Published' && !canPublishByRole(role) ? 'Draft' : (status || 'Draft');

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'Academic',
      priority: priority || 'Medium',
      status: finalStatus,
      targetAudience: audiences,
      targetGrades: targetGrades || [],
      targetSections: targetSections || [],
      targetSubjects: targetSubjects || [],
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      attachments: attachments || [],
      publishedBy: req.user.id,
    });

    // Auto-publish if not draft and has publish permission
    if (finalStatus === 'Published') {
      await sendAnnouncementNotifications(announcement, req.user.id, req.ip || '');
    }

    await AuditLog.create({
      userId: req.user.id, activityType: 'ANNOUNCEMENT_CREATED',
      description: `Announcement "${announcement.title}" created (${finalStatus})`,
      ipAddress: req.ip,
      metadata: { announcementId: announcement._id, title: announcement.title, status: finalStatus, category, targetAudience: audiences },
    });

    logger.info(`Announcement created`, { announcementId: announcement._id, title: announcement.title, status: finalStatus });

    res.status(201).json({
      success: true, message: `Announcement ${finalStatus === 'Published' ? 'published' : 'saved as ' + finalStatus}`,
      data: announcement,
    });
  } catch (error) { next(error); }
};

/* ───────── UPDATE ───────── */

export const updateAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const role = req.user.role;

    const announcement = await Announcement.findById(id);
    if (!announcement) throw new ApiError(404, 'Announcement not found');

    const allowedAudiences = canCreateByRole(role);
    if (allowedAudiences.length === 0) throw new ApiError(403, 'Your role cannot edit announcements');

    const oldSnapshot = announcement.toObject();
    const updatable: any = {};
    const fields = ['title', 'content', 'category', 'priority', 'targetAudience', 'targetGrades', 'targetSections', 'targetSubjects', 'publishDate', 'scheduledAt', 'expiryDate', 'attachments'];

    for (const field of fields) {
      if (req.body[field] !== undefined) updatable[field] = req.body[field];
    }
    if (updatable.title) updatable.title = updatable.title.trim();
    if (updatable.content) updatable.content = updatable.content.trim();

    // Validate audience if changed
    if (updatable.targetAudience) {
      const audiences = Array.isArray(updatable.targetAudience) ? updatable.targetAudience : [updatable.targetAudience];
      for (const a of audiences) {
        if (!allowedAudiences.includes(a)) throw new ApiError(403, `You cannot target "${a}"`);
      }
    }

    // Status changes
    if (req.body.status) {
      if (![UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD].includes(role as any)) {
        throw new ApiError(403, 'You cannot change announcement status');
      }
      updatable.status = req.body.status;
      if (req.body.status === 'Published' && announcement.status !== 'Published') {
        // First time publishing
      }
    }

    Object.assign(announcement, updatable);
    await announcement.save();

    // Send notifications if newly published
    if (updatable.status === 'Published' && oldSnapshot.status !== 'Published') {
      await sendAnnouncementNotifications(announcement, req.user.id, req.ip || '');
    }

    await AuditLog.create({
      userId: req.user.id, activityType: 'ANNOUNCEMENT_UPDATED',
      description: `Announcement "${announcement.title}" updated`,
      ipAddress: req.ip,
      metadata: { announcementId: announcement._id, oldStatus: oldSnapshot.status, newStatus: announcement.status },
    });

    res.json({ success: true, message: 'Announcement updated', data: announcement });
  } catch (error) { next(error); }
};

/* ───────── DELETE / ARCHIVE ───────── */

export const deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new ApiError(404, 'Announcement not found');

    announcement.isActive = false;
    announcement.status = 'Archived';
    await announcement.save();

    await AuditLog.create({
      userId: req.user.id, activityType: 'ANNOUNCEMENT_DELETED',
      description: `Announcement "${announcement.title}" deleted/archived`,
      ipAddress: req.ip,
      metadata: { announcementId: announcement._id, title: announcement.title },
    });

    res.json({ success: true, message: 'Announcement archived' });
  } catch (error) { next(error); }
};

/* ───────── PUBLISH / UNPUBLISH / ARCHIVE ACTIONS ───────── */

export const publishAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    if (!canPublishByRole(req.user.role)) throw new ApiError(403, 'You do not have publish permission');

    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new ApiError(404, 'Announcement not found');

    announcement.status = 'Published';
    announcement.publishDate = new Date();
    await announcement.save();

    await sendAnnouncementNotifications(announcement, req.user.id, req.ip || '');

    await AuditLog.create({
      userId: req.user.id, activityType: 'ANNOUNCEMENT_PUBLISHED',
      description: `Announcement "${announcement.title}" published`,
      ipAddress: req.ip,
      metadata: { announcementId: announcement._id },
    });

    res.json({ success: true, message: 'Announcement published', data: announcement });
  } catch (error) { next(error); }
};

export const unpublishAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    if (!canPublishByRole(req.user.role)) throw new ApiError(403, 'You do not have unpublish permission');

    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new ApiError(404, 'Announcement not found');

    announcement.status = 'Draft';
    await announcement.save();

    await AuditLog.create({
      userId: req.user.id, activityType: 'ANNOUNCEMENT_UNPUBLISHED',
      description: `Announcement "${announcement.title}" unpublished`,
      ipAddress: req.ip,
      metadata: { announcementId: announcement._id },
    });

    res.json({ success: true, message: 'Announcement unpublished', data: announcement });
  } catch (error) { next(error); }
};

export const archiveAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new ApiError(404, 'Announcement not found');

    announcement.status = 'Archived';
    announcement.isActive = false;
    await announcement.save();

    await AuditLog.create({
      userId: req.user.id, activityType: 'ANNOUNCEMENT_ARCHIVED',
      description: `Announcement "${announcement.title}" archived`,
      ipAddress: req.ip,
      metadata: { announcementId: announcement._id },
    });

    res.json({ success: true, message: 'Announcement archived' });
  } catch (error) { next(error); }
};

/* ───────── MARK AS READ ───────── */

export const markAnnouncementRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new ApiError(404, 'Announcement not found');

    const alreadyRead = announcement.readBy.some((r) => r.user.toString() === req.user!.id);
    if (!alreadyRead) {
      announcement.readBy.push({ user: new mongoose.Types.ObjectId(req.user.id), readAt: new Date() });
      announcement.readCount = (announcement.readCount || 0) + 1;
      await announcement.save();
    }
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { next(error); }
};

/* ───────── GET STATS ───────── */

export const getAnnouncementStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [total, published, draft, expired, archived, totalReads] = await Promise.all([
      Announcement.countDocuments({ isActive: true }),
      Announcement.countDocuments({ status: 'Published', isActive: true }),
      Announcement.countDocuments({ status: 'Draft', isActive: true }),
      Announcement.countDocuments({ status: 'Expired', isActive: true }),
      Announcement.countDocuments({ status: 'Archived', isActive: true }),
      Announcement.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, total: { $sum: '$readCount' } } }]),
    ]);

    res.json({
      success: true,
      data: { total, published, draft, expired, archived, totalReads: totalReads[0]?.total || 0 },
    });
  } catch (error) { next(error); }
};

/* ───────── NOTIFICATIONS ───────── */

async function sendAnnouncementNotifications(announcement: any, userId: string, ip: string): Promise<void> {
  try {
    const targetUsers: Set<string> = new Set();
    const audiences = announcement.targetAudience || [];

    if (audiences.includes('All')) {
      const users = await User.find({ isActive: true }).distinct('_id');
      users.forEach((u: any) => targetUsers.add(u.toString()));
    } else {
      if (audiences.includes('Students')) {
        const users = await User.find({ role: 'student', isActive: true }).distinct('_id');
        users.forEach((u: any) => targetUsers.add(u.toString()));
      }
      if (audiences.includes('Teachers')) {
        const users = await User.find({ role: 'teacher', isActive: true }).distinct('_id');
        users.forEach((u: any) => targetUsers.add(u.toString()));
      }
      if (audiences.includes('Parents')) {
        const users = await User.find({ role: 'parent', isActive: true }).distinct('_id');
        users.forEach((u: any) => targetUsers.add(u.toString()));
      }
      if (audiences.includes('Staff')) {
        const users = await User.find({ role: { $in: ['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'counselor', 'librarian'] }, isActive: true }).distinct('_id');
        users.forEach((u: any) => targetUsers.add(u.toString()));
      }
    }

    // Grade-specific: find students in those grades
    if (announcement.targetGrades?.length > 0) {
      const students = await mongoose.model('Student').find({ grade: { $in: announcement.targetGrades } }).populate('userId');
      for (const s of students) {
        if (s.userId) targetUsers.add((s.userId as any)._id.toString());
      }
    }

    // Section-specific: find students in those sections
    if (announcement.targetSections?.length > 0) {
      const students = await mongoose.model('Student').find({ section: { $in: announcement.targetSections } }).populate('userId');
      for (const s of students) {
        if (s.userId) targetUsers.add((s.userId as any)._id.toString());
      }
    }

    const notifications = Array.from(targetUsers).map((u) => ({
      user: u,
      type: 'Announcement',
      title: announcement.title,
      message: announcement.content.substring(0, 200),
      priority: announcement.priority === 'Urgent' ? 'High' : 'Medium',
      metadata: { entityType: 'Announcement', entityId: announcement._id, category: announcement.category },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      logger.info(`Sent ${notifications.length} notifications for announcement`, { announcementId: announcement._id });
    }

    await AuditLog.create({
      userId, activityType: 'ANNOUNCEMENT_NOTIFICATIONS',
      description: `Notifications sent for "${announcement.title}" to ${notifications.length} users`,
      ipAddress: ip,
      metadata: { announcementId: announcement._id, recipientCount: notifications.length },
    });
  } catch (error: any) {
    logger.error('Error sending announcement notifications', { error: error.message });
  }
}