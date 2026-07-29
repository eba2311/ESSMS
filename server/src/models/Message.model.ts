import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipients: mongoose.Types.ObjectId[];
  subject: string;
  body: string;
  threadId?: mongoose.Types.ObjectId;
  parentMessage?: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  readBy: mongoose.Types.ObjectId[];
  isDeletedBySender: boolean;
  deletedBy: mongoose.Types.ObjectId[];
  priority: 'Low' | 'Medium' | 'High';
  hasAttachments: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    threadId: { type: Schema.Types.ObjectId, ref: 'Message', index: true },
    parentMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeletedBySender: { type: Boolean, default: false },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    hasAttachments: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ recipients: 1, createdAt: -1 });
MessageSchema.index({ threadId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
