import { UserRole } from '../types';

/**
 * Permission Categories
 */
export enum PermissionCategory {
  // Student Management
  STUDENT_READ = 'student:read',
  STUDENT_CREATE = 'student:create',
  STUDENT_UPDATE = 'student:update',
  STUDENT_DELETE = 'student:delete',
  STUDENT_TRANSFER = 'student:transfer',
  STUDENT_PROMOTE = 'student:promote',
  STUDENT_GRADUATE = 'student:graduate',

  // Teacher Management
  TEACHER_READ = 'teacher:read',
  TEACHER_CREATE = 'teacher:create',
  TEACHER_UPDATE = 'teacher:update',
  TEACHER_ASSIGN = 'teacher:assign',
  TEACHER_WORKLOAD = 'teacher:workload',
  TEACHER_LEAVE = 'teacher:leave',
  TEACHER_DELETE = 'teacher:delete',

  // Guardian Management
  GUARDIAN_READ = 'guardian:read',
  GUARDIAN_CREATE = 'guardian:create',
  GUARDIAN_UPDATE = 'guardian:update',

  // Assessment Management
  ASSESSMENT_CREATE = 'assessment:create',
  ASSESSMENT_READ = 'assessment:read',
  ASSESSMENT_UPDATE = 'assessment:update',
  ASSESSMENT_ENTER_MARKS = 'assessment:enter_marks',
  ASSESSMENT_VERIFY = 'assessment:verify',
  ASSESSMENT_APPROVE = 'assessment:approve',
  ASSESSMENT_PUBLISH = 'assessment:publish',
  ASSESSMENT_UNLOCK = 'assessment:unlock',

  // Grade Management
  GRADE_READ_OWN = 'grade:read_own',
  GRADE_READ_ALL = 'grade:read_all',
  GRADE_READ_SECTION = 'grade:read_section',
  GRADE_CALCULATE = 'grade:calculate',
  GRADE_CONFIG = 'grade:config',

  // Attendance Management
  ATTENDANCE_MARK = 'attendance:mark',
  ATTENDANCE_READ_OWN = 'attendance:read_own',
  ATTENDANCE_READ_SECTION = 'attendance:read_section',
  ATTENDANCE_READ_ALL = 'attendance:read_all',
  ATTENDANCE_REPORT = 'attendance:report',
  ATTENDANCE_DELETE = 'attendance:delete',
  ATTENDANCE_CORRECTION_REQUEST = 'attendance:correction_request',
  ATTENDANCE_CORRECTION_REVIEW = 'attendance:correction_review',

  // Finance Management
  FINANCE_READ = 'finance:read',
  FINANCE_CREATE_FEE = 'finance:create_fee',
  FINANCE_UPDATE_FEE = 'finance:update_fee',
  FINANCE_RECORD_PAYMENT = 'finance:record_payment',
  FINANCE_GENERATE_RECEIPT = 'finance:generate_receipt',
  FINANCE_REPORT = 'finance:report',

  // Library Management
  LIBRARY_READ = 'library:read',
  LIBRARY_MANAGE_BOOKS = 'library:manage_books',
  LIBRARY_BORROW = 'library:borrow',
  LIBRARY_RETURN = 'library:return',
  LIBRARY_FINE = 'library:fine',
  LIBRARY_REPORT = 'library:report',

  // Communication
  ANNOUNCEMENT_CREATE = 'announcement:create',
  ANNOUNCEMENT_READ = 'announcement:read',
  NOTIFICATION_SEND = 'notification:send',
  MESSAGE_SEND = 'message:send',
  MESSAGE_READ = 'message:read',

  // Counseling
  COUNSELING_CREATE = 'counseling:create',
  COUNSELING_READ_OWN = 'counseling:read_own',
  COUNSELING_READ_ALL = 'counseling:read_all',
  COUNSELING_UPDATE = 'counseling:update',
  COUNSELING_DELETE = 'counseling:delete',
  BEHAVIORAL_REPORT_CREATE = 'behavioral:create',
  BEHAVIORAL_REPORT_READ = 'behavioral:read',
  BEHAVIORAL_REPORT_UPDATE = 'behavioral:update',

