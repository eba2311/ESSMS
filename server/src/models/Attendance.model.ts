import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from '../types';

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  subject?: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  arrivalTime?: string;
  lateReason?: string;
  remarks?: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
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
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      required: true,
    },
    arrivalTime: { type: String },
    lateReason: { type: String },
    remarks: String,
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ section: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
