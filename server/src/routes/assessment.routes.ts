import { Router } from 'express';
import {
  createAssessment,
  enterMarks,
  getAssessmentById,
  getAssessmentMarks,
  listAssessments,
  getMyGrades,
  updateAssessment,
  deleteAssessment,
  getStudentAssessments,
  calculateRankings,
  deleteAssessmentMark,
  deleteAllAssessmentMarks,
  getStudentMarksSummary,
  getChildrenMarks,
  submitMarks,
  rejectMarks,
  publishResults,
  lockAssessment,
  unlockAssessment,
  getReportCard,
  getAtRiskStudents,
  getAssessmentDashboard,
  getSubjectTeacherAssessments,
  getStudentTranscript,
  exportAssessmentMarks,
  verifyAssessment,
  approveAssessment,
  getHomeroomSectionMarks,
} from '../controllers/assessment.controller';
import {
  authenticate,
  requirePermission,
  PermissionCategory,
  authorize,
} from '../middleware/auth.middleware';
import { importMarksFromCSV, generateComprehensiveReportCard, generatePDFReportCard } from '../controllers/export.controller';
import { getGradeBook } from '../controllers/gradescale.controller';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

/*
 * ─── Student & Parent Self-Service ───────────────────────────────────────
 */
router.get('/my-grades',              authorize(UserRole.STUDENT), getMyGrades);
router.get('/my-children-marks',      authorize(UserRole.PARENT), getChildrenMarks);

/*
 * ─── Analytics & Overview ────────────────────────────────────────────────
 */
router.get('/dashboard',              requirePermission(PermissionCategory.ANALYTICS_VIEW), getAssessmentDashboard);
router.get('/analytics/at-risk',      authorize(UserRole.COUNSELOR, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN), getAtRiskStudents);
router.get('/my-teacher-assessments', authorize(UserRole.TEACHER), getSubjectTeacherAssessments);
router.get('/homeroom/:sectionId',    authorize(UserRole.TEACHER, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN), getHomeroomSectionMarks);

/*
 * ─── Rankings ────────────────────────────────────────────────────────────
 */
router.post('/calculate-rankings',    requirePermission(PermissionCategory.GRADE_CALCULATE), calculateRankings);

/*
 * ─── Per-Student Endpoints ───────────────────────────────────────────────
 */
router.get('/student/:studentId',            requirePermission(PermissionCategory.ASSESSMENT_READ), getStudentAssessments);
router.get('/student/:studentId/summary',    requirePermission(PermissionCategory.ASSESSMENT_READ), getStudentMarksSummary);
router.get('/student/:studentId/transcript', requirePermission(PermissionCategory.GRADE_READ_ALL), getStudentTranscript);

/*
 * ─── Grade Book ──────────────────────────────────────────────────────────
 */
router.get('/gradebook', requirePermission(PermissionCategory.GRADE_READ_SECTION), getGradeBook);

/*
 * ─── Reports ─────────────────────────────────────────────────────────────
 */
router.get('/report-card/:studentId', requirePermission(PermissionCategory.ASSESSMENT_READ), getReportCard);
router.get('/report-card/:studentId/comprehensive', requirePermission(PermissionCategory.DOCUMENT_REPORT_CARD), generateComprehensiveReportCard);
router.get('/report-card/:studentId/pdf', requirePermission(PermissionCategory.DOCUMENT_REPORT_CARD), generatePDFReportCard);

/*
 * ─── CRUD ────────────────────────────────────────────────────────────────
 */
router.post('/',                         requirePermission(PermissionCategory.ASSESSMENT_CREATE), createAssessment);
router.get('/',                          requirePermission(PermissionCategory.ASSESSMENT_READ), listAssessments);
router.get('/:id',                       requirePermission(PermissionCategory.ASSESSMENT_READ), getAssessmentById);
router.put('/:id',                       requirePermission(PermissionCategory.ASSESSMENT_UPDATE), updateAssessment);
router.delete('/:id',                    authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR), deleteAssessment);

/*
 * ─── Marks Entry & Management ────────────────────────────────────────────
 */
router.put('/:id/marks',                 requirePermission(PermissionCategory.ASSESSMENT_ENTER_MARKS), enterMarks);
router.get('/:id/marks',                 authenticate, getAssessmentMarks);
router.get('/:id/marks/export',          authorize(UserRole.TEACHER, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN), exportAssessmentMarks);
router.post('/:id/marks/import',         authorize(UserRole.TEACHER, UserRole.ACADEMIC_HEAD), importMarksFromCSV);
router.delete('/:id/marks',              authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR), deleteAllAssessmentMarks);
router.delete('/:id/marks/:studentId',   authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR), deleteAssessmentMark);

/*
 * ─── Workflow: Submit → Verify → Approve → Publish → Lock ───────────────
 */
router.post('/:id/submit',               requirePermission(PermissionCategory.ASSESSMENT_ENTER_MARKS), submitMarks);
router.post('/:id/verify',               requirePermission(PermissionCategory.ASSESSMENT_VERIFY), verifyAssessment);
router.post('/:id/approve',              requirePermission(PermissionCategory.ASSESSMENT_VERIFY), approveAssessment);
router.post('/:id/reject',               requirePermission(PermissionCategory.ASSESSMENT_VERIFY), rejectMarks);
router.post('/:id/publish',              authorize(UserRole.TEACHER, UserRole.ACADEMIC_HEAD, UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN), publishResults);
router.post('/:id/lock',                 authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR), lockAssessment);
router.post('/:id/unlock',               authorize(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR), unlockAssessment);

export default router;
