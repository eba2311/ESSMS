import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Message, User, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { recipientId, recipientRole, recipients, subject, body, threadId, priority = 'Medium' } = req.body;

    if (!subject || !body) {
      throw new ApiError(400, 'Subject and body are required');
    }

    let recipientIds: string[] = [];

    // Role-based bulk send
    if (recipientRole) {
      const roleUsers = await User.find({ role: recipientRole, isActive: true }).select('_id');
      if (roleUsers.length === 0) {
        throw new ApiError(404, 'No active users found with the specified role');
      }
      recipientIds = roleUsers.map(u => u._id.toString());

      const senderId = req.user.id;
      const messages = roleUsers.map(u => ({
        sender: senderId,
        recipients: [u._id],
        subject: subject.trim(),
        body: body.trim(),
        priority,
      }));

      await Message.insertMany(messages);

      await AuditLog.create({
        userId: req.user.id,
        activityType: 'MESSAGE_SEND',
        description: `Bulk message "${subject}" sent to ${roleUsers.length} users with role ${recipientRole}`,
        ipAddress: req.ip,
        metadata: { recipientRole, recipientCount: roleUsers.length, subject },
      });

      res.status(201).json({
        success: true,
        message: `Message sent to ${roleUsers.length} users`,
        data: { recipientCount: roleUsers.length },
      });
      return;
    }

    if (recipientId) recipientIds = [recipientId];
    if (recipients) recipientIds = Array.isArray(recipients) ? recipients : [recipients];

    if (recipientIds.length === 0) {
      throw new ApiError(400, 'At least one recipient is required');
    }

    const validUsers = await User.find({ _id: { $in: recipientIds }, isActive: true }).select('_id');
    if (validUsers.length === 0) {
      throw new ApiError(404, 'No valid recipients found');
    }

    let parentMessage: any = null;
    if (threadId) {
      parentMessage = await Message.findById(threadId);
      if (!parentMessage) throw new ApiError(404, 'Thread not found');
    }

    const message = await Message.create({
      sender: req.user.id,
      recipients: validUsers.map(u => u._id),
      subject: subject.trim(),
      body: body.trim(),
      threadId: parentMessage ? parentMessage.threadId || parentMessage._id : undefined,
      parentMessage: parentMessage ? parentMessage._id : undefined,
      priority,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'firstName lastName userId')
      .populate('recipients', 'firstName lastName userId');

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'MESSAGE_SEND',
      description: `Message "${subject}" sent to ${validUsers.length} recipient(s)`,
      ipAddress: req.ip,
      metadata: { messageId: message._id, recipients: validUsers.length, subject },
    });

    logger.info(`Message sent`, { messageId: message._id, sender: req.user.userId, recipients: validUsers.length });

    res.status(201).json({ success: true, message: 'Message sent', data: populated });
  } catch (error) {
    next(error);
  }
};

export const getInbox = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { page = 1, limit = 20, unread } = req.query;

    const filter: any = {
      recipients: req.user.id,
      deletedBy: { $ne: req.user.id },
    };

    if (unread === 'true') {
      filter.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total, unreadCount] = await Promise.all([
      Message.find(filter)
        .populate('sender', 'firstName lastName userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments(filter),
      Message.countDocuments({ recipients: req.user.id, isRead: false, deletedBy: { $ne: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        unreadCount,
        pagination: {
          current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOutbox = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { page = 1, limit = 20 } = req.query;

    const filter: any = { sender: req.user.id, isDeletedBySender: false };
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate('recipients', 'firstName lastName userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getThread = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { threadId } = req.params;

    const threadRoot = await Message.findById(threadId);
    if (!threadRoot) throw new ApiError(404, 'Thread not found');

    const uid = req.user!.id;
    const isParticipant = threadRoot.sender.toString() === uid ||
      threadRoot.recipients.some(r => r.toString() === uid);
    if (!isParticipant) throw new ApiError(403, 'Not a participant in this thread');

    const threadMessages = await Message.find({
      $or: [
        { _id: threadId },
        { threadId },
      ],
    })
      .populate('sender', 'firstName lastName userId')
      .populate('recipients', 'firstName lastName userId')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { messages: threadMessages } });
  } catch (error) {
    next(error);
  }
};

export const markMessageRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;

    const message = await Message.findOne({ _id: id, recipients: req.user.id });
    if (!message) throw new ApiError(404, 'Message not found');

    const uid2 = req.user!.id;
    if (!message.readBy.some(r => r.toString() === uid2)) {
      message.readBy.push(uid2 as any);
    }

    const allRecipientsRead = message.recipients.every(r =>
      message.readBy.some(rb => rb.toString() === r.toString())
    );
    if (allRecipientsRead) {
      message.isRead = true;
      message.readAt = new Date();
    }

    await message.save();

    res.json({ success: true, message: 'Message marked as read', data: message });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) throw new ApiError(404, 'Message not found');

    const uid3 = req.user!.id;
    const isSender = message.sender.toString() === uid3;
    const isRecipient = message.recipients.some(r => r.toString() === uid3);

    if (!isSender && !isRecipient) throw new ApiError(403, 'Not authorized');

    if (isSender) {
      message.isDeletedBySender = true;
    }
    if (isRecipient) {
      if (!message.deletedBy.some(r => r.toString() === req.user!.id)) {
        message.deletedBy.push(req.user!.id as any);
      }
    }

    await message.save();
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

export const markAllMessagesRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const result = await Message.updateMany(
      { recipients: req.user.id, isRead: false, deletedBy: { $ne: req.user.id } },
      { isRead: true, readAt: new Date(), $addToSet: { readBy: req.user.id } }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
      data: { markedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const count = await Message.countDocuments({
      recipients: req.user.id,
      isRead: false,
      deletedBy: { $ne: req.user.id },
    });

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};
