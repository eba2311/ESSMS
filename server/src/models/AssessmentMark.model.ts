import mongoose, { Schema, Document } from 'mongoose';
import { LetterGrade } from '../types';

export interface IAssessmentMark extends Document {
  assessment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  marksObtained: number;
  percentage: number;
  letterGrade: LetterGrade;
  gradePoint: number;
  remarks?: string;
  enteredBy: mongoose.Types.ObjectId;
  enteredAt: Date;
  modifiedBy?: mongoose.Types.ObjectId;
  modifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentMarkSchema = new Schema<IAssessmentMark>(
  {
    assessment: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    letterGrade: {
      type: String,
      enum: Object.values(LetterGrade),
    },
    gradePoint: {
      type: Number,
      min: 0,
      max: 4,
    },
    remarks: String,
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enteredAt: {
      type: Date,
      required: true,
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound unique index - one mark per student per assessment
AssessmentMarkSchema.index({ assessment: 1, student: 1 }, { unique: true });

// Calculate percentage, letter grade, and GPA before saving
AssessmentMarkSchema.pre('save', async function (next) {
  if (this.isModified('marksObtained')) {
    const assessment = await mongoose.model('Assessment').findById(this.assessment);
    if (assessment) {
      this.percentage = (this.marksObtained / assessment.totalMarks) * 100;

      // Fetch active grade scale to use dynamic thresholds
      const { calculateGradeFromPercentage } = await import('../utils/gradeCalculation');
      let gradeThresholds: { letter: string; minPercent: number; gradePoint: number }[] | undefined;

      try {
        const GradeScale = mongoose.model('GradeScale');
        let scale = await GradeScale.findOne({ academicYear: assessment.academicYear, isActive: true });
        if (!scale) scale = await GradeScale.findOne({ isActive: true }).sort({ createdAt: -1 });
        if (scale) gradeThresholds = scale.gradeThresholds;
      } catch {
        // GradeScale model not available, use defaults
      }

      const { letterGrade, gradePoint } = calculateGradeFromPercentage(this.percentage, gradeThresholds);
      this.letterGrade = letterGrade;
      this.gradePoint = gradePoint;
    }
  }
  next();
});

export const AssessmentMark = mongoose.model<IAssessmentMark>('AssessmentMark', AssessmentMarkSchema);
