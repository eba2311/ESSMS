import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { StudentListPage } from './pages/students/StudentListPage';
import { StudentFormPage } from './pages/students/StudentFormPage';
import { StudentProfilePage } from './pages/students/StudentProfilePage';
import { AdvancedStudentSearchPage } from './pages/students/AdvancedStudentSearchPage';
import { BulkPromotePage } from './pages/students/BulkPromotePage';
import { TeacherListPage } from './pages/teachers/TeacherListPage';
import { TeacherFormPage } from './pages/teachers/TeacherFormPage';
import { TeacherProfilePage } from './pages/teachers/TeacherProfilePage';
import { MyTeacherDashboard } from './pages/teachers/MyTeacherDashboard';
import { MyTeacherTimetable } from './pages/teachers/MyTeacherTimetable';
import { MyTeacherSections } from './pages/teachers/MyTeacherSections';
import { MyTeacherSectionStudents } from './pages/teachers/MyTeacherSectionStudents';
import { MyTeacherMarks } from './pages/teachers/MyTeacherMarks';
import { MyTeacherReports } from './pages/teachers/MyTeacherReports';
import { MyTeacherSectionAssessments } from './pages/teachers/MyTeacherSectionAssessments';
import { MarksManagementPage } from './pages/assessments/MarksManagementPage';
import { AssessmentFormPage } from './pages/assessments/AssessmentFormPage';
import { MarksEntryPage } from './pages/assessments/MarksEntryPage';
import { ReportCardPage as AssessmentReportCardPage } from './pages/assessments/ReportCardPage';
import { AttendanceSheetPage } from './pages/attendance/AttendanceSheetPage';
import { AttendanceReportsPage } from './pages/attendance/AttendanceReportsPage';
import { AttendanceDashboardPage } from './pages/attendance/AttendanceDashboardPage';
import { AttendanceCorrectionPage } from './pages/attendance/AttendanceCorrectionPage';
import { FeeStructurePage } from './pages/finance/FeeStructurePage';
import { PaymentPage } from './pages/finance/PaymentPage';
import { FinanceReportsPage } from './pages/finance/FinanceReportsPage';
import { LibraryBooksPage } from './pages/library/LibraryBooksPage';
import { LibraryBorrowingPage } from './pages/library/LibraryBorrowingPage';
import { AnnouncementsPage } from './pages/communications/AnnouncementsPage';
import { NotificationCenterPage } from './pages/communications/NotificationCenterPage';
import { MessagesPage } from './pages/communications/MessagesPage';
import { TimetablePage } from './pages/schedules/TimetablePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MfaVerificationPage } from './pages/auth/MFAVerificationPage';
import { PasswordResetPage } from './pages/auth/PasswordResetPage';
import { SectionListPage } from './pages/sections/SectionListPage';
import { SectionProfilePage } from './pages/sections/SectionProfilePage';
import { SectionDashboardPage } from './pages/sections/SectionDashboardPage';
import { SectionReportsPage } from './pages/sections/SectionReportsPage';
import { SectionAnalyticsPage } from './pages/sections/SectionAnalyticsPage';
import { RankingPage } from './pages/rankings/RankingPage';
import { ReportCardPage } from './pages/reports/ReportCardPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { GuardianPortalPage } from './pages/guardians/GuardianPortalPage';
import { StudentDashboardPage } from './pages/students/StudentDashboardPage';
import { StudentMyProfilePage } from './pages/students/StudentMyProfilePage';
import { MyAttendancePage } from './pages/attendance/MyAttendancePage';
import { MyGradesPage } from './pages/assessments/MyGradesPage';
import { MyTimetablePage } from './pages/schedules/MyTimetablePage';
import { ClassroomsPage } from './pages/classrooms/ClassroomsPage';
import { CounselingPage } from './pages/counseling/CounselingPage';
import { DisciplinePage } from './pages/discipline/DisciplinePage';
import { HealthPage } from './pages/health/HealthPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { UsersPage } from './pages/users/UsersPage';
import { UserFormPage } from './pages/users/UserFormPage';
import { UserProfilePage } from './pages/users/UserProfilePage';
import { PasswordManagerPage } from './pages/users/PasswordManagerPage';
import { SubjectListPage } from './pages/subjects/SubjectListPage';
import { SubjectFormPage } from './pages/subjects/SubjectFormPage';
import { SubjectDetailPage } from './pages/subjects/SubjectDetailPage';
import { AlumniPage } from './pages/alumni/AlumniPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { TransferLogListPage } from './pages/admin/TransferLogListPage';
import { TransportPage } from './pages/transport/TransportPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { AcademicTermsPage } from './pages/academicTerms/AcademicTermsPage';
import { AssignmentDashboardPage } from './pages/assignments/AssignmentDashboardPage';
import { UnassignedStudentsPage } from './pages/assignments/UnassignedStudentsPage';
import { TeacherBatchAssignPage } from './pages/assignments/TeacherBatchAssignPage';
import { SectionOverviewPage } from './pages/assignments/SectionOverviewPage';
import { AssignmentReportsPage } from './pages/assignments/AssignmentReportsPage';
import { SectionAssignPage } from './pages/assignments/SectionAssignPage';
import { SectionMarksPage } from './pages/assignments/SectionMarksPage';
import { TeacherAssignmentsPage } from './pages/assignments/TeacherAssignmentsPage';
import { BulkStudentAssignPage } from './pages/assignments/BulkStudentAssignPage';
import { AssignmentHistoryPage } from './pages/assignments/AssignmentHistoryPage';
import { RosterDashboardPage } from './pages/rosters/RosterDashboardPage';
import { SemesterRosterPage } from './pages/rosters/SemesterRosterPage';
import { AnnualRosterPage } from './pages/rosters/AnnualRosterPage';
import { ClassRosterPage } from './pages/rosters/ClassRosterPage';
import { RosterMarkEntryPage } from './pages/rosters/RosterMarkEntryPage';
import { PromotionPage } from './pages/rosters/PromotionPage';
import { StudentResultsPage } from './pages/rosters/StudentResultsPage';
import { RosterReportCardPage } from './pages/rosters/RosterReportCardPage';
import { AcademicYearTransitionPage } from './pages/rosters/AcademicYearTransitionPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mfa" element={<MfaVerificationPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent']}><DashboardPage /></ProtectedRoute>} />
              <Route path="change-password" element={<ChangePasswordPage />} />
              <Route path="students" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor']}><StudentListPage /></ProtectedRoute>} />
              <Route path="students/new" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'registrar']}><StudentFormPage /></ProtectedRoute>} />
              <Route path="students/advanced-search" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor']}><AdvancedStudentSearchPage /></ProtectedRoute>} />
              <Route path="students/bulk-promote" element={<ProtectedRoute roles={['system_admin', 'academic_head']}><BulkPromotePage /></ProtectedRoute>} />
              <Route path="students/:id" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor']}><StudentProfilePage /></ProtectedRoute>} />
              <Route path="students/:id/edit" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'registrar']}><StudentFormPage /></ProtectedRoute>} />
              <Route path="teachers" element={<ProtectedRoute roles={['system_admin', 'school_director']}><TeacherListPage /></ProtectedRoute>} />
              <Route path="teachers/new" element={<ProtectedRoute roles={['system_admin']}><TeacherFormPage /></ProtectedRoute>} />
              <Route path="teachers/:id" element={<ProtectedRoute roles={['system_admin', 'school_director']}><TeacherProfilePage /></ProtectedRoute>} />
              <Route path="teachers/:id/edit" element={<ProtectedRoute roles={['system_admin']}><TeacherFormPage /></ProtectedRoute>} />
              <Route path="my-teacher/dashboard" element={<ProtectedRoute roles={['teacher']}><MyTeacherDashboard /></ProtectedRoute>} />
              <Route path="my-teacher/timetable" element={<ProtectedRoute roles={['teacher']}><MyTeacherTimetable /></ProtectedRoute>} />
              <Route path="my-teacher/sections" element={<ProtectedRoute roles={['teacher']}><MyTeacherSections /></ProtectedRoute>} />
              <Route path="my-teacher/sections/:sectionId/students" element={<ProtectedRoute roles={['teacher']}><MyTeacherSectionStudents /></ProtectedRoute>} />
              <Route path="my-teacher/sections/:sectionId/assessments" element={<ProtectedRoute roles={['teacher']}><MyTeacherSectionAssessments /></ProtectedRoute>} />
              <Route path="my-teacher/marks" element={<ProtectedRoute roles={['teacher']}><MyTeacherMarks /></ProtectedRoute>} />
              <Route path="my-teacher/reports" element={<ProtectedRoute roles={['teacher', 'academic_head', 'school_director']}><MyTeacherReports /></ProtectedRoute>} />
              <Route path="assessments" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent']}><MarksManagementPage /></ProtectedRoute>} />
              <Route path="assessments/new" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'teacher']}><AssessmentFormPage /></ProtectedRoute>} />
              <Route path="assessments/:id/edit" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'teacher']}><AssessmentFormPage /></ProtectedRoute>} />
              <Route path="assessments/:id/marks" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'teacher']}><MarksEntryPage /></ProtectedRoute>} />
              <Route path="assessments/report-card/:studentId" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent']}><AssessmentReportCardPage /></ProtectedRoute>} />
              <Route path="attendance" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent']}><AttendanceSheetPage /></ProtectedRoute>} />
              <Route path="attendance/dashboard" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><AttendanceDashboardPage /></ProtectedRoute>} />
              <Route path="attendance/reports" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><AttendanceReportsPage /></ProtectedRoute>} />
              <Route path="attendance/corrections" element={<ProtectedRoute roles={['system_admin', 'academic_head']}><AttendanceCorrectionPage /></ProtectedRoute>} />
              <Route path="finance" element={<ProtectedRoute roles={['system_admin', 'school_director', 'finance_officer', 'student', 'parent']}><FeeStructurePage /></ProtectedRoute>} />
              <Route path="finance/payments" element={<ProtectedRoute roles={['system_admin', 'finance_officer']}><PaymentPage /></ProtectedRoute>} />
              <Route path="finance/reports" element={<ProtectedRoute roles={['system_admin', 'school_director', 'finance_officer']}><FinanceReportsPage /></ProtectedRoute>} />
              <Route path="library" element={<ProtectedRoute roles={['system_admin', 'school_director', 'librarian', 'teacher', 'student']}><LibraryBooksPage /></ProtectedRoute>} />
              <Route path="library/borrowing" element={<ProtectedRoute roles={['system_admin', 'librarian']}><LibraryBorrowingPage /></ProtectedRoute>} />
              <Route path="announcements" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent']}><AnnouncementsPage /></ProtectedRoute>} />
              <Route path="communications" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent']}><AnnouncementsPage /></ProtectedRoute>} />
              <Route path="communications/notifications" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent']}><NotificationCenterPage /></ProtectedRoute>} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="sections/dashboard" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><SectionDashboardPage /></ProtectedRoute>} />
              <Route path="sections" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><SectionListPage /></ProtectedRoute>} />
              <Route path="sections/:id" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><SectionProfilePage /></ProtectedRoute>} />
              <Route path="sections/:id/reports" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><SectionReportsPage /></ProtectedRoute>} />
              <Route path="sections/:id/analytics" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><SectionAnalyticsPage /></ProtectedRoute>} />
              <Route path="rankings" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent']}><RankingPage /></ProtectedRoute>} />
              <Route path="rosters/dashboard" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><RosterDashboardPage /></ProtectedRoute>} />
              <Route path="rosters/semester" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher']}><SemesterRosterPage /></ProtectedRoute>} />
              <Route path="rosters/annual" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><AnnualRosterPage /></ProtectedRoute>} />
              <Route path="rosters/class-roster" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'homeroom_teacher']}><ClassRosterPage /></ProtectedRoute>} />
              <Route path="rosters/marks" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher']}><RosterMarkEntryPage /></ProtectedRoute>} />
              <Route path="rosters/promote" element={<ProtectedRoute roles={['system_admin', 'academic_head']}><PromotionPage /></ProtectedRoute>} />
              <Route path="rosters/my-results" element={<ProtectedRoute roles={['student', 'parent']}><StudentResultsPage /></ProtectedRoute>} />
              <Route path="rosters/report-card" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent']}><RosterReportCardPage /></ProtectedRoute>} />
              <Route path="rosters/transition" element={<ProtectedRoute roles={['system_admin', 'academic_head']}><AcademicYearTransitionPage /></ProtectedRoute>} />
              <Route path="reports/report-cards" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent']}><ReportCardPage /></ProtectedRoute>} />
              <Route path="calendar" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent']}><CalendarPage /></ProtectedRoute>} />
              <Route path="guardians" element={<ProtectedRoute roles={['parent']}><GuardianPortalPage /></ProtectedRoute>} />
              <Route path="my-dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboardPage /></ProtectedRoute>} />
              <Route path="my-profile" element={<ProtectedRoute roles={['student']}><StudentMyProfilePage /></ProtectedRoute>} />
              <Route path="my-attendance" element={<ProtectedRoute roles={['student']}><MyAttendancePage /></ProtectedRoute>} />
              <Route path="my-grades" element={<ProtectedRoute roles={['student']}><MyGradesPage /></ProtectedRoute>} />
              <Route path="my-timetable" element={<ProtectedRoute roles={['student', 'teacher']}><MyTimetablePage /></ProtectedRoute>} />
              <Route path="messages" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'teacher', 'counselor', 'student', 'parent']}><MessagesPage /></ProtectedRoute>} />
              <Route path="timetable" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor', 'student', 'parent']}><TimetablePage /></ProtectedRoute>} />
              <Route path="classrooms" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><ClassroomsPage /></ProtectedRoute>} />
              <Route path="counseling" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'counselor']}><CounselingPage /></ProtectedRoute>} />
              <Route path="discipline" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'counselor']}><DisciplinePage /></ProtectedRoute>} />
              <Route path="health" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'counselor']}><HealthPage /></ProtectedRoute>} />
              <Route path="transport" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><TransportPage /></ProtectedRoute>} />
              <Route path="inventory" element={<ProtectedRoute roles={['system_admin', 'school_director']}><InventoryPage /></ProtectedRoute>} />
              <Route path="academic-terms" element={<ProtectedRoute roles={['system_admin']}><AcademicTermsPage /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['system_admin']}><SettingsPage /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute roles={['system_admin']}><UsersPage /></ProtectedRoute>} />
              <Route path="users/new" element={<ProtectedRoute roles={['system_admin']}><UserFormPage /></ProtectedRoute>} />
              <Route path="users/:id" element={<ProtectedRoute roles={['system_admin']}><UserProfilePage /></ProtectedRoute>} />
              <Route path="users/:id/edit" element={<ProtectedRoute roles={['system_admin']}><UserFormPage /></ProtectedRoute>} />
              <Route path="users/passwords" element={<ProtectedRoute roles={['system_admin']}><PasswordManagerPage /></ProtectedRoute>} />
              <Route path="subjects" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent']}><SubjectListPage /></ProtectedRoute>} />
              <Route path="subjects/new" element={<ProtectedRoute roles={['system_admin', 'academic_head']}><SubjectFormPage /></ProtectedRoute>} />
              <Route path="subjects/:id" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent']}><SubjectDetailPage /></ProtectedRoute>} />
              <Route path="subjects/:id/edit" element={<ProtectedRoute roles={['system_admin', 'academic_head']}><SubjectFormPage /></ProtectedRoute>} />
              <Route path="alumni" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><AlumniPage /></ProtectedRoute>} />
              <Route path="audit-logs" element={<ProtectedRoute roles={['system_admin', 'school_director']}><AuditLogPage /></ProtectedRoute>} />
              <Route path="transfer-logs" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar']}><TransferLogListPage /></ProtectedRoute>} />
              <Route path="assignments/dashboard" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><AssignmentDashboardPage /></ProtectedRoute>} />
              <Route path="assignments/students/unassigned" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'registrar']}><UnassignedStudentsPage /></ProtectedRoute>} />
              <Route path="assignments/teachers/batch" element={<ProtectedRoute roles={['system_admin', 'academic_head']}><TeacherBatchAssignPage /></ProtectedRoute>} />
              <Route path="assignments/sections" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher']}><SectionOverviewPage /></ProtectedRoute>} />
              <Route path="assignments/reports" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><AssignmentReportsPage /></ProtectedRoute>} />
              <Route path="assignments/section-assign" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher']}><SectionAssignPage /></ProtectedRoute>} />
              <Route path="assignments/section-marks/:sectionId/subject/:subjectId" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'teacher']}><SectionMarksPage /></ProtectedRoute>} />
              <Route path="assignments/teacher-assignments" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><TeacherAssignmentsPage /></ProtectedRoute>} />
              <Route path="assignments/students/bulk-assign" element={<ProtectedRoute roles={['system_admin', 'academic_head', 'registrar']}><BulkStudentAssignPage /></ProtectedRoute>} />
              <Route path="assignments/history" element={<ProtectedRoute roles={['system_admin', 'school_director', 'academic_head']}><AssignmentHistoryPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
