import mongoose, { Schema, Document } from 'mongoose';
import { AssessmentType, AssessmentStatus } from '../types';

export interface IAssessment extends Document {
  assessmentId: string;
  subject: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  type: AssessmentType;
  title: string;
  description?: string;
  totalMarks: number;
  date: Date;
  academicYear: string;
  term: '1' | '2';
  status: AssessmentStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  teacherRemarks?: string;
  submittedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  publishedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  isLocked?: boolean;
  lockedBy?: mongoose.Types.ObjectId;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    assessmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AssessmentType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    term: {
      type: String,
      enum: ['1', '2'],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AssessmentStatus),
      default: AssessmentStatus.DRAFT,
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    teacherRemarks: String,
    submittedAt: Date,
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
    rejectionReason: String,
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedAt: Date,
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lockedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
AssessmentSchema.index({ section: 1, subject: 1, academicYear: 1 });
AssessmentSchema.index({ teacher: 1, academicYear: 1 });

// Generate unique assessment ID before validation
AssessmentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.assessmentId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.assessmentId = `ASS${year}${random}`;
  }
  next();
});

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
