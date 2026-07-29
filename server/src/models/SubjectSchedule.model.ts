import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectSchedule extends Document {
  subject: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  teacher?: mongoose.Types.ObjectId;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  academicYear: string;
  semester: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectScheduleSchema = new Schema<ISubjectSchedule>(
  {
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
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

SubjectScheduleSchema.index({ section: 1, dayOfWeek: 1, startTime: 1, academicYear: 1, semester: 1 });
SubjectScheduleSchema.index({ teacher: 1, dayOfWeek: 1, startTime: 1, academicYear: 1, semester: 1 });
SubjectScheduleSchema.index({ subject: 1, section: 1, academicYear: 1, semester: 1 });

export const SubjectSchedule = mongoose.model<ISubjectSchedule>(
  'SubjectSchedule',
  SubjectScheduleSchema
);