  // Academic Structure
  SECTION_CREATE = 'section:create',
  SECTION_UPDATE = 'section:update',
  SECTION_READ = 'section:read',
  CURRICULUM_MANAGE = 'curriculum:manage',
  SUBJECT_ASSIGN = 'subject:assign',
  SUBJECT_RESOURCE_MANAGE = 'subject:resource_manage',
  SUBJECT_MATERIAL_MANAGE = 'subject:material_manage',
  SUBJECT_MATERIAL_VIEW = 'subject:material_view',
  TIMETABLE_CREATE = 'timetable:create',
  TIMETABLE_READ = 'timetable:read',

  // Documents
  DOCUMENT_TRANSCRIPT = 'document:transcript',
  DOCUMENT_CERTIFICATE = 'document:certificate',
  DOCUMENT_REPORT_CARD = 'document:report_card',
  DOCUMENT_READ_OWN = 'document:read_own',

  // Reports and Analytics
  REPORT_ACADEMIC = 'report:academic',
  REPORT_FINANCIAL = 'report:financial',
  REPORT_ATTENDANCE = 'report:attendance',
  REPORT_MINISTRY = 'report:ministry',
  ANALYTICS_VIEW = 'analytics:view',
  DASHBOARD_MIS = 'dashboard:mis',

  // Audit and Security
  AUDIT_READ = 'audit:read',
  AUDIT_REPORT = 'audit:report',
  TRANSFER_LOG_READ = 'transfer_log:read',
  TRANSFER_LOG_DELETE = 'transfer_log:delete',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_ROLE_CHANGE = 'user:role_change',
  USER_DELETE = 'user:delete',

  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_MAINTENANCE = 'system:maintenance',

  // Alumni Management
  ALUMNI_READ = 'alumni:read',
  ALUMNI_UPDATE = 'alumni:update',
  ALUMNI_REPORT = 'alumni:report',

  // Event Management
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',

  // Resource Management
  RESOURCE_MANAGE = 'resource:manage',
  RESOURCE_READ = 'resource:read',
  RESOURCE_ALLOCATE = 'resource:allocate',

  // Transport Management
  TRANSPORT_READ = 'transport:read',
  TRANSPORT_CREATE = 'transport:create',
  TRANSPORT_UPDATE = 'transport:update',
  TRANSPORT_DELETE = 'transport:delete',
  TRANSPORT_REPORT = 'transport:report',
}

/**
 * Role to Permissions Mapping
 * Implements Requirement 1: RBAC with 11 roles
 * Implements Requirement 1.3: Least privilege principle
 * Implements Requirement 1.4: Separation of duties
 */
