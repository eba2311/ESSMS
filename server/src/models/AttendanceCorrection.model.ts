import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceCorrection extends Document {
  attendance: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  date: Date;
  originalStatus: string;
  requestedStatus: string;
  reason: string;
  requestedBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceCorrectionSchema = new Schema<IAttendanceCorrection>(
  {
    attendance: {
      type: Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    date: { type: Date, required: true },
    originalStatus: { type: String, required: true },
    requestedStatus: { type: String, required: true },
    reason: { type: String, required: true },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewNotes: String,
  },
  { timestamps: true }
);

export const AttendanceCorrection = mongoose.model<IAttendanceCorrection>(
  'AttendanceCorrection',
  AttendanceCorrectionSchema
);
