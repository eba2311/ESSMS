import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Announcement, Notification, User, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { UserRole, NotificationType } from '../types';
import { emitToUser } from '../services/socket.service';
import { sendEmail } from '../services/email.service';

/**
 * Create announcement
 * Implements Req 12.1
 */
export const createAnnouncement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { title, content, targetAudience, isUrgent = false, expiresAt } = req.body;

    if (!title || !content || !targetAudience) {
      throw new ApiError(400, 'Missing required fields');
    }

    const validAudiences = ['All', 'Students', 'Teachers', 'Parents', 'Staff'];
    if (!validAudiences.includes(targetAudience)) {
      throw new ApiError(400, 'Invalid target audience');
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience],
      priority: isUrgent ? 'Urgent' : 'Medium',
      publishDate: new Date(),
      expiryDate: expiresAt ? new Date(expiresAt) : undefined,
      publishedBy: req.user.id,
      isActive: true,
    });

    // Create notifications for target audience
    await createAnnouncementNotifications(announcement, req.user.id, req.ip || '');

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ANNOUNCEMENT_CREATE',
      description: `Announcement "${title}" created for ${targetAudience}`,
      ipAddress: req.ip,
      metadata: {
        announcementId: announcement._id,
        title: announcement.title,
        targetAudience: announcement.targetAudience,
        isUrgent: announcement.priority === 'Urgent',
        createdBy: req.user.userId,
      },
    });

    logger.info(`Announcement created`, {
      announcementId: announcement._id,
      title: announcement.title,
      targetAudience: announcement.targetAudience,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create notifications for announcement target audience
 */
const createAnnouncementNotifications = async (
  announcement: any,
  createdById: string,
  ipAddress: string
): Promise<void> => {
  try {
    const targetUsers = [];

    const audience = Array.isArray(announcement.targetAudience)
      ? announcement.targetAudience[0]
      : announcement.targetAudience;

    const baseSelect = '_id role email';
    switch (audience) {
      case 'All':
        const allUsers = await User.find({ isActive: true }).select(baseSelect);
        targetUsers.push(...allUsers);
        break;
      
      case 'Students':
        const students = await User.find({ role: UserRole.STUDENT, isActive: true }).select(baseSelect);
        targetUsers.push(...students);
        break;
      
      case 'Teachers':
        const teachers = await User.find({ 
          role: UserRole.TEACHER, 
          isActive: true 
        }).select(baseSelect);
        targetUsers.push(...teachers);
        break;
      
      case 'Parents':
        const parents = await User.find({ role: UserRole.PARENT, isActive: true }).select(baseSelect);
        targetUsers.push(...parents);
        break;
      
      case 'Staff':
        const staff = await User.find({ 
          role: { 
            $in: [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.ACADEMIC_HEAD, UserRole.REGISTRAR, 
                  UserRole.FINANCE_OFFICER, UserRole.COUNSELOR, UserRole.LIBRARIAN] 
          }, 
          isActive: true 
        }).select(baseSelect);
        targetUsers.push(...staff);
        break;
    }

    // Create notifications in batches
    const notifications = targetUsers.map(user => ({
      recipient: user._id,
      type: 'Announcement',
      title: announcement.title,
      message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
      priority: announcement.priority === 'Urgent' ? 'High' : 'Medium',
      relatedEntity: {
        entityType: 'Announcement',
        entityId: announcement._id,
      },
      createdBy: createdById,
    }));

    if (notifications.length > 0) {
      const created = await Notification.insertMany(notifications);
      created.forEach((n) => {
        const recipientId = n.recipient?.toString();
        if (recipientId) emitToUser(recipientId, 'notification', n);
      });

      if (targetUsers.length > 0) {
        const emailUsers = targetUsers.filter((u: any) => u.email);
        const emailTasks = emailUsers.map((u: any) =>
          sendEmail({
            to: u.email,
            subject: `Announcement: ${announcement.title}`,
            text: announcement.content.substring(0, 500),
          }).catch(() => false)
        );
        Promise.allSettled(emailTasks).catch(() => {});
      }

      logger.info(`Created ${notifications.length} notifications for announcement`, {
        announcementId: announcement._id,
        targetAudience: announcement.targetAudience,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error creating announcement notifications', { error: message });
  }
};

/**
 * Get announcements for user
 * Implements Req 12.2
 */
export const getAnnouncements = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { page = 1, limit = 20, urgent } = req.query;

    // Determine user's target audiences
    const userTargetAudiences = ['All'];
    
    switch (req.user.role) {
      case UserRole.STUDENT:
        userTargetAudiences.push('Students');
        break;
      case UserRole.TEACHER:
        userTargetAudiences.push('Teachers');
        break;
      case UserRole.PARENT:
        userTargetAudiences.push('Parents');
        break;
      default:
        userTargetAudiences.push('Staff');
        break;
    }

    const filter: any = {
      targetAudience: { $in: userTargetAudiences },
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };

    if (urgent === 'true') {
      filter.priority = 'Urgent';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('publishedBy', 'firstName lastName role')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Announcement.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create notification
 * Implements Req 12.3
 */
export const createNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { recipientId, recipientRole, type, title, message, priority = 'Medium', relatedEntity, channels } = req.body;

    if (!Object.values(NotificationType).includes(type)) {
      throw new ApiError(400, 'Invalid notification type');
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(priority)) {
      throw new ApiError(400, 'Invalid priority level');
    }

    const validChannels = ['In-App', 'Email', 'SMS'];
    const notifChannels = Array.isArray(channels) && channels.length > 0
      ? channels.filter((c: string) => validChannels.includes(c))
      : ['In-App'];

    // Bulk notification by role
    if (recipientRole) {
      const roleUsers = await User.find({ role: recipientRole, isActive: true }).select('_id');
      if (roleUsers.length === 0) {
        throw new ApiError(404, 'No active users found with the specified role');
      }

      const userId = req.user.id;
      const notifications = roleUsers.map(u => ({
        recipient: u._id,
        type,
        title: title.trim(),
        message: message.trim(),
        priority,
        channels: notifChannels,
        relatedEntity,
        createdBy: userId,
      }));

      const created = await Notification.insertMany(notifications);
      created.forEach((n) => {
        const recipientId = n.recipient?.toString();
        if (recipientId) emitToUser(recipientId, 'notification', n);
      });

      if (notifChannels.includes('Email')) {
        const recipients = await User.find({ role: recipientRole, isActive: true }).select('email');
        const emailTasks = recipients.map((u) =>
          u.email ? sendEmail({ to: u.email, subject: title.trim(), text: message.trim() }) : Promise.resolve(false)
        );
        Promise.allSettled(emailTasks).catch(() => {});
      }

      await AuditLog.create({
        userId: req.user.id,
        activityType: 'NOTIFICATION_CREATE',
        description: `Bulk notification sent to ${roleUsers.length} users with role ${recipientRole}`,
        ipAddress: req.ip,
        metadata: {
          type,
          priority,
          recipientRole,
          recipientCount: roleUsers.length,
          createdBy: req.user.userId,
        },
      });

      res.status(201).json({
        success: true,
        message: `Notification sent to ${roleUsers.length} users`,
        data: { recipientCount: roleUsers.length },
      });
      return;
    }

    if (!recipientId || !title || !message) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new ApiError(404, 'Recipient not found');
    }

    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title: title.trim(),
      message: message.trim(),
      priority,
      channels: notifChannels,
      relatedEntity,
      createdBy: req.user.id,
    });

    emitToUser(recipientId, 'notification', notification);

    if (notifChannels.includes('Email') && recipient.email) {
      sendEmail({ to: recipient.email, subject: title.trim(), text: message.trim() }).catch(() => {});
    }

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'NOTIFICATION_CREATE',
      description: `Notification sent to ${recipient.firstName} ${recipient.lastName}`,
      ipAddress: req.ip,
      metadata: {
        notificationId: notification._id,
        recipientId: recipient.userId,
        type: notification.type,
        priority: notification.priority,
        createdBy: req.user.userId,
      },
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('recipient', 'firstName lastName userId')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: populatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user.id,
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user notifications
 * Implements Req 12.4
 */
export const getUserNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { page = 1, limit = 20, unread, type, priority, channel } = req.query;

    const filter: any = { recipient: req.user.id };

    if (unread === 'true') {
      filter.isRead = false;
    }

    if (type) {
      filter.type = type;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (channel) {
      filter.channels = channel;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * Implements Req 12.5
 */
export const markNotificationRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user.id,
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const result = await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: { markedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete announcement (deactivate)
 */
export const deleteAnnouncement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    announcement.isActive = false;
    await announcement.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ANNOUNCEMENT_DELETE',
      description: `Announcement "${announcement.title}" deactivated`,
      ipAddress: req.ip,
      metadata: {
        announcementId: announcement._id,
        title: announcement.title,
        deletedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Announcement deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { title, content, targetAudience, isUrgent, expiresAt } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new ApiError(404, 'Announcement not found');
    }

    const oldAnnouncement = { ...announcement.toObject() };

    if (title) announcement.title = title.trim();
    if (content) announcement.content = content.trim();
    if (targetAudience) {
      const validAudiences = ['All', 'Students', 'Teachers', 'Parents', 'Staff'];
      if (!validAudiences.includes(targetAudience)) {
        throw new ApiError(400, 'Invalid target audience');
      }
      announcement.targetAudience = Array.isArray(targetAudience) ? targetAudience : [targetAudience];
    }
    if (isUrgent !== undefined) announcement.priority = isUrgent ? 'Urgent' : 'Medium';
    if (expiresAt !== undefined) announcement.expiryDate = expiresAt ? new Date(expiresAt) : undefined;

    await announcement.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ANNOUNCEMENT_UPDATE',
      description: `Announcement "${announcement.title}" updated`,
      ipAddress: req.ip,
      metadata: {
        announcementId: announcement._id,
        oldTitle: oldAnnouncement.title,
        newTitle: announcement.title,
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};