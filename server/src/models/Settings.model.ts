import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolWebsite?: string;
  schoolLogo?: string;
  academicYear?: string;
  term: number;
  semester: string;
  gradingSystem: string;
  maxStudentsPerSection: number;
  enableAutomaticPromotion: boolean;
  enableParentPortal: boolean;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
  enableTeacherAttendance: boolean;
  enableGuardianInvite: boolean;
  enableOnlineRegistration: boolean;
  sessionTimeout: number;
  passMinLength: number;
  lockoutAttempts: number;
}

const SettingsSchema = new Schema<ISettings>({
  schoolName: { type: String, default: 'Ethiopian Secondary School' },
  schoolAddress: String,
  schoolPhone: String,
  schoolEmail: String,
  schoolWebsite: String,
  schoolLogo: String,
  academicYear: String,
  term: { type: Number, default: 1 },
  semester: { type: String, default: '1' },
  gradingSystem: { type: String, default: 'Percentage' },
  maxStudentsPerSection: { type: Number, default: 40 },
  enableAutomaticPromotion: { type: Boolean, default: false },
  enableParentPortal: { type: Boolean, default: true },
  enableSmsNotifications: { type: Boolean, default: false },
  enableEmailNotifications: { type: Boolean, default: true },
  enableTeacherAttendance: { type: Boolean, default: true },
  enableGuardianInvite: { type: Boolean, default: true },
  enableOnlineRegistration: { type: Boolean, default: false },
  sessionTimeout: { type: Number, default: 60 },
  passMinLength: { type: Number, default: 8 },
  lockoutAttempts: { type: Number, default: 5 },
});

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
