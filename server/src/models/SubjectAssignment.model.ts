import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectAssignment extends Document {
  subject: mongoose.Types.ObjectId;
  gradeLevel: 9 | 10 | 11 | 12;
  section?: mongoose.Types.ObjectId;
  teacher?: mongoose.Types.ObjectId;
  academicYear: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const SubjectAssignmentSchema = new Schema<ISubjectAssignment>(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    gradeLevel: {
      type: Number,
      enum: [9, 10, 11, 12],
      required: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

SubjectAssignmentSchema.index({ subject: 1, gradeLevel: 1, academicYear: 1 });
SubjectAssignmentSchema.index({ section: 1, subject: 1, academicYear: 1 }, { unique: true, sparse: true });

export const SubjectAssignment = mongoose.model<ISubjectAssignment>(
  'SubjectAssignment',
  SubjectAssignmentSchema
);
