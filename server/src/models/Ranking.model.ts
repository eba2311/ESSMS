import mongoose, { Schema, Document } from 'mongoose';
import { MeritCategory } from '../types';

export interface IRanking extends Document {
  student: mongoose.Types.ObjectId;
  academicYear: string;
  term: '1' | '2';
  overallAverage: number;
  gpa: number;
  sectionRank?: number;
  gradeRank?: number;
  streamRank?: number;
  schoolRank?: number;
  totalStudentsInSection?: number;
  totalStudentsInGrade?: number;
  totalStudentsInStream?: number;
  totalStudentsInSchool?: number;
  subjectAverages: Array<{
    subject: mongoose.Types.ObjectId;
    average: number;
    letterGrade: string;
    isHighestInSection?: boolean;
    isHighestInGrade?: boolean;
    isHighestInStream?: boolean;
    isHighestInSchool?: boolean;
  }>;
  meritCategory?: MeritCategory;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RankingSchema = new Schema<IRanking>(
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
    term: {
      type: String,
      enum: ['1', '2'],
      required: true,
    },
    overallAverage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    gpa: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
    },
    sectionRank: Number,
    gradeRank: Number,
    streamRank: Number,
    schoolRank: {
      type: Number,
      index: true,
    },
    totalStudentsInSection: Number,
    totalStudentsInGrade: Number,
    totalStudentsInStream: Number,
    totalStudentsInSchool: Number,
    subjectAverages: [
      {
        subject: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        average: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        letterGrade: {
          type: String,
          required: true,
        },
        isHighestInSection: Boolean,
        isHighestInGrade: Boolean,
        isHighestInStream: Boolean,
        isHighestInSchool: Boolean,
      },
    ],
    meritCategory: {
      type: String,
      enum: Object.values(MeritCategory),
    },
    calculatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
RankingSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });

// Determine merit category before saving
RankingSchema.pre('save', function (next) {
  if (this.overallAverage >= 90) {
    this.meritCategory = MeritCategory.ACADEMIC_EXCELLENCE;
  } else if (this.overallAverage >= 85) {
    this.meritCategory = MeritCategory.HONOR_STUDENT;
  } else {
    this.meritCategory = MeritCategory.REGULAR;
  }
  next();
});

export const Ranking = mongoose.model<IRanking>('Ranking', RankingSchema);
