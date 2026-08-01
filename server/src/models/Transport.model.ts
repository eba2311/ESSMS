import mongoose, { Schema, Document } from 'mongoose';

export interface IBus extends Document {
  plateNumber: string;
  busNumber: string;
  capacity: number;
  driverName: string;
  driverPhone?: string;
  driverLicense?: string;
  routeName: string;
  routeStops: string[];
  fee: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusSchema = new Schema<IBus>(
  {
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      trim: true,
    },
    driverLicense: {
      type: String,
      trim: true,
    },
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    routeStops: {
      type: [String],
      default: [],
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Inactive'],
      default: 'Active',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Transport = mongoose.model<IBus>('Transport', BusSchema);
