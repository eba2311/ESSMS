import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherQualification {
  degree: string;
  field: string;
  institution: string;
  year: number;
}

export interface ITeacherLeave {
  type: 'Annual' | 'Sick' | 'Emergency' | 'Maternity' | 'Training';
  startDate: Date;
  endDate: Date;
  status: 'Pending' | 'AcademicApproved' | 'Approved' | 'Rejected' | 'Completed';
  reason?: string;
  academicApprovedBy?: mongoose.Types.ObjectId;
  directorApprovedBy?: mongoose.Types.ObjectId;
}

export interface ITeacherAttendance {
  date: Date;
  checkIn?: string;
  checkOut?: string;
  status: 'Present' | 'Late' | 'Early Departure' | 'Absent' | 'On Leave';
  notes?: string;
}

export interface ITeacherTransfer {
  fromSection?: mongoose.Types.ObjectId;
  fromSubject?: mongoose.Types.ObjectId;
  toSection?: mongoose.Types.ObjectId;
  toSubject?: mongoose.Types.ObjectId;
  reason: string;
  transferDate: Date;
  approvedBy?: mongoose.Types.ObjectId;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ITeacherTraining {
  title: string;
  provider: string;
  startDate: Date;
  endDate?: Date;
  duration: string;
  certificate?: string;
  type: 'Workshop' | 'Seminar' | 'Conference' | 'Course' | 'Certification' | 'Other';
}

export interface ITeacherDisciplinary {
  incidentDate: Date;
  nature: string;
  description: string;
  action: string;
  actionDate?: Date;
  issuedBy: mongoose.Types.ObjectId;
  status: 'Open' | 'Resolved' | 'Appealed' | 'Dropped';
  resolution?: string;
}

export interface IPerformanceMetrics {
  academic?: {
    studentAverage?: number;
    subjectPerformance?: number;
    resultTrend?: string;
  };
  administrative?: {
    attendanceRate?: number;
    timeliness?: number;
    assignmentCompletion?: number;
    reportSubmission?: number;
  };
}

export interface ITeacher extends Document {
  teacherId: string;
  employeeNumber: string;
  userId: mongoose.Types.ObjectId;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: Date;
  nationality: string;
  photo?: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  phoneNumber: string;
  altPhoneNumber?: string;
  email: string;
  residentialAddress: {
    city?: string;
    subcity?: string;
    woreda?: string;
    houseNumber?: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  qualifications: ITeacherQualification[];
  specialization: string;
  teachingLicenseNumber: string;
  subjects: mongoose.Types.ObjectId[];
  yearsOfExperience: number;
  employmentDate: Date;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Permanent';
  position: 'Subject Teacher' | 'Department Head' | 'Vice Principal' | 'Principal';
  status: 'Active' | 'On Leave' | 'Suspended' | 'Resigned' | 'Retired' | 'Terminated';

  skills: string[];
  trainings: ITeacherTraining[];
  disciplinaryRecords: ITeacherDisciplinary[];
  leaves: ITeacherLeave[];
  attendance: ITeacherAttendance[];
  transfers: ITeacherTransfer[];
  performanceMetrics: IPerformanceMetrics;
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    teacherId: {
      type: String,
      unique: true,
      index: true,
    },
    employeeNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female'] },
    dateOfBirth: { type: Date },
    nationality: { type: String, default: 'Ethiopian' },
    photo: { type: String },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    phoneNumber: { type: String, required: true, trim: true },
    altPhoneNumber: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    residentialAddress: {
      city: String,
      subcity: String,
      woreda: String,
      houseNumber: String,
    },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
    },
    qualifications: [
      {
        degree: { type: String, required: true },
        field: { type: String, required: true },
        institution: { type: String, required: true },
        year: { type: Number, required: true },
      },
    ],
    specialization: { type: String, trim: true, default: '' },
    teachingLicenseNumber: { type: String, trim: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    skills: [{ type: String, trim: true }],
    trainings: [
      {
        title: { type: String, required: true },
        provider: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: Date,
        duration: { type: String, required: true },
        certificate: String,
        type: { type: String, enum: ['Workshop', 'Seminar', 'Conference', 'Course', 'Certification', 'Other'], required: true },
      },
    ],
    disciplinaryRecords: [
      {
        incidentDate: { type: Date, required: true },
        nature: { type: String, required: true },
        description: { type: String, required: true },
        action: { type: String, required: true },
        actionDate: Date,
        issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Open', 'Resolved', 'Appealed', 'Dropped'], default: 'Open' },
        resolution: String,
      },
    ],
    yearsOfExperience: { type: Number, default: 0 },
    employmentDate: { type: Date, required: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Permanent'],
      default: 'Full-time',
    },
    position: {
      type: String,
      enum: ['Subject Teacher', 'Department Head', 'Vice Principal', 'Principal'],
      default: 'Subject Teacher',
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Suspended', 'Resigned', 'Retired', 'Terminated'],
      default: 'Active',
    },
    leaves: [
      {
        type: { type: String, enum: ['Annual', 'Sick', 'Emergency', 'Maternity', 'Training'] },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { type: String, enum: ['Pending', 'AcademicApproved', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
        reason: String,
        academicApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        directorApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    attendance: [
      {
        date: { type: Date, required: true },
        checkIn: String,
        checkOut: String,
        status: { type: String, enum: ['Present', 'Late', 'Early Departure', 'Absent', 'On Leave'], required: true },
        notes: String,
      },
    ],
    transfers: [
      {
        fromSection: { type: Schema.Types.ObjectId, ref: 'Section' },
        fromSubject: { type: Schema.Types.ObjectId, ref: 'Subject' },
        toSection: { type: Schema.Types.ObjectId, ref: 'Section' },
        toSubject: { type: Schema.Types.ObjectId, ref: 'Subject' },
        reason: String,
        transferDate: { type: Date, required: true },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      },
    ],
    performanceMetrics: {
      academic: {
        studentAverage: Number,
        subjectPerformance: Number,
        resultTrend: String,
      },
      administrative: {
        attendanceRate: Number,
        timeliness: Number,
        assignmentCompletion: Number,
        reportSubmission: Number,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TeacherSchema.virtual('fullName').get(function () {
  return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(' ');
});

TeacherSchema.pre('save', function (next) {
  if (!this.employeeNumber && this.teacherId) {
    this.employeeNumber = this.teacherId;
  }
  next();
});

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
