export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  SCHOOL_DIRECTOR: 'school_director',
  ACADEMIC_HEAD: 'academic_head',
  REGISTRAR: 'registrar',
  TEACHER: 'teacher',
  COUNSELOR: 'counselor',
  LIBRARIAN: 'librarian',
  STUDENT: 'student',
  PARENT: 'parent',
  FINANCE_OFFICER: 'finance_officer',
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];

const ALL_ADMIN = ['system_admin', 'school_director', 'academic_head', 'registrar'] as const;

const PERMISSIONS: Record<string, Record<string, Role[]>> = {
  student: {
    view: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor', 'librarian', 'finance_officer'],
    create: ['system_admin', 'registrar'],
    edit: ['system_admin', 'registrar'],
    delete: ['system_admin'],
    promote: ['system_admin', 'academic_head', 'registrar'],
    transfer: ['system_admin', 'registrar'],
    suspend: ['system_admin', 'school_director'],
    archive: ['system_admin'],
    graduate: ['system_admin', 'registrar', 'academic_head'],
  },
  teacher: {
    view: ['system_admin', 'school_director', 'academic_head'],
    create: ['system_admin'],
    edit: ['system_admin'],
    delete: ['system_admin'],
    assign: ['system_admin', 'academic_head'],
  },
  assessment: {
    create: ['system_admin', 'academic_head', 'teacher'],
    read: ['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent'],
    edit: ['system_admin', 'academic_head', 'teacher'],
    delete: ['system_admin'],
    enter_marks: ['system_admin', 'academic_head', 'teacher'],
    verify: ['system_admin', 'academic_head'],
    approve: ['system_admin', 'academic_head', 'school_director'],
    publish: ['system_admin', 'academic_head', 'school_director', 'teacher'],
  },
  attendance: {
    mark: ['system_admin', 'teacher'],
    read_all: ['system_admin', 'school_director', 'academic_head'],
    read_section: ['teacher'],
    read_own: ['student', 'parent'],
    report: ['system_admin', 'school_director', 'academic_head'],
    correct: ['system_admin', 'academic_head'],
  },
  finance: {
    read: ['system_admin', 'school_director', 'finance_officer', 'student', 'parent'],
    create_fee: ['system_admin', 'finance_officer'],
    update_fee: ['system_admin', 'finance_officer'],
    delete_fee: ['system_admin', 'finance_officer'],
    record_payment: ['system_admin', 'finance_officer'],
    generate_receipt: ['system_admin', 'finance_officer'],
    report: ['system_admin', 'school_director', 'finance_officer'],
  },
  library: {
    read: ['system_admin', 'school_director', 'librarian', 'teacher', 'student'],
    manage_books: ['system_admin', 'school_director', 'librarian'],
    borrow: ['system_admin', 'librarian'],
    return: ['system_admin', 'librarian'],
  },
  communication: {
    create_announcement: ['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian'],
    read_announcement: ['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent'],
    publish: ['system_admin', 'school_director', 'academic_head'],
    send_notification: ['system_admin', 'school_director', 'academic_head'],
    send_message: ['system_admin', 'school_director', 'academic_head', 'teacher', 'counselor', 'student', 'parent'],
  },
  counseling: {
    create: ['system_admin', 'school_director', 'academic_head', 'counselor'],
    read: ['system_admin', 'school_director', 'academic_head', 'counselor'],
    edit: ['system_admin', 'school_director', 'academic_head', 'counselor'],
    delete: ['system_admin', 'school_director', 'academic_head'],
  },
  section: {
    create: ['system_admin', 'academic_head'],
    edit: ['system_admin', 'academic_head'],
    read: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'],
    delete: ['system_admin'],
  },
  roster: {
    calculate: ['system_admin', 'academic_head', 'registrar'],
    export: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'],
    promote: ['system_admin', 'academic_head'],
    read_own: ['student', 'parent'],
    read_all: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'],
  },
  ranking: {
    calculate: ['system_admin', 'academic_head'],
    read: ['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent'],
  },
  settings: {
    manage: ['system_admin'],
    read: ['system_admin', 'school_director'],
  },
  user: {
    create: ['system_admin'],
    edit: ['system_admin'],
    delete: ['system_admin'],
    reset_password: ['system_admin'],
    suspend: ['system_admin'],
  },
  subject: {
    create: ['system_admin', 'academic_head'],
    edit: ['system_admin', 'academic_head'],
    delete: ['system_admin'],
    read: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent'],
  },
  classroom: {
    create: ['system_admin', 'academic_head', 'registrar'],
    edit: ['system_admin', 'academic_head', 'registrar'],
    delete: ['system_admin'],
    read: ['system_admin', 'school_director', 'academic_head', 'registrar'],
  },
  assignment: {
    manage: ['system_admin', 'academic_head'],
    batch_assign: ['system_admin', 'academic_head'],
    read: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'],
  },
  event: {
    create: ['system_admin', 'school_director', 'academic_head'],
    read: ['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent'],
    edit: ['system_admin', 'school_director', 'academic_head'],
  },
  alumni: {
    read: ['system_admin', 'school_director', 'academic_head', 'registrar'],
    edit: ['system_admin', 'school_director', 'academic_head', 'registrar'],
  },
  audit: {
    read: ['system_admin', 'school_director'],
    report: ['system_admin'],
  },
  inventory: {
    manage: ['system_admin', 'school_director'],
    read: ['system_admin', 'school_director'],
  },
  transport: {
    manage: ['system_admin', 'school_director'],
    read: ['system_admin', 'school_director', 'academic_head'],
  },
};

