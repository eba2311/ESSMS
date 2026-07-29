import { Document } from 'mongoose';

// User Roles
export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  SCHOOL_DIRECTOR = 'school_director',
  ACADEMIC_HEAD = 'academic_head',
  REGISTRAR = 'registrar',
  FINANCE_OFFICER = 'finance_officer',
  TEACHER = 'teacher',
  COUNSELOR = 'counselor',
  LIBRARIAN = 'librarian',
  STUDENT = 'student',
  PARENT = 'parent',
}

// Student Status
export enum StudentStatus {
  ACTIVE = 'Active',
  PENDING_APPROVAL = 'Pending Approval',
  SUSPENDED = 'Suspended',
  TRANSFERRED = 'Transferred',
  WITHDRAWN = 'Withdrawn',
  GRADUATED = 'Graduated',
  ARCHIVED = 'Archived',
}

// Stream Types
export enum Stream {
  COMMON = 'Common',
  NATURAL_SCIENCE = 'Natural Science',
  SOCIAL_SCIENCE = 'Social Science',
}

// Assessment Types
export enum AssessmentType {
  ASSIGNMENT = 'Assignment',
  QUIZ = 'Quiz',
  CLASS_WORK = 'Class Work',
  PROJECT = 'Project',
  MID_EXAM = 'Mid Exam',
  FINAL_EXAM = 'Final Exam',
}

// Assessment Status
export enum AssessmentStatus {
  DRAFT = 'Draft',
  PENDING_VERIFICATION = 'Pending Verification',
  VERIFIED = 'Verified',
  APPROVED = 'Approved',
  PUBLISHED = 'Published',
}

// Attendance Status
export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  EXCUSED = 'Excused',
}

// Grade Levels
export type GradeLevel = 9 | 10 | 11 | 12;

// Letter Grades
export enum LetterGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}

// Merit Categories
export enum MeritCategory {
  ACADEMIC_EXCELLENCE = 'Academic Excellence',
  HONOR_STUDENT = 'Honor Student',
  REGULAR = 'Regular',
}

// Payment Methods
export enum PaymentMethod {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  MOBILE_MONEY = 'Mobile Money',
  CHEQUE = 'Cheque',
}

// Notification Types
export enum NotificationType {
  ATTENDANCE_ALERT = 'Attendance Alert',
  GRADE_PUBLISHED = 'Grade Published',
  FEE_REMINDER = 'Fee Reminder',
  EXAMINATION_SCHEDULED = 'Examination Scheduled',
  ANNOUNCEMENT = 'Announcement',
  MESSAGE = 'Message',
  SYSTEM_ALERT = 'System Alert',
  SYSTEM = 'System',
  ACADEMIC = 'Academic',
  FINANCIAL = 'Financial',
  ATTENDANCE = 'Attendance',
  DISCIPLINARY = 'Disciplinary',
  GENERAL = 'General',
}

