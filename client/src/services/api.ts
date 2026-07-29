import axios from 'axios';
import type { ApiResponse, ApiPromise, PaginatedParams } from '../types';
import type {
  User, UserParams, Student, StudentParams, Section, SectionParams,
  Assessment, AssessmentParams, AssessmentMark, Attendance, AttendanceParams,
  FeeStructure, Payment, FinanceParams, Book, LibraryParams, Borrowing,
  Announcement, Notification, Ranking, RankingParams, Guardian,
  Teacher, TeacherAssignment, Classroom, Subject,
  DashboardStats, TeacherDashboard, StudentDashboard,
  Event, AuditLog, StudentParams as AdvancedStudentParams,
} from '../types';

/** Use Vite proxy in dev (/api -> localhost:5000). Override with VITE_API_URL in production. */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          const payload = data.data ?? data;
          const accessToken = payload.accessToken;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: unknown, fallback = 'Request failed'): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Cannot reach the server. Open a new terminal in server/ and run: npm run dev';
    }

    const data = error.response?.data;
    const status = error.response?.status;

    if ((status === 500 || status === 503) && !data) {
      return 'Cannot connect to the server. Make sure both the backend and MongoDB are running.';
    }
    if (status === 503) {
      return (data as Record<string, unknown>)?.message as string || 'Database is offline. Please start MongoDB on your computer.';
    }

    if (data) {
      if (typeof data === 'object' && data !== null && (data as Record<string, unknown>).message) {
        return String((data as Record<string, unknown>).message);
      }
      if (typeof data === 'string') {
        if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
          return 'Server returned an HTML error page (500 Internal Server Error). Check backend logs.';
        }
        return data.substring(0, 150);
      }
    }

    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const authAPI = {
  login: (email: string, password: string): ApiPromise<{ accessToken: string; refreshToken: string; user: User }> =>
    api.post('/auth/login', { usernameOrEmail: email, password }),
  logout: (): ApiPromise<void> => api.post('/auth/logout'),
  refresh: (refreshToken: string): ApiPromise<{ accessToken: string }> => api.post('/auth/refresh', { refreshToken }),
  profile: (): ApiPromise<User> => api.get('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string): ApiPromise<void> =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  passwordReset: (data: { email: string; token?: string; newPassword?: string }): ApiPromise<void> =>
    api.post('/auth/password/reset', data),
};

export const usersAPI = {
  list: (params?: UserParams): ApiPromise<User[]> => api.get('/users', { params }),
  create: (data: Partial<User>): ApiPromise<User> => api.post('/users', data),
  get: (id: string): ApiPromise<User> => api.get(`/users/${id}`),
  update: (id: string, data: Partial<User>): ApiPromise<User> => api.put(`/users/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/users/${id}`),
  changeRole: (id: string, role: string): ApiPromise<User> => api.put(`/users/${id}/role`, { role }),
  changeStatus: (id: string, isActive: boolean): ApiPromise<User> => api.put(`/users/${id}/status`, { isActive }),
  resetPassword: (id: string, newPassword: string): ApiPromise<void> => api.put(`/users/${id}/reset-password`, { newPassword }),
};

export const studentsAPI = {
  list: (params?: StudentParams): ApiPromise<Student[]> => api.get('/students', { params }),
  create: (data: Partial<Student>): ApiPromise<Student> => api.post('/students', data),
  get: (id: string): ApiPromise<Student> => api.get(`/students/${id}`),
  update: (id: string, data: Partial<Student>): ApiPromise<Student> => api.put(`/students/${id}`, data),
  transfer: (id: string, data: { reason?: string; school?: string; date?: string }): ApiPromise<Student> => api.post(`/students/${id}/transfer`, data),
  withdraw: (id: string, data: { reason?: string; date?: string }): ApiPromise<Student> => api.post(`/students/${id}/withdraw`, data),
  promote: (id: string, data: { newGrade: number; newSectionId?: string; stream?: string; reason?: string }): ApiPromise<Student> => api.post(`/students/${id}/promote`, data),
  suspend: (id: string, data: { reason?: string; date?: string }): ApiPromise<Student> => api.post(`/students/${id}/suspend`, data),
  archive: (id: string, data?: Record<string, unknown>): ApiPromise<Student> => api.post(`/students/${id}/archive`, data),
  restore: (id: string, data?: Record<string, unknown>): ApiPromise<Student> => api.post(`/students/${id}/restore`, data),
  graduate: (id: string, data?: Record<string, unknown>): ApiPromise<Student> => api.post(`/students/${id}/graduate`, data),
  transcript: (id: string): ApiPromise<AssessmentMark[]> => api.get(`/students/${id}/transcript`),
  fullDetails: (id: string): ApiPromise<Student> => api.get(`/students/${id}/full-details`),
  history: (id: string): ApiPromise<AuditLog[]> => api.get(`/students/${id}/history`),
  advancedSearch: (params: AdvancedStudentParams): ApiPromise<Student[]> => api.post('/students/advanced-search', null, { params }),
  bulkStatus: (data: { studentIds: string[]; status: string; reason?: string }): ApiPromise<void> => api.post('/students/bulk-status', data),
  bulkPromote: (data: { studentIds: string[]; grade: number; sectionId?: string }): ApiPromise<void> => api.post('/students/bulk-promote', data),
  assignSection: (id: string, data: { sectionId: string }): ApiPromise<Student> => api.put(`/students/${id}/section`, data),
  approve: (id: string): ApiPromise<Student> => api.post(`/students/${id}/approve`),
  transfers: (id: string): ApiPromise<AuditLog[]> => api.get(`/students/${id}/transfers`),
  me: {
    get: (): ApiPromise<Student> => api.get('/students/me'),
    update: (data: Partial<Student>): ApiPromise<Student> => api.put('/students/me', data),
    subjects: (): ApiPromise<Subject[]> => api.get('/students/me/subjects'),
  },
};

export const teachersAPI = {
  list: (params?: PaginatedParams): ApiPromise<Teacher[]> => api.get('/teachers', { params }),
  create: (data: Partial<Teacher>): ApiPromise<Teacher> => api.post('/teachers', data),
  get: (id: string): ApiPromise<Teacher> => api.get(`/teachers/${id}`),
  update: (id: string, data: Partial<Teacher>): ApiPromise<Teacher> => api.put(`/teachers/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/teachers/${id}`),
  assign: (data: { teacherId: string; sectionId: string; subjectId: string; periodsPerWeek: number }): ApiPromise<TeacherAssignment> => api.post('/teachers/assign', data),
  unassign: (assignmentId: string): ApiPromise<void> => api.delete(`/teachers/assignments/${assignmentId}`),
  workload: (id: string): ApiPromise<{ totalPeriods: number; assignments: TeacherAssignment[]; isOverloaded: boolean }> => api.get(`/teachers/${id}/workload`),
  assignments: (id: string): ApiPromise<TeacherAssignment[]> => api.get(`/teachers/${id}/assignments`),
  attendance: {
    record: (id: string, data: { date: string; status: string }): ApiPromise<void> => api.post(`/teachers/${id}/attendance`, data),
    list: (id: string, params?: PaginatedParams): ApiPromise<Attendance[]> => api.get(`/teachers/${id}/attendance`, { params }),
  },
  leaves: {
    request: (id: string, data: { startDate: string; endDate: string; reason: string }): ApiPromise<void> => api.post(`/teachers/${id}/leaves`, data),
    approve: (id: string, leaveId: string, data: { status: string; remarks?: string }): ApiPromise<void> => api.put(`/teachers/${id}/leaves/${leaveId}`, data),
  },
  transfer: (id: string, data: { reason?: string; school?: string }): ApiPromise<Teacher> => api.post(`/teachers/${id}/transfer`, data),
  performance: {
    get: (id: string, params?: PaginatedParams): ApiPromise<Record<string, unknown>> => api.get(`/teachers/${id}/performance`, { params }),
    update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/teachers/${id}/performance`, data),
  },
  dashboard: (params?: PaginatedParams): ApiPromise<Record<string, unknown>> => api.get('/teachers/dashboard', { params }),
  my: {
    dashboard: (): ApiPromise<TeacherDashboard> => api.get('/teachers/my/dashboard'),
    timetable: (): ApiPromise<unknown[]> => api.get('/teachers/my/timetable'),
    sections: (): ApiPromise<Section[]> => api.get('/teachers/my/sections'),
    sectionStudents: (sectionId: string): ApiPromise<Student[]> => api.get(`/teachers/my/sections/${sectionId}/students`),
    sectionAssessments: (sectionId: string): ApiPromise<Assessment[]> => api.get(`/teachers/my/sections/${sectionId}/assessments`),
    sectionSubjects: (): ApiPromise<Subject[]> => api.get('/teachers/my/section-subjects'),
    sectionAttendance: (sectionId: string, params?: PaginatedParams): ApiPromise<Attendance[]> => api.get(`/teachers/my/sections/${sectionId}/attendance`, { params }),
    subjects: (): ApiPromise<Subject[]> => api.get('/teachers/my/subjects'),
    assessments: (params?: AssessmentParams): ApiPromise<Assessment[]> => api.get('/teachers/my/assessments', { params }),
    marks: (params?: Record<string, unknown>): ApiPromise<AssessmentMark[]> => api.get('/teachers/my/marks', { params }),
    saveMarks: (data: Record<string, unknown>): ApiPromise<void> => api.post('/teachers/my/marks', data),
    attendance: (data: Record<string, unknown>): ApiPromise<void> => api.post('/teachers/my/attendance', data),
    performance: (): ApiPromise<Record<string, unknown>> => api.get('/teachers/my/performance'),
    reports: (type: string): ApiPromise<Record<string, unknown>> => api.get(`/teachers/my/reports/${type}`),
  },
  trainings: {
    list: (id: string): ApiPromise<unknown[]> => api.get(`/teachers/${id}/trainings`),
    create: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.post(`/teachers/${id}/trainings`, data),
  },
  disciplinary: {
    list: (id: string): ApiPromise<unknown[]> => api.get(`/teachers/${id}/disciplinary`),
    create: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.post(`/teachers/${id}/disciplinary`, data),
    update: (id: string, recordId: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/teachers/${id}/disciplinary/${recordId}`, data),
  },
};

