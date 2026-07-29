import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthRecord extends Document {
  student: mongoose.Types.ObjectId;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  immunizations: Array<{ name: string; date: Date; notes?: string }>;
  visits: Array<{ date: Date; reason: string; diagnosis?: string; treatment?: string; notes?: string; attendedBy?: string }>;
  emergencyContact?: { name: string; phone: string; relationship: string };
  createdAt: Date;
  updatedAt: Date;
}

const HealthRecordSchema = new Schema<IHealthRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true, index: true },
    bloodType: String,
    allergies: [String],
    chronicConditions: [String],
    medications: [String],
    immunizations: [{ name: String, date: Date, notes: String }],
    visits: [{ date: Date, reason: String, diagnosis: String, treatment: String, notes: String, attendedBy: String }],
    emergencyContact: { name: String, phone: String, relationship: String },
  },
  { timestamps: true }
);

export const HealthRecord = mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema);
