import mongoose, { Schema, Document } from 'mongoose';
import { Stream, GradeLevel } from '../types';

export interface ISubject extends Document {
  code: string;
  name: string;
  shortName: string;
  subjectType: 'Compulsory' | 'Elective' | 'Practical';
  department: string;
  grades: GradeLevel[];
  streams: Stream[];
  isCore: boolean;
  description?: string;
  academicYear: string;
  semester: number;
  weeklyPeriods: number;
  status: 'Active' | 'Inactive' | 'Archived';
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: '',
    },
    subjectType: {
      type: String,
      enum: ['Compulsory', 'Elective', 'Practical'],
      default: 'Compulsory',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    grades: [{ type: Number, enum: [9, 10, 11, 12] }],
    streams: [{ type: String, enum: Object.values(Stream) }],
    isCore: { type: Boolean, default: true },
    description: { type: String, trim: true },
    academicYear: {
      type: String,
      required: true,
      default: () => {
        const y = new Date().getFullYear();
        return `${y}/${y + 1}`;
      },
    },
    semester: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    weeklyPeriods: {
      type: Number,
      default: 4,
      min: 1,
      max: 40,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