export const sectionsAPI = {
  list: (params?: SectionParams): ApiPromise<Section[]> => api.get('/sections', { params }),
  create: (data: Partial<Section>): ApiPromise<Section> => api.post('/sections', data),
  get: (id: string): ApiPromise<Section> => api.get(`/sections/${id}`),
  update: (id: string, data: Partial<Section>): ApiPromise<Section> => api.put(`/sections/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/sections/${id}`),
  students: (id: string): ApiPromise<Student[]> => api.get(`/sections/${id}/students`),
  subjects: (id: string): ApiPromise<Subject[]> => api.get(`/sections/${id}/subjects`),
  archive: (id: string, data?: Record<string, unknown>): ApiPromise<Section> => api.post(`/sections/${id}/archive`, data),
  restore: (id: string): ApiPromise<Section> => api.post(`/sections/${id}/restore`),
  history: (id: string): ApiPromise<AuditLog[]> => api.get(`/sections/${id}/history`),
  assignStudents: (id: string, data: { studentIds: string[] }): ApiPromise<void> => api.post(`/sections/${id}/students`, data),
  removeStudent: (id: string, studentId: string): ApiPromise<void> => api.delete(`/sections/${id}/students/${studentId}`),
  transferStudent: (studentId: string, data: { targetSectionId: string; reason?: string }): ApiPromise<void> => api.post(`/sections/transfer/${studentId}`, data),
  transfers: (id: string): ApiPromise<AuditLog[]> => api.get(`/sections/${id}/transfers`),
  performance: (id: string, params?: PaginatedParams): ApiPromise<Record<string, unknown>> => api.get(`/sections/${id}/performance`, { params }),
  attendance: (id: string, params?: PaginatedParams): ApiPromise<Record<string, unknown>> => api.get(`/sections/${id}/attendance`, { params }),
  dashboard: (params?: SectionParams): ApiPromise<Record<string, unknown>> => api.get('/sections/dashboard', { params }),
  balance: (data: Record<string, unknown>): ApiPromise<void> => api.post('/sections/balance', data),
  bulkCreate: (data: { sections: Partial<Section>[] }): ApiPromise<Section[]> => api.post('/sections/bulk-create', data),
  rollover: (data: { fromAcademicYear: string; toAcademicYear: string }): ApiPromise<void> => api.post('/sections/rollover', data),
  archiveMultiple: (data: { sectionIds: string[] }): ApiPromise<void> => api.post('/sections/archive-multiple', data),

  report: (id: string, params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get(`/sections/${id}/report`, { params }),
  analytics: (id: string, params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get(`/sections/${id}/analytics`, { params }),
  subjectsDetail: (id: string, params?: Record<string, unknown>): ApiPromise<unknown[]> => api.get(`/sections/${id}/subjects-detail`, { params }),
  enrollmentTrend: (id: string): ApiPromise<{ trend: unknown[] }> => api.get(`/sections/${id}/enrollment-trend`),

  // New roster management endpoints
  assignHomeroomTeacher: (id: string, teacherId: string | null): ApiPromise<Section> =>
    api.put(`/sections/${id}/homeroom-teacher`, { teacherId }),
  getClassRoster: (id: string): ApiPromise<Record<string, unknown>> =>
    api.get(`/sections/${id}/class-roster`),
  mergeSections: (data: { sourceSectionId: string; targetSectionId: string; reason?: string }): ApiPromise<Record<string, unknown>> =>
    api.post('/sections/merge', data),
  bulkTransfer: (data: { studentIds: string[]; targetSectionId: string; reason?: string }): ApiPromise<Record<string, unknown>> =>
    api.post('/sections/bulk-transfer', data),
};

export const assessmentsAPI = {
  list: (params?: AssessmentParams): ApiPromise<Assessment[]> => api.get('/assessments', { params }),
  create: (data: Partial<Assessment>): ApiPromise<Assessment> => api.post('/assessments', data),
  get: (id: string): ApiPromise<Assessment> => api.get(`/assessments/${id}`),
  update: (id: string, data: Partial<Assessment>): ApiPromise<Assessment> => api.put(`/assessments/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/assessments/${id}`),
  enterMarks: (id: string, data: { marks: { studentId: string; marksObtained: number }[] }): ApiPromise<void> => api.put(`/assessments/${id}/marks`, data),
  submit: (id: string): ApiPromise<Assessment> => api.post(`/assessments/${id}/submit`),
  verify: (id: string): ApiPromise<Assessment> => api.post(`/assessments/${id}/verify`),
  approve: (id: string): ApiPromise<Assessment> => api.post(`/assessments/${id}/approve`),
  reject: (id: string, data: { reason: string }): ApiPromise<Assessment> => api.post(`/assessments/${id}/reject`, data),
  publish: (id: string): ApiPromise<Assessment> => api.post(`/assessments/${id}/publish`),
  lock: (id: string): ApiPromise<Assessment> => api.post(`/assessments/${id}/lock`),
  unlock: (id: string): ApiPromise<Assessment> => api.post(`/assessments/${id}/unlock`),
  reportCard: (studentId: string, params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get(`/assessments/report-card/${studentId}`, { params }),
  atRiskStudents: (params?: Record<string, unknown>): ApiPromise<Student[]> => api.get('/assessments/analytics/at-risk', { params }),

  studentAssessments: (studentId: string): ApiPromise<Assessment[]> => api.get(`/assessments/student/${studentId}`),
  myGrades: (): ApiPromise<AssessmentMark[]> => api.get('/assessments/my-grades'),
  studentMarksSummary: (studentId: string, params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> =>
    api.get(`/assessments/student/${studentId}/summary`, { params }),
  studentTranscript: (studentId: string, params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> =>
    api.get(`/assessments/student/${studentId}/transcript`, { params }),
  myChildrenMarks: (): ApiPromise<AssessmentMark[]> => api.get('/assessments/my-children-marks'),
  homeroomSectionMarks: (sectionId: string, params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get(`/assessments/homeroom/${sectionId}`, { params }),
  dashboard: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get('/assessments/dashboard', { params }),
  myTeacherAssessments: (params?: AssessmentParams): ApiPromise<Assessment[]> => api.get('/assessments/my-teacher-assessments', { params }),
  exportMarks: (assessmentId: string): ApiPromise<Blob> => api.get(`/assessments/${assessmentId}/marks/export`, { responseType: 'blob' }),
  importMarks: (assessmentId: string, csvContent: string): ApiPromise<void> =>
    api.post(`/assessments/${assessmentId}/marks/import`, { csvContent }),
  deleteMark: (assessmentId: string, studentId: string): ApiPromise<void> =>
    api.delete(`/assessments/${assessmentId}/marks/${studentId}`),
  deleteAllMarks: (assessmentId: string): ApiPromise<void> =>
    api.delete(`/assessments/${assessmentId}/marks`),
  gradeBook: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get('/assessments/gradebook', { params }),
};

export const attendanceAPI = {
  list: (params?: AttendanceParams): ApiPromise<Attendance[]> => api.get('/attendance', { params }),
  mark: (data: { sectionId: string; date: string; records: { studentId: string; status: string; remarks?: string }[] }): ApiPromise<void> => api.post('/attendance', data),
  update: (id: string, data: Partial<Attendance>): ApiPromise<Attendance> => api.put(`/attendance/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/attendance/${id}`),
  studentHistory: (studentId: string): ApiPromise<Attendance[]> => api.get(`/attendance/student/${studentId}`),
  sectionSheet: (sectionId: string, date: string): ApiPromise<Attendance[]> => api.get(`/attendance/section/${sectionId}/sheet/${date}`),
  myAttendance: (): ApiPromise<Attendance[]> => api.get('/attendance/my-attendance'),
  myChildrenAttendance: (): ApiPromise<Attendance[]> => api.get('/attendance/my-children-attendance'),
  reports: (params?: AttendanceParams): ApiPromise<Record<string, unknown>> => api.get('/attendance/reports/summary', { params }),
  schoolSummary: (params?: AttendanceParams): ApiPromise<Record<string, unknown>> => api.get('/attendance/school-summary', { params }),
  todayDashboard: (): ApiPromise<Record<string, unknown>> => api.get('/attendance/dashboard/today'),
  chronicAbsentees: (params?: AttendanceParams): ApiPromise<Student[]> => api.get('/attendance/chronic-absentees', { params }),
  corrections: {
    list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/attendance/corrections', { params }),
    request: (data: { attendanceId: string; newStatus: string; reason: string }): ApiPromise<void> => api.post('/attendance/corrections', data),
    review: (id: string, data: { status: string; notes?: string }): ApiPromise<void> => api.put(`/attendance/corrections/${id}/review`, data),
  },
};

export const financeAPI = {
  feeStructures: (params?: FinanceParams): ApiPromise<FeeStructure[]> => api.get('/finance/structures', { params }),
  createFeeStructure: (data: Partial<FeeStructure>): ApiPromise<FeeStructure> => api.post('/finance', data),
  updateFeeStructure: (id: string, data: Partial<FeeStructure>): ApiPromise<FeeStructure> => api.put(`/finance/structures/${id}`, data),
  deleteFeeStructure: (id: string): ApiPromise<void> => api.delete(`/finance/structures/${id}`),
  studentFeeStatus: (studentId: string, academicYear: string): ApiPromise<{ totalFees: number; totalPaid: number; outstanding: number; payments: Payment[] }> =>
    api.get(`/finance/students/${studentId}/status`, { params: { academicYear } }),
  recordPayment: (data: { studentId: string; amount: number; paymentMethod: string; transactionReference?: string; academicYear: string }): ApiPromise<Payment> => api.post('/finance/payments', data),
  getReceipt: (paymentId: string): ApiPromise<Payment> => api.get(`/finance/payments/${paymentId}/receipt`),
  collectionReports: (params?: FinanceParams): ApiPromise<Record<string, unknown>> => api.get('/finance/reports/collection', { params }),
  outstandingReports: (params?: FinanceParams): ApiPromise<Record<string, unknown>> => api.get('/finance/reports/outstanding', { params }),
};

export const libraryAPI = {
  books: (params?: LibraryParams): ApiPromise<Book[]> => api.get('/library/books', { params }),
  searchBooks: (params?: LibraryParams): ApiPromise<Book[]> => api.get('/library/books/search', { params }),
  addBook: (data: Partial<Book>): ApiPromise<Book> => api.post('/library/books', data),
  updateBook: (id: string, data: Partial<Book>): ApiPromise<Book> => api.put(`/library/books/${id}`, data),
  deleteBook: (id: string): ApiPromise<void> => api.delete(`/library/books/${id}`),
  borrow: (data: { bookId: string; borrowerId: string; borrowerModel: 'Student' | 'Teacher'; dueDate?: string }): ApiPromise<Borrowing> => api.post('/library/borrowings', data),
  return: (borrowingId: string): ApiPromise<Borrowing> => api.put(`/library/borrowings/${borrowingId}/return`),
  listBorrowings: (params?: PaginatedParams): ApiPromise<Borrowing[]> => api.get('/library/borrowings', { params }),
  myBorrowings: (): ApiPromise<Borrowing[]> => api.get('/library/borrowings/my'),
  borrowingHistory: (userId: string): ApiPromise<Borrowing[]> => api.get(`/library/borrowings/user/${userId}`),
  overdueReport: (params?: PaginatedParams): ApiPromise<Borrowing[]> => api.get('/library/reports/overdue', { params }),
  statistics: (): ApiPromise<Record<string, unknown>> => api.get('/library/statistics'),
};

export const communicationAPI = {
  announcements: (params?: PaginatedParams): ApiPromise<Announcement[]> => api.get('/communications/announcements', { params }),
  createAnnouncement: (data: Partial<Announcement>): ApiPromise<Announcement> => api.post('/communications/announcements', data),
  updateAnnouncement: (id: string, data: Partial<Announcement>): ApiPromise<Announcement> => api.put(`/communications/announcements/${id}`, data),
  deleteAnnouncement: (id: string): ApiPromise<void> => api.delete(`/communications/announcements/${id}`),
  notifications: (params?: PaginatedParams): ApiPromise<Notification[]> => api.get('/communications/notifications', { params }),
  markNotificationRead: (id: string): ApiPromise<Notification> => api.put(`/communications/notifications/${id}/read`),
  markAllNotificationsRead: (): ApiPromise<void> => api.put('/communications/notifications/read-all'),
  deleteNotification: (id: string): ApiPromise<void> => api.delete(`/communications/notifications/${id}`),
  sendNotification: (data: { recipientId: string; type: string; title: string; message: string }): ApiPromise<Notification> => api.post('/communications/notifications', data),
};

export const messagesAPI = {
  inbox: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/messages/inbox', { params }),
  outbox: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/messages/outbox', { params }),
  send: (data: { recipientId: string; subject: string; content: string }): ApiPromise<void> => api.post('/messages', data),
  thread: (threadId: string): ApiPromise<unknown[]> => api.get(`/messages/thread/${threadId}`),
  markRead: (id: string): ApiPromise<void> => api.put(`/messages/${id}/read`),
  markAllRead: (): ApiPromise<void> => api.put('/messages/read-all'),
  delete: (id: string): ApiPromise<void> => api.delete(`/messages/${id}`),
  unreadCount: (): ApiPromise<{ count: number }> => api.get('/messages/unread-count'),
};

export const rankingsAPI = {
  list: (params?: RankingParams): ApiPromise<Ranking[]> => api.get('/rankings/school', { params }),
  myRanking: (): ApiPromise<Ranking> => api.get('/rankings/my-ranking'),
  studentRanking: (id: string): ApiPromise<Ranking> => api.get(`/rankings/student/${id}`),
  sectionRankings: (id: string): ApiPromise<Ranking[]> => api.get(`/rankings/section/${id}`),
  gradeRankings: (grade: number): ApiPromise<Ranking[]> => api.get(`/rankings/grade/${grade}`),
  streamRankings: (grade: number, stream: string): ApiPromise<Ranking[]> => api.get(`/rankings/stream/${grade}/${stream}`),
  calculate: (): ApiPromise<void> => api.post('/rankings/calculate'),
};

export const guardiansAPI = {
  list: (params?: PaginatedParams): ApiPromise<Guardian[]> => api.get('/guardians', { params }),
  create: (data: Partial<Guardian>): ApiPromise<Guardian> => api.post('/guardians', data),
  get: (id: string): ApiPromise<Guardian> => api.get(`/guardians/${id}`),
  update: (id: string, data: Partial<Guardian>): ApiPromise<Guardian> => api.put(`/guardians/${id}`, data),
  linkStudent: (id: string, studentId: string): ApiPromise<Guardian> => api.post(`/guardians/${id}/link-student`, { studentId }),
  unlinkStudent: (id: string, studentId: string): ApiPromise<Guardian> => api.post(`/guardians/${id}/unlink-student`, { studentId }),
  me: {
    get: (): ApiPromise<Guardian> => api.get('/guardians/me'),
  },
};

export const timetablesAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/timetables', { params }),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/timetables', data),
  getBySection: (sectionId: string, academicYear?: string): ApiPromise<unknown> =>
    api.get(`/timetables/section/${sectionId}`, { params: { academicYear } }),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/timetables/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/timetables/${id}`),
  addSlot: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.post(`/timetables/${id}/slots`, data),
  removeSlot: (id: string, slotId: string): ApiPromise<void> => api.delete(`/timetables/${id}/slots/${slotId}`),
};

export const classroomsAPI = {
  list: (params?: PaginatedParams): ApiPromise<Classroom[]> => api.get('/classrooms', { params }),
  create: (data: Partial<Classroom>): ApiPromise<Classroom> => api.post('/classrooms', data),
  update: (id: string, data: Partial<Classroom>): ApiPromise<Classroom> => api.put(`/classrooms/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/classrooms/${id}`),
};

export const counselingAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/counseling', { params }),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/counseling', data),
  get: (id: string): ApiPromise<unknown> => api.get(`/counseling/${id}`),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/counseling/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/counseling/${id}`),
};

export const behavioralAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/behavioral', { params }),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/behavioral', data),
  get: (id: string): ApiPromise<unknown> => api.get(`/behavioral/${id}`),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/behavioral/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/behavioral/${id}`),
};

export const studentHealthAPI = {
  get: (studentId: string): ApiPromise<unknown> => api.get(`/health-check/${studentId}`),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/health-check', data),
  update: (studentId: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/health-check/${studentId}`, data),
  addVisit: (studentId: string, data: Record<string, unknown>): ApiPromise<void> => api.post(`/health-check/${studentId}/visits`, data),
  addImmunization: (studentId: string, data: Record<string, unknown>): ApiPromise<void> => api.post(`/health-check/${studentId}/immunizations`, data),
};

