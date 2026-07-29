import api from './api';

export const rosterAPI = {
  getDashboardStats: (academicYear?: string) =>
    api.get(`/rosters/dashboard${academicYear ? `?academicYear=${academicYear}` : ''}`),

  getEnhancedDashboard: (academicYear?: string) =>
    api.get(`/rosters/dashboard/enhanced${academicYear ? `?academicYear=${academicYear}` : ''}`),

  getSemesterRoster: (params: { academicYear?: string; semester: '1' | '2'; sectionId?: string; grade?: string }) =>
    api.get('/rosters/semester', { params }),

  calculateSemesterRoster: (data: { academicYear: string; semester: '1' | '2' }) =>
    api.post('/rosters/semester/calculate', data),

  getAnnualRoster: (params: { academicYear?: string; sectionId?: string; grade?: string }) =>
    api.get('/rosters/annual', { params }),

  calculateAnnualRoster: (data: { academicYear: string }) =>
    api.post('/rosters/annual/calculate', data),

  saveSemesterMark: (data: { studentId: string; semester: '1' | '2'; subjectId: string; mark: number; grade: string; academicYear?: string }) =>
    api.post('/rosters/mark', data),

  bulkSaveMarks: (data: { sectionId: string; semester: '1' | '2'; subjectId: string; academicYear: string; marks: { studentId: string; mark: number; grade: string }[] }) =>
    api.put('/rosters/marks', data),

  promoteStudents: (data: { academicYear: string; studentIds: string[]; action?: 'promote' | 'repeat' | 'hold' }) =>
    api.post('/rosters/promote', data),

  getSectionsForRoster: (params?: { academicYear?: string; grade?: string }) =>
    api.get('/rosters/sections', { params }),

  getMyResults: (params: { academicYear?: string; semester?: string }) =>
    api.get('/rosters/my-results', { params }),

  getSubjectBreakdown: (params: { studentId: string; academicYear: string; semester?: string }) =>
    api.get('/rosters/subject-breakdown', { params }),

  getReportCard: (params: { studentId: string; academicYear: string }) =>
    api.get('/rosters/report-card', { params }),

  transitionAcademicYear: (data: { currentAcademicYear: string; newAcademicYear: string; sectionAssignments: { studentId: string; newSectionId: string }[] }) =>
    api.post('/rosters/transition', data),

  // Section class roster
  getClassRoster: (sectionId: string) =>
    api.get(`/sections/${sectionId}/class-roster`),

  // Section roster with filters
  getSectionRoster: (sectionId: string, params?: { academicYear?: string }) =>
    api.get(`/sections/${sectionId}/class-roster`, { params }),
};
