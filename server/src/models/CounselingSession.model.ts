import mongoose, { Schema, Document } from 'mongoose';
import CryptoJS from 'crypto-js';
import { config } from '../config';

export interface ICounselingSession extends Document {
  student: mongoose.Types.ObjectId;
  counselor: mongoose.Types.ObjectId;
  sessionDate: Date;
  sessionType: 'Academic' | 'Behavioral' | 'Personal' | 'Career' | 'Other';
  confidentialNotes: string;
  followUpDate?: Date;
  followUpRequired: boolean;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
  getDecryptedNotes(): string;
}

const CounselingSessionSchema = new Schema<ICounselingSession>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    counselor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionDate: {
      type: Date,
      required: true,
      index: true,
    },
    sessionType: {
      type: String,
      enum: ['Academic', 'Behavioral', 'Personal', 'Career', 'Other'],
      required: true,
    },
    confidentialNotes: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    followUpDate: Date,
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt confidential notes before saving
CounselingSessionSchema.pre('save', function (next) {
  if (this.isModified('confidentialNotes')) {
    this.confidentialNotes = CryptoJS.AES.encrypt(
      this.confidentialNotes,
      config.encryptionKey
    ).toString();
  }
  next();
});

// Method to decrypt notes
CounselingSessionSchema.methods.getDecryptedNotes = function (): string {
  const bytes = CryptoJS.AES.decrypt(this.confidentialNotes, config.encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const CounselingSession = mongoose.model<ICounselingSession>(
  'CounselingSession',
  CounselingSessionSchema
);