export const subjectsAPI = {
  list: (params?: PaginatedParams): ApiPromise<Subject[]> => api.get('/subjects', { params }),
  create: (data: Partial<Subject>): ApiPromise<Subject> => api.post('/subjects', data),
  get: (id: string): ApiPromise<Subject> => api.get(`/subjects/${id}`),
  update: (id: string, data: Partial<Subject>): ApiPromise<Subject> => api.put(`/subjects/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/subjects/${id}`),
  toggleStatus: (id: string, status: string): ApiPromise<Subject> => api.put(`/subjects/${id}/status`, { status }),
  dashboard: (): ApiPromise<Record<string, unknown>> => api.get('/subjects/dashboard'),
  report: (id: string): ApiPromise<Record<string, unknown>> => api.get(`/subjects/${id}/report`),
  assignments: {
    list: (params?: PaginatedParams): ApiPromise<TeacherAssignment[]> => api.get('/subjects/assignments', { params }),
    create: (data: Record<string, unknown>): ApiPromise<TeacherAssignment> => api.post('/subjects/assignments', data),
    copy: (data: Record<string, unknown>): ApiPromise<void> => api.post('/subjects/assignments/copy', data),
    delete: (id: string): ApiPromise<void> => api.delete(`/subjects/assignments/${id}`),
  },
  resources: {
    list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/subjects/resources', { params }),
    create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/subjects/resources', data),
    update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/subjects/resources/${id}`, data),
    delete: (id: string): ApiPromise<void> => api.delete(`/subjects/resources/${id}`),
  },
  materials: {
    list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/subjects/materials', { params }),
    create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/subjects/materials', data),
    delete: (id: string): ApiPromise<void> => api.delete(`/subjects/materials/${id}`),
  },
  schedules: {
    list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/subjects/schedules', { params }),
    create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/subjects/schedules', data),
    update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/subjects/schedules/${id}`, data),
    delete: (id: string): ApiPromise<void> => api.delete(`/subjects/schedules/${id}`),
  },
  reports: {
    performance: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get('/subjects/reports/performance', { params }),
    ranking: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get('/subjects/reports/ranking', { params }),
    sectionPerformance: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get('/subjects/reports/section-performance', { params }),
  },
};

