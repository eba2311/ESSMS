import mongoose, { Schema, Document } from 'mongoose';
import { GradeLevel } from '../types';

export interface IFeeStructure extends Document {
  academicYear: string;
  grade: GradeLevel;
  components: Array<{
    name: string;
    amount: number;
    currency: string;
  }>;
  totalAmount: number;
  dueDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    grade: {
      type: Number,
      enum: [9, 10, 11, 12],
      required: true,
      index: true,
    },
    components: [
      {
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        currency: {
          type: String,
          default: 'ETB',
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
FeeStructureSchema.index({ academicYear: 1, grade: 1 }, { unique: true });

// Calculate total amount before validation
FeeStructureSchema.pre('validate', function (next) {
  this.totalAmount = this.components.reduce((sum, component) => sum + component.amount, 0);
  next();
});

export const FeeStructure = mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);
