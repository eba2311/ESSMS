import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectMaterial extends Document {
  subject: mongoose.Types.ObjectId;
  section?: mongoose.Types.ObjectId;
  title: string;
  type: 'Note' | 'PDF' | 'Assignment' | 'Project' | 'Other';
  fileUrl?: string;
  description?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectMaterialSchema = new Schema<ISubjectMaterial>(
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
    },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Note', 'PDF', 'Assignment', 'Project', 'Other'],
      required: true,
    },
    fileUrl: { type: String },
    description: { type: String, trim: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const SubjectMaterial = mongoose.model<ISubjectMaterial>(
  'SubjectMaterial',
  SubjectMaterialSchema
);