export const eventsAPI = {
  list: (params?: PaginatedParams): ApiPromise<Event[]> => api.get('/events', { params }),
  create: (data: Partial<Event>): ApiPromise<Event> => api.post('/events', data),
  get: (id: string): ApiPromise<Event> => api.get(`/events/${id}`),
  update: (id: string, data: Partial<Event>): ApiPromise<Event> => api.put(`/events/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/events/${id}`),
};

export const alumniAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/alumni', { params }),
  get: (id: string): ApiPromise<unknown> => api.get(`/alumni/${id}`),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/alumni/${id}`, data),
  stats: (): ApiPromise<Record<string, unknown>> => api.get('/alumni/stats'),
};

export const dashboardAPI = {
  stats: (): ApiPromise<DashboardStats> => api.get('/dashboard/stats'),
  teacher: (): ApiPromise<TeacherDashboard> => api.get('/dashboard/teacher'),
  student: (): ApiPromise<StudentDashboard> => api.get('/dashboard/student'),
};

export const gradeScaleAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/grade-scales', { params }),
  active: (): ApiPromise<unknown> => api.get('/grade-scales/active'),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/grade-scales', data),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/grade-scales/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/grade-scales/${id}`),
};

export const assignmentsAPI = {
  dashboard: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get('/assignments/dashboard', { params }),
  unassignedStudents: (params?: Record<string, unknown>): ApiPromise<Student[]> => api.get('/assignments/students/unassigned', { params }),
  batchAssignStudents: (data: { sectionId: string; studentIds: string[] }): ApiPromise<Record<string, unknown>> => api.post('/assignments/students/batch-assign', data),
  sectionOverview: (id: string): ApiPromise<Record<string, unknown>> => api.get(`/assignments/sections/${id}/overview`),
  batchAssignTeacher: (data: Record<string, unknown>): ApiPromise<void> => api.post('/assignments/teachers/batch-assign', data),
  workloadCheck: (id: string): ApiPromise<{ isOverloaded: boolean; totalPeriods: number }> => api.get(`/assignments/teachers/${id}/workload-check`),
  assignSectionSubjectTeacher: (data: { teacherId: string; sectionId: string; subjectId: string; periodsPerWeek: number }): ApiPromise<TeacherAssignment> => api.post('/assignments/section-subject-teacher', data),
  teacherAssignments: (): ApiPromise<TeacherAssignment[]> => api.get('/section-assign/teacher-assignments'),
  history: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>[]> => api.get('/assignments/history', { params }),
  reports: (params?: Record<string, unknown>): ApiPromise<Record<string, unknown>> => api.get('/assignments/reports', { params }),
};

