import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicTerm extends Document {
  academicYear: string;
  term: '1' | '2';
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicTermSchema = new Schema<IAcademicTerm>(
  {
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    term: {
      type: String,
      enum: ['1', '2'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

AcademicTermSchema.index({ academicYear: 1, term: 1 }, { unique: true });
AcademicTermSchema.index({ isCurrent: 1 }, { sparse: true });

export const AcademicTerm = mongoose.model<IAcademicTerm>('AcademicTerm', AcademicTermSchema);
