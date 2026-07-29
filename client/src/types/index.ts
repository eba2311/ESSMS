// === Enums ===

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

export enum StudentStatus {
  ACTIVE = 'Active',
  PENDING_APPROVAL = 'Pending Approval',
  SUSPENDED = 'Suspended',
  TRANSFERRED = 'Transferred',
  WITHDRAWN = 'Withdrawn',
  GRADUATED = 'Graduated',
  ARCHIVED = 'Archived',
}

export enum Stream {
  COMMON = 'Common',
  NATURAL_SCIENCE = 'Natural Science',
  SOCIAL_SCIENCE = 'Social Science',
}

export enum AssessmentType {
  ASSIGNMENT = 'Assignment',
  QUIZ = 'Quiz',
  CLASS_WORK = 'Class Work',
  PROJECT = 'Project',
  MID_EXAM = 'Mid Exam',
  FINAL_EXAM = 'Final Exam',
}

export enum AssessmentStatus {
  DRAFT = 'Draft',
  PENDING_VERIFICATION = 'Pending Verification',
  VERIFIED = 'Verified',
  APPROVED = 'Approved',
  PUBLISHED = 'Published',
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  EXCUSED = 'Excused',
}

export enum LetterGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}

export enum MeritCategory {
  ACADEMIC_EXCELLENCE = 'Academic Excellence',
  HONOR_STUDENT = 'Honor Student',
  REGULAR = 'Regular',
}

export enum PaymentMethod {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  MOBILE_MONEY = 'Mobile Money',
  CHEQUE = 'Cheque',
}

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

// === Core Types ===

export type GradeLevel = 9 | 10 | 11 | 12;