export const sectionAssignAPI = {
  sections: (params?: SectionParams): ApiPromise<Section[]> => api.get('/section-assign/sections', { params }),
  teachers: (): ApiPromise<Teacher[]> => api.get('/section-assign/teachers'),
  sectionData: (sectionId: string): ApiPromise<Record<string, unknown>> => api.get(`/section-assign/${sectionId}/data`),
  assignTeacher: (data: { teacherId: string; subjectId: string; periodsPerWeek: number }): ApiPromise<TeacherAssignment> => api.post('/section-assign/assign-teacher', data),
  removeAssignment: (assignmentId: string): ApiPromise<void> => api.delete(`/section-assign/assignment/${assignmentId}`),
  subjectMarks: (sectionId: string, subjectId: string): ApiPromise<AssessmentMark[]> =>
    api.get(`/section-assign/${sectionId}/subject/${subjectId}/marks`),
  saveSubjectMarks: (sectionId: string, subjectId: string, data: { entries: { assessmentId: string; studentId: string; marksObtained: number }[] }): ApiPromise<void> =>
    api.post(`/section-assign/${sectionId}/subject/${subjectId}/marks`, data),
  teacherAssignments: (): ApiPromise<TeacherAssignment[]> => api.get('/section-assign/teacher-assignments'),
};

