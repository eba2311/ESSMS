import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnualResult extends Document {
  student: mongoose.Types.ObjectId;
  academicYear: string;
  semester1Total?: number;
  semester1Average?: number;
  semester1SectionRank?: number;
  semester1GradeRank?: number;
  semester1Result?: string;
  
  semester2Total?: number;
  semester2Average?: number;
  semester2SectionRank?: number;
  semester2GradeRank?: number;
  semester2Result?: string;
  
  annualAverage?: number;
  annualSectionRank?: number;
  annualGradeRank?: number;
  annualSchoolRank?: number;
  
  finalResult?: string;
  promotionStatus?: string;
  
  attendance?: number;
  conduct?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AnnualResultSchema = new Schema<IAnnualResult>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    semester1Total: Number,
    semester1Average: Number,
    semester1SectionRank: Number,
    semester1GradeRank: Number,
    semester1Result: String,
    
    semester2Total: Number,
    semester2Average: Number,
    semester2SectionRank: Number,
    semester2GradeRank: Number,
    semester2Result: String,
    
    annualAverage: Number,
    annualSectionRank: Number,
    annualGradeRank: Number,
    annualSchoolRank: Number,
    
    finalResult: String,
    promotionStatus: String,

    attendance: Number,
    conduct: String,
  },
  {
    timestamps: true,
  }
);

// Compound unique index
AnnualResultSchema.index({ student: 1, academicYear: 1 }, { unique: true });

export const AnnualResult = mongoose.model<IAnnualResult>('AnnualResult', AnnualResultSchema);
