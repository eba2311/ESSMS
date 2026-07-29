import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncementRead {
  user: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface IAnnouncementAttachment {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: 'Academic' | 'Administrative' | 'Financial' | 'Events' | 'Emergency';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Draft' | 'Scheduled' | 'Published' | 'Expired' | 'Archived';
  targetAudience: string[];
  targetGrades: number[];
  targetSections: mongoose.Types.ObjectId[];
  targetSubjects: mongoose.Types.ObjectId[];
  targetUsers: mongoose.Types.ObjectId[];
  publishDate: Date;
  scheduledAt?: Date;
  expiryDate?: Date;
  attachments: IAnnouncementAttachment[];
  publishedBy: mongoose.Types.ObjectId;
  readBy: IAnnouncementRead[];
  readCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementReadSchema = new Schema<IAnnouncementRead>(
  { user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, readAt: { type: Date, default: Date.now } },
  { _id: false }
);

const AnnouncementAttachmentSchema = new Schema<IAnnouncementAttachment>(
  { filename: String, url: String, size: Number, mimetype: String },
  { _id: false }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String, enum: ['Academic', 'Administrative', 'Financial', 'Events', 'Emergency'],
      default: 'Academic', index: true,
    },
    priority: {
      type: String, enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium', index: true,
    },
    status: {
      type: String, enum: ['Draft', 'Scheduled', 'Published', 'Expired', 'Archived'],
      default: 'Draft', index: true,
    },
    targetAudience: [{
      type: String,
      enum: ['All', 'Students', 'Teachers', 'Parents', 'Staff', 'SubjectTeachers'],
    }],
    targetGrades: [{ type: Number, enum: [9, 10, 11, 12] }],
    targetSections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    targetSubjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    targetUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    publishDate: { type: Date, default: Date.now, index: true },
    scheduledAt: Date,
    expiryDate: Date,
    attachments: [AnnouncementAttachmentSchema],
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readBy: [AnnouncementReadSchema],
    readCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ status: 1, publishDate: -1 });
AnnouncementSchema.index({ isActive: 1, status: 1, publishDate: -1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);