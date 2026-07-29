import mongoose, { Schema } from 'mongoose';
import { getNextSequence } from './Counter.model';

export interface IDocument extends mongoose.Document {
  documentId: string;
  student?: mongoose.Types.ObjectId;
  teacher?: mongoose.Types.ObjectId;
  title: string;
  documentType: 'Birth Certificate' | 'ID Card' | 'Transcript' | 'Medical Record' | 'Transfer Letter' | 'Photo' | 'Other';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  notes?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentId: {
      type: String,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      index: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['Birth Certificate', 'ID Card', 'Transcript', 'Medical Record', 'Transfer Letter', 'Photo', 'Other'],
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    notes: String,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.pre('validate', async function (next) {
  if (!this.documentId) {
    this.documentId = await getNextSequence('DOC');
  }
  next();
});

export const Document = mongoose.model<IDocument>('Document', DocumentSchema);
