import mongoose, { Schema, Document } from 'mongoose';

export interface IClassroom extends Document {
  roomNumber: string;
  building?: string;
  floor?: number;
  capacity: number;
  type: 'Regular' | 'Laboratory' | 'Computer Lab' | 'Library';
  facilities: string[];
  status: 'Available' | 'Occupied' | 'Maintenance' | 'Unavailable';
  maintenanceSchedule: Array<{
    date: Date;
    description: string;
    performedBy?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    building: String,
    floor: Number,
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['Regular', 'Laboratory', 'Computer Lab', 'Library'],
      default: 'Regular',
    },
    facilities: [String],
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance', 'Unavailable'],
      default: 'Available',
      index: true,
    },
    maintenanceSchedule: [
      {
        date: Date,
        description: String,
        performedBy: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Classroom = mongoose.model<IClassroom>('Classroom', ClassroomSchema);
