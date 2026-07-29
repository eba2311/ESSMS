import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectResource extends Document {
  subject: mongoose.Types.ObjectId;
  name: string;
  type: 'Textbook' | 'Laboratory' | 'Equipment' | 'Other';
  description?: string;
  quantity: number;
  status: 'Available' | 'Limited' | 'Unavailable';
  createdAt: Date;
  updatedAt: Date;
}

const SubjectResourceSchema = new Schema<ISubjectResource>(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Textbook', 'Laboratory', 'Equipment', 'Other'],
      required: true,
    },
    description: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    status: {
      type: String,
      enum: ['Available', 'Limited', 'Unavailable'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

export const SubjectResource = mongoose.model<ISubjectResource>(
  'SubjectResource',
  SubjectResourceSchema
);
