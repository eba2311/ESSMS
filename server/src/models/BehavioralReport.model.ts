import mongoose, { Schema, Document } from 'mongoose';

export interface IBehavioralReport extends Document {
  student: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  incidentDate: Date;
  incidentType: 'Discipline' | 'Achievement' | 'Participation' | 'Other';
  severity: 'Minor' | 'Moderate' | 'Serious' | 'Critical';
  description: string;
  actionTaken?: string;
  followUp?: string;
  parentNotified: boolean;
  notificationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BehavioralReportSchema = new Schema<IBehavioralReport>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    incidentDate: {
      type: Date,
      required: true,
      index: true,
    },
    incidentType: {
      type: String,
      enum: ['Discipline', 'Achievement', 'Participation', 'Other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['Minor', 'Moderate', 'Serious', 'Critical'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    actionTaken: String,
    followUp: String,
    parentNotified: {
      type: Boolean,
      default: false,
    },
    notificationDate: Date,
  },
  {
    timestamps: true,
  }
);

BehavioralReportSchema.index({ student: 1, incidentDate: -1 });

export const BehavioralReport = mongoose.model<IBehavioralReport>(
  'BehavioralReport',
  BehavioralReportSchema
);