export function hasPermission(resource: string, action: string, role?: string): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[resource]?.[action];
  if (!allowed) return false;
  return (allowed as readonly string[]).includes(role);
}

export function canCreateStudents(role?: string): boolean {
  return hasPermission('student', 'create', role);
}

export function canEditStudents(role?: string): boolean {
  return hasPermission('student', 'edit', role);
}

export function canDeleteStudents(role?: string): boolean {
  return hasPermission('student', 'delete', role);
}

export function canPromoteStudents(role?: string): boolean {
  return hasPermission('student', 'promote', role);
}

export function canTransferStudents(role?: string): boolean {
  return hasPermission('student', 'transfer', role);
}

export function canSuspendStudents(role?: string): boolean {
  return hasPermission('student', 'suspend', role);
}

export function canArchiveStudents(role?: string): boolean {
  return hasPermission('student', 'archive', role);
}

export function canGraduateStudents(role?: string): boolean {
  return hasPermission('student', 'graduate', role);
}

export function canViewStudents(role?: string): boolean {
  return hasPermission('student', 'view', role);
}

export function canCreateTeachers(role?: string): boolean {
  return hasPermission('teacher', 'create', role);
}

export function canEditTeachers(role?: string): boolean {
  return hasPermission('teacher', 'edit', role);
}

export function canManageAssessments(role?: string): boolean {
  return hasPermission('assessment', 'create', role);
}

export function canDeleteAssessments(role?: string): boolean {
  return hasPermission('assessment', 'delete', role);
}

export function canEnterMarks(role?: string): boolean {
  return hasPermission('assessment', 'enter_marks', role);
}

export function canMarkAttendance(role?: string): boolean {
  return hasPermission('attendance', 'mark', role);
}

export function canManageFinance(role?: string): boolean {
  return hasPermission('finance', 'create_fee', role);
}

export function canRecordPayment(role?: string): boolean {
  return hasPermission('finance', 'record_payment', role);
}

export function canManageLibrary(role?: string): boolean {
  return hasPermission('library', 'manage_books', role);
}

export function canIssueReturnBook(role?: string): boolean {
  return hasPermission('library', 'borrow', role);
}

export function canCreateAnnouncement(role?: string): boolean {
  return hasPermission('communication', 'create_announcement', role);
}

export function canPublishAnnouncement(role?: string): boolean {
  return hasPermission('communication', 'publish', role);
}

export function canManageCounseling(role?: string): boolean {
  return hasPermission('counseling', 'create', role);
}

export function canManageSections(role?: string): boolean {
  return hasPermission('section', 'create', role);
}

export function canCalculateRoster(role?: string): boolean {
  return hasPermission('roster', 'calculate', role);
}

export function canPromoteRoster(role?: string): boolean {
  return hasPermission('roster', 'promote', role);
}

export function canCalculateRanking(role?: string): boolean {
  return hasPermission('ranking', 'calculate', role);
}

export function canManageSettings(role?: string): boolean {
  return hasPermission('settings', 'manage', role);
}

export function canManageUsers(role?: string): boolean {
  return hasPermission('user', 'create', role);
}

export function canResetPassword(role?: string): boolean {
  return hasPermission('user', 'reset_password', role);
}

export function canSuspendUser(role?: string): boolean {
  return hasPermission('user', 'suspend', role);
}

export function canDeleteUser(role?: string): boolean {
  return hasPermission('user', 'delete', role);
}

export function canManageSubjects(role?: string): boolean {
  return hasPermission('subject', 'create', role);
}

export function canDeleteSubjects(role?: string): boolean {
  return hasPermission('subject', 'delete', role);
}

export function canManageClassrooms(role?: string): boolean {
  return hasPermission('classroom', 'create', role);
}

export function canManageAssignments(role?: string): boolean {
  return hasPermission('assignment', 'manage', role);
}

export function canManageEvents(role?: string): boolean {
  return hasPermission('event', 'create', role);
}

export function canManageInventory(role?: string): boolean {
  return hasPermission('inventory', 'manage', role);
}

export function canManageTransport(role?: string): boolean {
  return hasPermission('transport', 'manage', role);
}

export function canViewAuditLogs(role?: string): boolean {
  return hasPermission('audit', 'read', role);
}

export function getRoleLabel(role?: string): string {
  const labels: Record<string, string> = {
    system_admin: 'System Admin',
    school_director: 'Director',
    academic_head: 'Academic Head',
    registrar: 'Registrar',
    teacher: 'Teacher',
    counselor: 'Counselor',
    librarian: 'Librarian',
    student: 'Student',
    parent: 'Parent',
    finance_officer: 'Finance Officer',
  };
  return labels[role || ''] || role || '';
}
