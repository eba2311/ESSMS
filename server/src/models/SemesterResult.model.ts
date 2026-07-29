import mongoose, { Schema, Document } from 'mongoose';

export interface ISemesterResult extends Document {
  student: mongoose.Types.ObjectId;
  semester: '1' | '2';
  subject: mongoose.Types.ObjectId;
  mark: number;
  grade: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const SemesterResultSchema = new Schema<ISemesterResult>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    semester: {
      type: String,
      enum: ['1', '2'],
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    mark: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - one result per student per subject per semester per year
SemesterResultSchema.index({ student: 1, subject: 1, semester: 1, academicYear: 1 }, { unique: true });

export const SemesterResult = mongoose.model<ISemesterResult>('SemesterResult', SemesterResultSchema);