export const announcementsAPI = {
  list: (params?: PaginatedParams): ApiPromise<Announcement[]> => api.get('/announcements', { params }),
  get: (id: string): ApiPromise<Announcement> => api.get(`/announcements/${id}`),
  create: (data: Partial<Announcement>): ApiPromise<Announcement> => api.post('/announcements', data),
  update: (id: string, data: Partial<Announcement>): ApiPromise<Announcement> => api.put(`/announcements/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/announcements/${id}`),
  publish: (id: string): ApiPromise<Announcement> => api.post(`/announcements/${id}/publish`),
  unpublish: (id: string): ApiPromise<Announcement> => api.post(`/announcements/${id}/unpublish`),
  archive: (id: string): ApiPromise<Announcement> => api.post(`/announcements/${id}/archive`),
  markRead: (id: string): ApiPromise<void> => api.post(`/announcements/${id}/read`),
  stats: (): ApiPromise<Record<string, unknown>> => api.get('/announcements/stats'),
};

export const transportAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/transport', { params }),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/transport', data),
  get: (id: string): ApiPromise<unknown> => api.get(`/transport/${id}`),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/transport/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/transport/${id}`),
  report: (): ApiPromise<Record<string, unknown>> => api.get('/transport/reports/summary'),
};

export const inventoryAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/inventory', { params }),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/inventory', data),
  get: (id: string): ApiPromise<unknown> => api.get(`/inventory/${id}`),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/inventory/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/inventory/${id}`),
  report: (): ApiPromise<Record<string, unknown>> => api.get('/inventory/report'),
};

