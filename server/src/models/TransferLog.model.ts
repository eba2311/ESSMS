import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferLog extends Document {
  student: mongoose.Types.ObjectId;
  fromSection?: mongoose.Types.ObjectId;
  toSection?: mongoose.Types.ObjectId;
  fromGrade: number;
  toGrade: number;
  reason: string;
  transferredBy: mongoose.Types.ObjectId;
  transferredAt: Date;
  type: 'Section' | 'School' | 'Withdrawal';
  schoolName?: string;
  isDeleted: boolean;
}

const TransferLogSchema = new Schema<ITransferLog>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    fromSection: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
    },
    toSection: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
    },
    fromGrade: {
      type: Number,
      required: true,
    },
    toGrade: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    transferredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transferredAt: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['Section', 'School', 'Withdrawal'],
      default: 'Section',
    },
    schoolName: String,
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

TransferLogSchema.index({ student: 1, transferredAt: -1 });

export const TransferLog = mongoose.model<ITransferLog>('TransferLog', TransferLogSchema);
