import mongoose, { Schema, Document } from 'mongoose';
import { PaymentMethod } from '../types';

export interface IPayment extends Document {
  paymentId: string;
  student: mongoose.Types.ObjectId;
  academicYear: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  date: Date;
  receivedBy: mongoose.Types.ObjectId;
  receiptNumber: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    transactionReference: String,
    date: {
      type: Date,
      required: true,
      index: true,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    remarks: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
PaymentSchema.index({ student: 1, academicYear: 1 });

// Generate unique payment ID and receipt number before validation
PaymentSchema.pre('validate', async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    if (!this.paymentId) {
      this.paymentId = `PAY${year}${random}`;
    }
    
    if (!this.receiptNumber) {
      const timestamp = Date.now();
      this.receiptNumber = `REC${year}${timestamp}${random}`;
    }
  }
  next();
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
