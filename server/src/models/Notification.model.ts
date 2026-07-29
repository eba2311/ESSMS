import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from '../types';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  isRead: boolean;
  readAt?: Date;
  relatedEntity?: {
    entityType: string;
    entityId: mongoose.Types.ObjectId;
  };
  channels: ('In-App' | 'Email' | 'SMS')[];
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    relatedEntity: {
      entityType: String,
      entityId: Schema.Types.ObjectId,
    },
    channels: [
      {
        type: String,
        enum: ['In-App', 'Email', 'SMS'],
      },
    ],
    sentAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
