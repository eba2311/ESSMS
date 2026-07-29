import mongoose, { Schema, Document } from 'mongoose';
import { StudentStatus, Stream, GradeLevel } from '../types';

export interface IStudent extends Document {
  studentId: string;
  admissionNumber?: string;
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
  nationality?: string;
  photo?: string;
  grade: GradeLevel;
  section?: mongoose.Types.ObjectId;
  stream?: Stream;
  academicYear?: string;
  enrollmentDate: Date;
  status: StudentStatus;
  guardians: mongoose.Types.ObjectId[];
  address: {
    city?: string;
    subcity?: string;
    woreda?: string;
    houseNumber?: string;
  };
  emergencyContact: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
    immunizations?: { name: string; date: Date }[];
  };
  previousSchool?: string;
  transferDate?: Date;
  transferSchool?: String;
  transferReason?: string;
  withdrawalDate?: Date;
  withdrawalReason?: string;
  suspensionDate?: Date;
  suspensionReason?: string;
  archivedDate?: Date;
  archivedReason?: string;
  graduationDate?: Date;
  statusHistory?: { status: StudentStatus; changedAt: Date; changedBy?: mongoose.Types.ObjectId; reason?: string }[];
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      unique: true,
      index: true,
    },
    admissionNumber: {
      type: String,
      unique: true,
      sparse: true,
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    nationality: {
      type: String,
      default: 'Ethiopian',
    },
    photo: String,
    grade: {
      type: Number,
      enum: [9, 10, 11, 12],
      required: true,
      index: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      index: true,
    },
    stream: {
      type: String,
      enum: Object.values(Stream),
    },
    academicYear: String,
    enrollmentDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(StudentStatus),
      default: StudentStatus.PENDING_APPROVAL,
      index: true,
    },
    guardians: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Guardian',
      },
    ],
    address: {
      city: String,
      subcity: String,
      woreda: String,
      houseNumber: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    medicalInfo: {
      bloodType: String,
      allergies: [String],
      chronicConditions: [String],
      medications: [String],
      immunizations: [{ name: String, date: Date }],
    },
    previousSchool: String,
    transferDate: Date,
    transferSchool: String,
    transferReason: String,
    withdrawalDate: Date,
    withdrawalReason: String,
    suspensionDate: Date,
    suspensionReason: String,
    archivedDate: Date,
    archivedReason: String,
    graduationDate: Date,
    statusHistory: [
      {
        status: { type: String, enum: Object.values(StudentStatus) },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient queries
StudentSchema.index({ grade: 1, section: 1 });
StudentSchema.index({ status: 1, grade: 1 });

// Virtual for full name
StudentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
StudentSchema.virtual('age').get(function () {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