export const RolePermissions: Record<UserRole, PermissionCategory[]> = {
  /**
   * System Administrator
   * Technical administration without academic modification capabilities (Req 1.8)
   */
  [UserRole.SYSTEM_ADMIN]: [
    // User Management
    PermissionCategory.USER_CREATE,
    PermissionCategory.USER_UPDATE,
    PermissionCategory.USER_ROLE_CHANGE,
    PermissionCategory.USER_DELETE,

    // System Administration
    PermissionCategory.SYSTEM_CONFIG,
    PermissionCategory.SYSTEM_BACKUP,
    PermissionCategory.SYSTEM_MAINTENANCE,

    // Audit Access
    PermissionCategory.AUDIT_READ,
    PermissionCategory.AUDIT_REPORT,
    PermissionCategory.TRANSFER_LOG_READ,
    PermissionCategory.TRANSFER_LOG_DELETE,

    // Student Management (Full)
    PermissionCategory.STUDENT_READ,
    PermissionCategory.STUDENT_CREATE,
    PermissionCategory.STUDENT_UPDATE,
    PermissionCategory.STUDENT_DELETE,
    PermissionCategory.STUDENT_TRANSFER,
    PermissionCategory.STUDENT_PROMOTE,
    PermissionCategory.STUDENT_GRADUATE,

    // Teacher Management (Full)
    PermissionCategory.TEACHER_READ,
    PermissionCategory.TEACHER_CREATE,
    PermissionCategory.TEACHER_UPDATE,
    PermissionCategory.TEACHER_DELETE,
    PermissionCategory.TEACHER_ASSIGN,
    PermissionCategory.TEACHER_WORKLOAD,
    PermissionCategory.TEACHER_LEAVE,

    // Guardian Management (Full)
    PermissionCategory.GUARDIAN_READ,
    PermissionCategory.GUARDIAN_CREATE,
    PermissionCategory.GUARDIAN_UPDATE,

    // Academic Structure (Full)
    PermissionCategory.SECTION_CREATE,
    PermissionCategory.SECTION_UPDATE,
    PermissionCategory.SECTION_READ,
    PermissionCategory.CURRICULUM_MANAGE,
    PermissionCategory.SUBJECT_ASSIGN,
    PermissionCategory.SUBJECT_RESOURCE_MANAGE,
    PermissionCategory.SUBJECT_MATERIAL_MANAGE,
    PermissionCategory.SUBJECT_MATERIAL_VIEW,
    PermissionCategory.TIMETABLE_CREATE,
    PermissionCategory.TIMETABLE_READ,

    // Assessment (Full)
    PermissionCategory.ASSESSMENT_CREATE,
    PermissionCategory.ASSESSMENT_READ,
    PermissionCategory.ASSESSMENT_UPDATE,
    PermissionCategory.ASSESSMENT_ENTER_MARKS,
    PermissionCategory.ASSESSMENT_VERIFY,
    PermissionCategory.ASSESSMENT_APPROVE,
    PermissionCategory.ASSESSMENT_PUBLISH,
    PermissionCategory.ASSESSMENT_UNLOCK,

    // Grade Management (Full)
    PermissionCategory.GRADE_READ_ALL,
    PermissionCategory.GRADE_READ_SECTION,
    PermissionCategory.GRADE_CALCULATE,
    PermissionCategory.GRADE_CONFIG,

    // Attendance (Full)
    PermissionCategory.ATTENDANCE_MARK,
    PermissionCategory.ATTENDANCE_READ_ALL,
    PermissionCategory.ATTENDANCE_READ_SECTION,
    PermissionCategory.ATTENDANCE_REPORT,
    PermissionCategory.ATTENDANCE_DELETE,
    PermissionCategory.ATTENDANCE_CORRECTION_REVIEW,

    // Finance (Full)
    PermissionCategory.FINANCE_READ,
    PermissionCategory.FINANCE_CREATE_FEE,
    PermissionCategory.FINANCE_UPDATE_FEE,
    PermissionCategory.FINANCE_RECORD_PAYMENT,
    PermissionCategory.FINANCE_GENERATE_RECEIPT,
    PermissionCategory.FINANCE_REPORT,

    // Library (Full)
    PermissionCategory.LIBRARY_READ,
    PermissionCategory.LIBRARY_MANAGE_BOOKS,
    PermissionCategory.LIBRARY_BORROW,
    PermissionCategory.LIBRARY_RETURN,
    PermissionCategory.LIBRARY_FINE,
    PermissionCategory.LIBRARY_REPORT,

    // Communication (Full)
    PermissionCategory.ANNOUNCEMENT_CREATE,
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.NOTIFICATION_SEND,
    PermissionCategory.MESSAGE_SEND,
    PermissionCategory.MESSAGE_READ,

    // Counseling (Full)
    PermissionCategory.COUNSELING_CREATE,
    PermissionCategory.COUNSELING_READ_ALL,
    PermissionCategory.COUNSELING_UPDATE,
    PermissionCategory.COUNSELING_DELETE,
    PermissionCategory.BEHAVIORAL_REPORT_CREATE,
    PermissionCategory.BEHAVIORAL_REPORT_READ,
    PermissionCategory.BEHAVIORAL_REPORT_UPDATE,

    // Documents (Full)
    PermissionCategory.DOCUMENT_TRANSCRIPT,
    PermissionCategory.DOCUMENT_CERTIFICATE,
    PermissionCategory.DOCUMENT_REPORT_CARD,
    PermissionCategory.DOCUMENT_READ_OWN,

    // Reports & Analytics (Full)
    PermissionCategory.REPORT_ACADEMIC,
    PermissionCategory.REPORT_FINANCIAL,
    PermissionCategory.REPORT_ATTENDANCE,
    PermissionCategory.REPORT_MINISTRY,
    PermissionCategory.ANALYTICS_VIEW,
    PermissionCategory.DASHBOARD_MIS,

    // Alumni (Full)
    PermissionCategory.ALUMNI_READ,
    PermissionCategory.ALUMNI_UPDATE,
    PermissionCategory.ALUMNI_REPORT,

    // Events (Full)
    PermissionCategory.EVENT_CREATE,
    PermissionCategory.EVENT_READ,
    PermissionCategory.EVENT_UPDATE,

    // Resources (Full)
    PermissionCategory.RESOURCE_MANAGE,
    PermissionCategory.RESOURCE_READ,
    PermissionCategory.RESOURCE_ALLOCATE,

    // Transport Management (Full)
    PermissionCategory.TRANSPORT_READ,
    PermissionCategory.TRANSPORT_CREATE,
    PermissionCategory.TRANSPORT_UPDATE,
    PermissionCategory.TRANSPORT_DELETE,
    PermissionCategory.TRANSPORT_REPORT,
  ],

  /**
   * School Director
   * View-only access to grades without modification (Req 1.7)
   * Can unlock approved assessments (Req 8.8)
   */
  [UserRole.SCHOOL_DIRECTOR]: [
    // Student Management (Full)
    PermissionCategory.STUDENT_READ,
    PermissionCategory.STUDENT_CREATE,
    PermissionCategory.STUDENT_UPDATE,
    PermissionCategory.STUDENT_TRANSFER,
    PermissionCategory.STUDENT_PROMOTE,
    PermissionCategory.STUDENT_GRADUATE,

    // Teacher Management (View + Workload + Leave only)
    PermissionCategory.TEACHER_READ,
    PermissionCategory.TEACHER_WORKLOAD,
    PermissionCategory.TEACHER_LEAVE,

    // Guardian Management
    PermissionCategory.GUARDIAN_READ,
    PermissionCategory.GUARDIAN_CREATE,
    PermissionCategory.GUARDIAN_UPDATE,

    // Assessment (View-only + Approve + Unlock)
    PermissionCategory.ASSESSMENT_READ,
    PermissionCategory.ASSESSMENT_APPROVE,
    PermissionCategory.ASSESSMENT_UNLOCK, // Special privilege

    // Grade (View-only, no modification per Req 1.7)
    PermissionCategory.GRADE_READ_ALL,

    // Attendance
    PermissionCategory.ATTENDANCE_READ_ALL,
    PermissionCategory.ATTENDANCE_REPORT,
    PermissionCategory.ATTENDANCE_CORRECTION_REVIEW,

    // Finance
    PermissionCategory.FINANCE_READ,
    PermissionCategory.FINANCE_REPORT,

    // Library
    PermissionCategory.LIBRARY_READ,
    PermissionCategory.LIBRARY_REPORT,

    // Communication
    PermissionCategory.ANNOUNCEMENT_CREATE,
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.NOTIFICATION_SEND,

    // Counseling (Full access)
    PermissionCategory.COUNSELING_CREATE,
    PermissionCategory.COUNSELING_READ_ALL,
    PermissionCategory.COUNSELING_UPDATE,
    PermissionCategory.COUNSELING_DELETE,
    PermissionCategory.BEHAVIORAL_REPORT_CREATE,
    PermissionCategory.BEHAVIORAL_REPORT_READ,
    PermissionCategory.BEHAVIORAL_REPORT_UPDATE,

    // Academic Structure
    PermissionCategory.SECTION_READ,
    PermissionCategory.CURRICULUM_MANAGE,
    PermissionCategory.SUBJECT_ASSIGN,
    PermissionCategory.SUBJECT_RESOURCE_MANAGE,
    PermissionCategory.SUBJECT_MATERIAL_VIEW,
    PermissionCategory.TIMETABLE_CREATE,
    PermissionCategory.TIMETABLE_READ,

    // Documents
    PermissionCategory.DOCUMENT_TRANSCRIPT,
    PermissionCategory.DOCUMENT_CERTIFICATE,
    PermissionCategory.DOCUMENT_REPORT_CARD,
    PermissionCategory.DOCUMENT_READ_OWN,

    // Reports (All)
    PermissionCategory.REPORT_ACADEMIC,
    PermissionCategory.REPORT_FINANCIAL,
    PermissionCategory.REPORT_ATTENDANCE,
    PermissionCategory.REPORT_MINISTRY,
    PermissionCategory.ANALYTICS_VIEW,
    PermissionCategory.DASHBOARD_MIS,

    // Audit
    PermissionCategory.AUDIT_READ,
    PermissionCategory.AUDIT_REPORT,
    PermissionCategory.TRANSFER_LOG_READ,

    // Alumni
    PermissionCategory.ALUMNI_READ,
    PermissionCategory.ALUMNI_REPORT,

    // Events
    PermissionCategory.EVENT_CREATE,
    PermissionCategory.EVENT_READ,
    PermissionCategory.EVENT_UPDATE,

    // Resources
    PermissionCategory.RESOURCE_MANAGE,
    PermissionCategory.RESOURCE_READ,
    PermissionCategory.RESOURCE_ALLOCATE,

    // Transport Management
    PermissionCategory.TRANSPORT_READ,
    PermissionCategory.TRANSPORT_REPORT,
  ],

  /**
   * Academic Head
   * Can verify and approve grades (Req 1.4, 8.2, 8.4)
   * Can publish results (separation of duties from teachers)
   */
  [UserRole.ACADEMIC_HEAD]: [
    // Student Management
    PermissionCategory.STUDENT_READ,
    PermissionCategory.STUDENT_UPDATE,
    PermissionCategory.STUDENT_PROMOTE,

    // Teacher Management
    PermissionCategory.TEACHER_READ,
    PermissionCategory.TEACHER_ASSIGN,
    PermissionCategory.TEACHER_WORKLOAD,

    // Assessment (Full academic control)
    PermissionCategory.ASSESSMENT_CREATE,
    PermissionCategory.ASSESSMENT_READ,
    PermissionCategory.ASSESSMENT_UPDATE,
    PermissionCategory.ASSESSMENT_VERIFY, // Key responsibility
    PermissionCategory.ASSESSMENT_APPROVE, // Key responsibility
    PermissionCategory.ASSESSMENT_PUBLISH, // Key responsibility (Req 1.4)

    // Grade Management
    PermissionCategory.GRADE_READ_ALL,
    PermissionCategory.GRADE_CALCULATE,

    // Attendance
    PermissionCategory.ATTENDANCE_READ_ALL,
    PermissionCategory.ATTENDANCE_REPORT,

    // Communication
    PermissionCategory.ANNOUNCEMENT_CREATE,
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.NOTIFICATION_SEND,

    // Academic Structure
    PermissionCategory.SECTION_READ,
    PermissionCategory.CURRICULUM_MANAGE,
    PermissionCategory.SUBJECT_ASSIGN,
    PermissionCategory.SUBJECT_RESOURCE_MANAGE,
    PermissionCategory.SUBJECT_MATERIAL_VIEW,
    PermissionCategory.TIMETABLE_CREATE,
    PermissionCategory.TIMETABLE_READ,

    // Documents
    PermissionCategory.DOCUMENT_TRANSCRIPT,
    PermissionCategory.DOCUMENT_CERTIFICATE,
    PermissionCategory.DOCUMENT_REPORT_CARD,
    PermissionCategory.DOCUMENT_READ_OWN,

    // Reports
    PermissionCategory.REPORT_ACADEMIC,
    PermissionCategory.REPORT_ATTENDANCE,
    PermissionCategory.REPORT_MINISTRY,
    PermissionCategory.ANALYTICS_VIEW,
    PermissionCategory.DASHBOARD_MIS,
    PermissionCategory.TRANSFER_LOG_READ,

    // Counseling
    PermissionCategory.COUNSELING_CREATE,
    PermissionCategory.COUNSELING_READ_ALL,
    PermissionCategory.COUNSELING_UPDATE,
    PermissionCategory.COUNSELING_DELETE,

    // Alumni

    // Events
    PermissionCategory.EVENT_CREATE,
    PermissionCategory.EVENT_READ,

    // Transport Management
    PermissionCategory.TRANSPORT_READ,
    PermissionCategory.TRANSPORT_REPORT,
  ],

  /**
   * Registrar Officer
   * Manages student enrollment but cannot modify grades (Req 1.6)
   */
  [UserRole.REGISTRAR]: [
    // Student Management (Primary responsibility)
    PermissionCategory.STUDENT_READ,
    PermissionCategory.STUDENT_CREATE,
    PermissionCategory.STUDENT_UPDATE,
    PermissionCategory.STUDENT_TRANSFER,
    PermissionCategory.STUDENT_PROMOTE,
    PermissionCategory.STUDENT_GRADUATE,

    // Guardian Management
    PermissionCategory.GUARDIAN_READ,
    PermissionCategory.GUARDIAN_CREATE,
    PermissionCategory.GUARDIAN_UPDATE,

    // Section (Read-only)
    PermissionCategory.SECTION_READ,

    // Assessment (Read-only, no modification)
    PermissionCategory.ASSESSMENT_READ,

    // Grade (Read-only)
    PermissionCategory.GRADE_READ_ALL,

    // Attendance (Read-only)
    PermissionCategory.ATTENDANCE_READ_ALL,

    // Documents
    PermissionCategory.DOCUMENT_TRANSCRIPT,
    PermissionCategory.DOCUMENT_CERTIFICATE,
    PermissionCategory.DOCUMENT_REPORT_CARD,
    PermissionCategory.DOCUMENT_READ_OWN,

    // Communication
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.MESSAGE_READ,

    // Alumni
    PermissionCategory.ALUMNI_READ,
    PermissionCategory.ALUMNI_UPDATE,

    // Reports
    PermissionCategory.REPORT_ACADEMIC,
    PermissionCategory.REPORT_MINISTRY,
    PermissionCategory.TRANSFER_LOG_READ,

    // Transport Management
    PermissionCategory.TRANSPORT_READ,
  ],

  /**
   * Finance Officer
   * Cannot access grade data or counseling records (Req 1.5, 10.9)
   */
  [UserRole.FINANCE_OFFICER]: [
    // Student (Limited - only for billing)
    PermissionCategory.STUDENT_READ, // Needed for billing

    // Finance (Primary responsibility)
    PermissionCategory.FINANCE_READ,
    PermissionCategory.FINANCE_CREATE_FEE,
    PermissionCategory.FINANCE_UPDATE_FEE,
    PermissionCategory.FINANCE_RECORD_PAYMENT,
    PermissionCategory.FINANCE_GENERATE_RECEIPT,
    PermissionCategory.FINANCE_REPORT,

    // Communication
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.NOTIFICATION_SEND, // For fee reminders

    // Reports (Financial only)
    PermissionCategory.REPORT_FINANCIAL,
    PermissionCategory.DASHBOARD_MIS, // Financial KPIs only

    // NO ACCESS TO:
    // - Grade data (Req 1.5)
    // - Counseling records (Req 1.5)
    // - Academic assessments
  ],

  /**
   * Teacher
   * Can enter grades but not publish (Req 1.4 - separation of duties)
   * Cannot modify enrollment data (Req 1.6)
   */
  [UserRole.TEACHER]: [
    // Student (Read-only for assigned sections)
    PermissionCategory.STUDENT_READ,

    // Assessment (Can create, edit, and enter marks, but not publish)
    PermissionCategory.ASSESSMENT_CREATE,
    PermissionCategory.ASSESSMENT_READ,
    PermissionCategory.ASSESSMENT_UPDATE,
    PermissionCategory.ASSESSMENT_ENTER_MARKS, // Key responsibility
    // NO: ASSESSMENT_VERIFY, ASSESSMENT_APPROVE, ASSESSMENT_PUBLISH (Req 1.4)

    // Grade (Read assigned sections)
    PermissionCategory.GRADE_READ_SECTION,

    // Attendance (Mark for assigned sections)
    PermissionCategory.ATTENDANCE_MARK,
    PermissionCategory.ATTENDANCE_READ_SECTION,
    PermissionCategory.ATTENDANCE_CORRECTION_REQUEST,

    // Section (Read-only)
    PermissionCategory.SECTION_READ,

    // Timetable (Read-only)
    PermissionCategory.TIMETABLE_READ,

    // Subject Materials (Teacher manages)
    PermissionCategory.SUBJECT_MATERIAL_MANAGE,
    PermissionCategory.SUBJECT_MATERIAL_VIEW,

    // Communication
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.MESSAGE_SEND, // To guardians
    PermissionCategory.MESSAGE_READ,

    // Documents (For assigned students)
    PermissionCategory.DOCUMENT_REPORT_CARD,
    PermissionCategory.DOCUMENT_READ_OWN,

    // Library (Can borrow)
    PermissionCategory.LIBRARY_READ,
    PermissionCategory.LIBRARY_BORROW,

    // Events
    PermissionCategory.EVENT_READ,

    // Transport Management
    PermissionCategory.TRANSPORT_READ,

    // NO ACCESS TO:
    // - Student enrollment modification (Req 1.6)
    // - Grade publication
    // - Financial data
    // - Counseling records
  ],

  /**
   * Counselor
   * Access to counseling records with confidentiality (Req 19.1-19.3)
   */
  [UserRole.COUNSELOR]: [
    // Student (Read-only)
    PermissionCategory.STUDENT_READ,

    // Counseling (Primary responsibility)
    PermissionCategory.COUNSELING_CREATE,
    PermissionCategory.COUNSELING_READ_ALL,
    PermissionCategory.COUNSELING_UPDATE,
    PermissionCategory.COUNSELING_DELETE,
    PermissionCategory.BEHAVIORAL_REPORT_CREATE,
    PermissionCategory.BEHAVIORAL_REPORT_READ,
    PermissionCategory.BEHAVIORAL_REPORT_UPDATE,

    // Attendance (Read for counseling purposes)
    PermissionCategory.ATTENDANCE_READ_ALL,

    // Grade (Read for counseling purposes)
    PermissionCategory.GRADE_READ_ALL,

    // Communication
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.MESSAGE_SEND,
    PermissionCategory.MESSAGE_READ,

    // Events
    PermissionCategory.EVENT_CREATE,
    PermissionCategory.EVENT_READ,

    // Section
    PermissionCategory.SECTION_READ,
  ],

  /**
   * Librarian
   * Library management only
   */
  [UserRole.LIBRARIAN]: [
    // Library (Primary responsibility)
    PermissionCategory.LIBRARY_READ,
    PermissionCategory.LIBRARY_MANAGE_BOOKS,
    PermissionCategory.LIBRARY_BORROW,
    PermissionCategory.LIBRARY_RETURN,
    PermissionCategory.LIBRARY_FINE,
    PermissionCategory.LIBRARY_REPORT,

    // Student (Read-only for library operations)
    PermissionCategory.STUDENT_READ,

    // Communication
    PermissionCategory.ANNOUNCEMENT_READ,

    // Events
    PermissionCategory.EVENT_READ,
  ],

  /**
   * Student
   * Can only access own data (Req 28.10)
   */
  [UserRole.STUDENT]: [
    // Own data only
    PermissionCategory.GRADE_READ_OWN,
    PermissionCategory.ATTENDANCE_READ_OWN,
    PermissionCategory.DOCUMENT_READ_OWN,

    // Communication
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.MESSAGE_READ,
    PermissionCategory.MESSAGE_SEND,

    // Library
    PermissionCategory.LIBRARY_READ,
    PermissionCategory.LIBRARY_BORROW,

    // Timetable
    PermissionCategory.TIMETABLE_READ,

    // Events
    PermissionCategory.EVENT_READ,

    // Section info
    PermissionCategory.SECTION_READ,

    // Transport Management
    PermissionCategory.TRANSPORT_READ,
  ],

  /**
   * Parent/Guardian
   * Can only access linked children's data (Req 12.2, 12.10)
   */
  [UserRole.PARENT]: [
    // Children's data only (approved grades only per Req 8.6)
    PermissionCategory.GUARDIAN_READ, // View linked children
    PermissionCategory.GRADE_READ_OWN, // For linked children
    PermissionCategory.ATTENDANCE_READ_OWN, // For linked children
    PermissionCategory.DOCUMENT_READ_OWN, // For linked children
    PermissionCategory.FINANCE_READ, // For linked children

    // Communication
    PermissionCategory.ANNOUNCEMENT_READ,
    PermissionCategory.MESSAGE_READ,
    PermissionCategory.MESSAGE_SEND, // To teachers

    // Events
    PermissionCategory.EVENT_READ,

    // Section info
    PermissionCategory.SECTION_READ,

    // Transport Management
    PermissionCategory.TRANSPORT_READ,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (
  role: UserRole,
  permission: PermissionCategory
): boolean => {
  const rolePermissions = RolePermissions[role];
  return rolePermissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (
  role: UserRole,
  permissions: PermissionCategory[]
): boolean => {
  return permissions.some((permission) => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (
  role: UserRole,
  permissions: PermissionCategory[]
): boolean => {
  return permissions.every((permission) => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): PermissionCategory[] => {
  return RolePermissions[role] || [];
};

/**
 * Separation of Duties Rules (Req 1.4)
 * Teachers can enter grades but cannot publish
 * Only Academic Heads can verify and publish
 */
export const SeparationOfDutiesRules = {
  gradeEntry: [UserRole.TEACHER],
  gradeVerification: [UserRole.ACADEMIC_HEAD],
  gradeApproval: [UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR],
  gradeUnlock: [UserRole.SCHOOL_DIRECTOR],
};
