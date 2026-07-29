import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentSubject extends Document {
  student: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  academicYear: string;
  grade: number;
  stream?: string;
  enrolledAt: Date;
  status: 'Active' | 'Dropped' | 'Completed';
  droppedAt?: Date;
  droppedReason?: string;
  completedAt?: Date;
}

const StudentSubjectSchema = new Schema<IStudentSubject>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    grade: {
      type: Number,
      required: true,
    },
    stream: String,
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Dropped', 'Completed'],
      default: 'Active',
    },
    droppedAt: Date,
    droppedReason: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

StudentSubjectSchema.index({ student: 1, subject: 1, academicYear: 1 }, { unique: true });
StudentSubjectSchema.index({ section: 1, academicYear: 1 });

export const StudentSubject = mongoose.model<IStudentSubject>('StudentSubject', StudentSubjectSchema);
