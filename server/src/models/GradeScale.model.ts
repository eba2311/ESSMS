import mongoose, { Schema, Document } from 'mongoose';

export interface IGradeScale extends Document {
  name: string;
  typeWeights: { type: string; weight: number }[];
  gradeThresholds: { letter: string; minPercent: number; gradePoint: number }[];
  passThreshold: number;
  isActive: boolean;
  academicYear: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GradeScaleSchema = new Schema<IGradeScale>(
  {
    name: { type: String, required: true, trim: true },
    typeWeights: [{
      type: { type: String, required: true },
      weight: { type: Number, required: true, min: 0, max: 100 },
    }],
    gradeThresholds: [{
      letter: { type: String, required: true },
      minPercent: { type: Number, required: true, min: 0, max: 100 },
      gradePoint: { type: Number, required: true, min: 0, max: 4 },
    }],
    passThreshold: { type: Number, required: true, min: 0, max: 100, default: 50 },
    isActive: { type: Boolean, default: false, index: true },
    academicYear: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

GradeScaleSchema.index({ academicYear: 1, isActive: 1 });

export const GradeScale = mongoose.model<IGradeScale>('GradeScale', GradeScaleSchema);
