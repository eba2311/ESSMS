import mongoose, { Schema, Document } from 'mongoose';
import { Stream, GradeLevel } from '../types';

export interface IStatusHistory {
  status: string;
  changedAt: Date;
  changedBy: mongoose.Types.ObjectId;
  reason?: string;
}

export interface ISection extends Document {
  sectionCode: string;
  name: string;
  grade: GradeLevel;
  stream: Stream;
  academicYear: string;
  semester: '1' | '2';
  capacity: number;
  minCapacity: number;
  classroom?: mongoose.Types.ObjectId;
  building?: string;
  floor?: number;
  roomNumber?: string;
  assistantTeacher?: mongoose.Types.ObjectId;
  isActive: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  archiveReason?: string;
  restoredAt?: Date;
  restoredBy?: mongoose.Types.ObjectId;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: String,
  },
  { _id: false }
);

const SectionSchema = new Schema<ISection>(
  {
    sectionCode: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: Number,
      enum: [9, 10, 11, 12],
      required: true,
      index: true,
    },
    stream: {
      type: String,
      enum: Object.values(Stream),
      default: Stream.COMMON,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    semester: {
      type: String,
      enum: ['1', '2'],
      default: '1',
    },
    capacity: {
      type: Number,
      default: 50,
    },
    minCapacity: {
      type: Number,
      default: 10,
    },
    classroom: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
    },
    building: String,
    floor: Number,
    roomNumber: String,
    assistantTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    archiveReason: String,
    restoredAt: Date,
    restoredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    statusHistory: [StatusHistorySchema],
  },
  {
    timestamps: true,
  }
);

SectionSchema.index({ name: 1, grade: 1, academicYear: 1 }, { unique: true });
SectionSchema.index({ grade: 1, stream: 1, academicYear: 1 });

SectionSchema.pre('save', async function (next) {
  if (this.isNew && !this.sectionCode) {
    const { getNextSequence } = await import('./Counter.model');
    this.sectionCode = await getNextSequence('SEC');
  }
  next();
});

export const Section = mongoose.model<ISection>('Section', SectionSchema);