export const academicTermsAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/academic-terms', { params }),
  create: (data: Record<string, unknown>): ApiPromise<void> => api.post('/academic-terms', data),
  getCurrent: (): ApiPromise<unknown> => api.get('/academic-terms/current'),
  setCurrent: (id: string): ApiPromise<void> => api.put(`/academic-terms/${id}/current`),
  update: (id: string, data: Record<string, unknown>): ApiPromise<void> => api.put(`/academic-terms/${id}`, data),
  delete: (id: string): ApiPromise<void> => api.delete(`/academic-terms/${id}`),
};

export const documentsAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/documents', { params }),
  get: (id: string): ApiPromise<unknown> => api.get(`/documents/${id}`),
  upload: (data: FormData): ApiPromise<unknown> => api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: (id: string): ApiPromise<Blob> => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  verify: (id: string): ApiPromise<void> => api.put(`/documents/${id}/verify`),
  delete: (id: string): ApiPromise<void> => api.delete(`/documents/${id}`),
};

export const transferLogsAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/transfer-logs', { params }),
  get: (id: string): ApiPromise<unknown> => api.get(`/transfer-logs/${id}`),
  delete: (id: string): ApiPromise<void> => api.delete(`/transfer-logs/${id}`),
  restore: (id: string): ApiPromise<void> => api.patch(`/transfer-logs/${id}/restore`),
};

export const auditAPI = {
  list: (params?: PaginatedParams): ApiPromise<unknown[]> => api.get('/audit-logs', { params }),
  get: (id: string): ApiPromise<unknown> => api.get(`/audit-logs/${id}`),
  stats: (params?: PaginatedParams): ApiPromise<unknown> => api.get('/audit-logs/stats', { params }),
};

export default api;
