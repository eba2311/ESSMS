import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetable extends Document {
  section: mongoose.Types.ObjectId;
  academicYear: string;
  schedule: Array<{
    _id?: mongoose.Types.ObjectId;
    dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    periodNumber: number;
    startTime: string;
    endTime: string;
    subject?: mongoose.Types.ObjectId;
    teacher?: mongoose.Types.ObjectId;
    classroom?: mongoose.Types.ObjectId;
  }>;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema = new Schema<ITimetable>(
  {
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    schedule: [
      {
        dayOfWeek: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          required: true,
        },
        periodNumber: {
          type: Number,
          required: true,
          min: 1,
          max: 8,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
        subject: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
        },
        teacher: {
          type: Schema.Types.ObjectId,
          ref: 'Teacher',
        },
        classroom: {
          type: Schema.Types.ObjectId,
          ref: 'Classroom',
        },
      },
    ],
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
TimetableSchema.index({ section: 1, academicYear: 1 });

export const Timetable = mongoose.model<ITimetable>('Timetable', TimetableSchema);
