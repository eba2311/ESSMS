import mongoose, { Schema, Document } from 'mongoose';
import { getNextSequence } from './Counter.model';

export interface IGuardian extends Document {
  guardianId: string;
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Other';
  phone: string;
  email?: string;
  occupation?: string;
  address: {
    city?: string;
    subcity?: string;
    woreda?: string;
  };
  students: mongoose.Types.ObjectId[];
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuardianSchema = new Schema<IGuardian>(
  {
    guardianId: {
      type: String,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian', 'Other'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    occupation: {
      type: String,
      trim: true,
    },
    address: {
      city: String,
      subcity: String,
      woreda: String,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate sequential guardian ID before validation
GuardianSchema.pre('validate', async function (next) {
  if (this.isNew && !this.guardianId) {
    this.guardianId = await getNextSequence('P');
  }
  next();
});

// Virtual for full name
GuardianSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const Guardian = mongoose.model<IGuardian>('Guardian', GuardianSchema);
