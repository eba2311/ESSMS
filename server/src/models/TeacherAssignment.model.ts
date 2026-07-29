import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherAssignment extends Document {
  teacher: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  academicYear: string;
  periodsPerWeek: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAssignmentSchema = new Schema<ITeacherAssignment>(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    periodsPerWeek: {
      type: Number,
      default: 4,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
TeacherAssignmentSchema.index({ teacher: 1, academicYear: 1 });
TeacherAssignmentSchema.index({ section: 1, subject: 1, academicYear: 1 });
TeacherAssignmentSchema.index({ teacher: 1, section: 1, subject: 1, academicYear: 1 }, { unique: true });

export const TeacherAssignment = mongoose.model<ITeacherAssignment>(
  'TeacherAssignment',
  TeacherAssignmentSchema
);