export interface Address {
  city?: string;
  subcity?: string;
  woreda?: string;
  houseNumber?: string;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface MedicalInfo {
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  immunizations?: Immunization[];
}

export interface Immunization {
  name: string;
  date: string;
}

// === API Response Types ===

export interface ApiResponse<T = any> {
  success: boolean;
  data: any;
  message?: string;
  count?: number;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type ApiPromise<T = any> = Promise<import('axios').AxiosResponse<ApiResponse<T>>>;

// === Model Interfaces ===

export interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLogin?: string;
  passwordChangedAt?: string;
  forcePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  studentId: string;
  admissionNumber?: string;
  userId?: string | User;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  nationality?: string;
  photo?: string;
  grade: GradeLevel;
  section?: string | Section;
  stream?: Stream;
  academicYear?: string;
  enrollmentDate: string;
  status: StudentStatus;
  guardians: (string | Guardian)[];
  address: Address;
  emergencyContact: EmergencyContact;
  medicalInfo?: MedicalInfo;
  previousSchool?: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guardian {
  _id: string;
  guardianId: string;
  userId?: string | User;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  occupation?: string;
  relationship: string;
  students: (string | Student)[];
  address: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  _id: string;
  teacherId: string;
  userId?: string | User;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  phone: string;
  email: string;
  qualifications: string[];
  specialization?: string;
  yearsOfExperience: number;
  subjects: (string | Subject)[];
  sectionAssignments: (string | TeacherAssignment)[];
  employmentStatus: 'Full-time' | 'Part-time' | 'Contract';
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  _id: string;
  name: string;
  grade: GradeLevel;
  stream?: Stream;
  academicYear: string;
  homeroomTeacher?: string | Teacher;
  classroom?: string | Classroom;
  capacity: number;
  students: (string | Student)[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  grade: GradeLevel;
  stream?: Stream;
  creditHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherAssignment {
  _id: string;
  teacher: string | Teacher;
  section: string | Section;
  subject: string | Subject;
  periodsPerWeek: number;
  academicYear: string;
  term: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  _id: string;
  assessmentId: string;
  title: string;
  type: AssessmentType;
  subject: string | Subject;
  section: string | Section;
  teacher: string | Teacher;
  totalMarks: number;
  academicYear: string;
  term: string;
  status: AssessmentStatus;
  dueDate?: string;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentMark {
  _id: string;
  assessment: string | Assessment;
  student: string | Student;
  marksObtained: number;
  percentage: number;
  letterGrade: LetterGrade;
  gpa: number;
  status: 'Draft' | 'Pending Verification' | 'Verified' | 'Approved';
  remarks?: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  student: string | Student;
  section: string | Section;
  date: string;
  status: AttendanceStatus;
  markedBy: string | User;
  academicYear: string;
  term: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  _id: string;
  grade: GradeLevel;
  academicYear: string;
  components: FeeComponent[];
  totalAmount: number;
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeComponent {
  name: string;
  amount: number;
  description?: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  receiptNumber: string;
  student: string | Student;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  academicYear: string;
  paidAt: string;
  recordedBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  _id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  category: string;
  quantity: number;
  availableCopies: number;
  shelfLocation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Borrowing {
  _id: string;
  borrowingId: string;
  book: string | Book;
  borrower: string | User;
  borrowerModel: 'Student' | 'Teacher';
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Borrowed' | 'Returned' | 'Overdue';
  fine?: number;
  finePaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  targetRoles: UserRole[];
  createdBy: string | User;
  isPublished: boolean;
  publishDate?: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string | User;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ranking {
  _id: string;
  student: string | Student;
  section: string | Section;
  grade: GradeLevel;
  stream?: Stream;
  academicYear: string;
  term: string;
  overallAverage: number;
  gpa: number;
  meritCategory: MeritCategory;
  sectionRank?: number;
  gradeRank?: number;
  streamRank?: number;
  schoolRank?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  _id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  type: string;
  status: 'Available' | 'Occupied' | 'Under Maintenance';
  facilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  userId: string | User;
  activityType: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// === Dashboard Types ===

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSections: number;
  totalAssessments: number;
  totalBooks: number;
  totalUsers: number;
  academicYear: string;
  pendingFees: number;
  todayPresent: number;
  todayAbsent: number;
  attendanceRate: number;
  events: Event[];
  recentStudents: Student[];
}

export interface TeacherDashboard {
  classes: number;
  students: number;
  assessments: number;
  sections: { section: string }[];
}

export interface SubjectAverage {
  subject: Subject;
  average: number;
  letterGrade: string;
  gpa: number;
}

export interface TermPerformance {
  subjects: SubjectAverage[];
  overallAverage: number;
  gpa: number;
  ranking: TermRanking | null;
}

export interface TermRanking {
  sectionRank?: number;
  gradeRank?: number;
  streamRank?: number;
  schoolRank?: number;
  totalStudentsInSection?: number;
  totalStudentsInGrade?: number;
  totalStudentsInStream?: number;
  totalStudentsInSchool?: number;
  meritCategory?: string;
}

export interface StudentDashboard {
  student: Student | null;
  attendanceRate: number;
  totalAssessments: number;
  term1: TermPerformance;
  term2: TermPerformance;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// === API Parameter Types ===

export interface PaginatedParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface UserParams extends PaginatedParams {
  role?: string;
  isActive?: boolean;
}

export interface StudentParams extends PaginatedParams {
  grade?: number;
  section?: string;
  stream?: string;
  status?: string;
  gender?: string;
}

export interface SectionParams extends PaginatedParams {
  grade?: number;
  stream?: string;
  academicYear?: string;
  isActive?: boolean;
}

export interface AssessmentParams extends PaginatedParams {
  type?: string;
  status?: string;
  subject?: string;
  section?: string;
  teacher?: string;
  academicYear?: string;
  term?: string;
}

export interface AttendanceParams extends PaginatedParams {
  section?: string;
  student?: string;
  date?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface FinanceParams extends PaginatedParams {
  grade?: number;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface LibraryParams extends PaginatedParams {
  category?: string;
  author?: string;
  isbn?: string;
  available?: boolean;
}

export interface RankingParams extends PaginatedParams {
  grade?: number;
  stream?: string;
  section?: string;
  academicYear?: string;
  term?: string;
}
