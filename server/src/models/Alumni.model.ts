import mongoose, { Schema, Document } from 'mongoose';
import { Stream } from '../types';

export interface IAlumni extends Document {
  student: mongoose.Types.ObjectId;
  graduationYear: number;
  stream?: Stream;
  finalGPA?: number;
  rank?: number;
  currentEmployment: {
    status: 'Employed' | 'Self-Employed' | 'Unemployed' | 'Further Education' | 'Unknown';
    employer?: string;
    position?: string;
    startDate?: Date;
  };
  higherEducation: {
    enrolled?: boolean;
    institution?: string;
    program?: string;
    startDate?: Date;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  visibilityPreference: 'Public' | 'Alumni Only' | 'Private';
  createdAt: Date;
  updatedAt: Date;
}

const AlumniSchema = new Schema<IAlumni>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },
    graduationYear: {
      type: Number,
      required: true,
      index: true,
    },
    stream: {
      type: String,
      enum: Object.values(Stream),
    },
    finalGPA: Number,
    rank: Number,
    currentEmployment: {
      status: {
        type: String,
        enum: ['Employed', 'Self-Employed', 'Unemployed', 'Further Education', 'Unknown'],
        default: 'Unknown',
      },
      employer: String,
      position: String,
      startDate: Date,
    },
    higherEducation: {
      enrolled: Boolean,
      institution: String,
      program: String,
      startDate: Date,
    },
    contactInfo: {
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: String,
      address: String,
    },
    visibilityPreference: {
      type: String,
      enum: ['Public', 'Alumni Only', 'Private'],
      default: 'Public',
    },
  },
  {
    timestamps: true,
  }
);

AlumniSchema.index({ graduationYear: 1, stream: 1 });

// Prevent deletion of alumni records
AlumniSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  next(new Error('Alumni records cannot be deleted'));
});

export const Alumni = mongoose.model<IAlumni>('Alumni', AlumniSchema);
