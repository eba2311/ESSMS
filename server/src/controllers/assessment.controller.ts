import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Assessment, AssessmentMark, Student, Teacher, TeacherAssignment, AuditLog, Subject, Guardian, Section, Ranking, Notification } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { AssessmentType, AssessmentStatus, UserRole, NotificationType, AttendanceStatus, LetterGrade } from '../types';
import { logger } from '../utils/logger';
import { triggerRankingUpdate, calculateAllRankings } from '../services/ranking.service';
import { generateSemesterRoster } from '../services/roster.service';

/**
 * Default max scores per assessment type (total = 100)
 */
const TYPE_MAX_SCORES: Record<string, number> = {
  [AssessmentType.ASSIGNMENT]: 10,
  [AssessmentType.QUIZ]: 10,
  [AssessmentType.CLASS_WORK]: 10,
  [AssessmentType.PROJECT]: 10,
  [AssessmentType.MID_EXAM]: 30,
  [AssessmentType.FINAL_EXAM]: 40,
};

/**
 * Create new assessment
 * Auto-sets totalMarks based on assessment type if not provided
 */
export const createAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const {
      subject,
      subjectId,
      sectionId,
      type,
      title,
      description,
      totalMarks,
      date,
      academicYear,
      term,
      teacherRemarks,
    } = req.body;

    // Validate required fields
    if ((!subjectId && !subject) || !sectionId || !type || !title || !date || !academicYear || !term) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Validate assessment type
    if (!Object.values(AssessmentType).includes(type)) {
      throw new ApiError(400, 'Invalid assessment type');
    }

    // Auto-set totalMarks based on type if not provided
    const finalTotalMarks = totalMarks || TYPE_MAX_SCORES[type] || 10;

    // Find teacher from user
    let teacher = await Teacher.findOne({ userId: req.user.id });

    if (!teacher && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ApiError(403, 'Only teachers can create assessments');
    }

    if (!teacher && req.user.role === UserRole.SYSTEM_ADMIN) {
       teacher = await Teacher.findOne({});
       if (!teacher) {
         throw new ApiError(400, 'Please create at least one Teacher before creating assessments.');
       }
    }

    let actualSubjectId = subjectId;

    if (!actualSubjectId && subject) {
      let subjectDoc = await Subject.findOne({ name: { $regex: new RegExp(`^${subject}$`, 'i') } });
      if (!subjectDoc) {
        subjectDoc = await Subject.create({
          name: subject,
          code: subject.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100),
          grades: [9, 10, 11, 12],
          creditHours: 3,
        });
      }
      actualSubjectId = subjectDoc._id;
    }

    if (teacher && req.user.role !== UserRole.SYSTEM_ADMIN) {
      const assignment = await TeacherAssignment.findOne({
        teacher: teacher._id,
        section: sectionId,
        subject: actualSubjectId,
        academicYear,
        isActive: true,
      });

      if (!assignment) {
        throw new ApiError(403, 'You are not assigned to teach this subject in this section');
      }
    }

    let formattedTerm = term;
    if (term === 'Term 1' || term === 'Semester 1') formattedTerm = '1';
    if (term === 'Term 2' || term === 'Semester 2') formattedTerm = '2';
    if (formattedTerm !== '1' && formattedTerm !== '2') formattedTerm = '1';

    const assessment = await Assessment.create({
      subject: actualSubjectId,
      section: sectionId,
      teacher: teacher._id,
      type,
      title,
      description,
      teacherRemarks,
      totalMarks: finalTotalMarks,
      date: new Date(date),
      academicYear,
      term: formattedTerm,
      status: AssessmentStatus.DRAFT,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_CREATE',
      description: `Assessment created: ${title}`,
      ipAddress: req.ip,
      metadata: {
        assessmentId: assessment.assessmentId,
        type: assessment.type,
        totalMarks: assessment.totalMarks,
        createdBy: req.user.userId,
      },
    });

    logger.info(`Assessment created`, {
      assessmentId: assessment.assessmentId,
      title: assessment.title,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enter marks for assessment
 * Workflow: Teacher enters marks while assessment is in Draft
 */
export const enterMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id: assessmentId } = req.params;
    const { marks } = req.body;

    if (!marks || !Array.isArray(marks)) {
      throw new ApiError(400, 'Marks array is required');
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    const teacher = await Teacher.findOne({ userId: req.user.id });

    if (teacher && assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, 'You can only enter marks for your own assessments');
    }

    // Prevent modification of locked or published assessments
    if (assessment.isLocked) {
      throw new ApiError(400, 'Cannot modify marks for a locked assessment');
    }
    if (assessment.status === AssessmentStatus.PUBLISHED) {
      throw new ApiError(400, 'Cannot modify marks after publishing. Contact admin to unlock if corrections are needed.');
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const mark of marks) {
      try {
        const { studentId, marksObtained, remarks } = mark;

        if (marksObtained === undefined || marksObtained === null || isNaN(Number(marksObtained))) {
          errors.push({ studentId: studentId || 'unknown', error: 'Invalid or missing marks value' });
          continue;
        }

        if (marksObtained > assessment.totalMarks) {
          errors.push({
            studentId,
            error: `Marks (${marksObtained}) exceed total marks (${assessment.totalMarks})`,
          });
          continue;
        }

        if (marksObtained < 0) {
          errors.push({
            studentId,
            error: 'Marks cannot be negative',
          });
          continue;
        }

        const student = await Student.findById(studentId);
        if (!student || student.section?.toString() !== assessment.section.toString()) {
          errors.push({
            studentId,
            error: 'Student not found in this section',
          });
          continue;
        }

        const existingMark = await AssessmentMark.findOne({
          assessment: assessmentId,
          student: studentId,
        });

        if (existingMark) {
          await AuditLog.create({
            userId: req.user.id,
            activityType: 'ASSESSMENT_MARK_MODIFY',
            description: `Mark modified for student ${student.studentId}`,
            ipAddress: req.ip,
            metadata: {
              assessmentId: assessment.assessmentId,
              studentId: student.studentId,
              oldValue: existingMark.marksObtained,
              newValue: marksObtained,
              timestamp: new Date(),
            },
          });

          // Calculate derived fields
          const pct = Math.round((marksObtained / assessment.totalMarks) * 100);
          let letterGrade: LetterGrade, gradePoint: number;
          if (pct >= 90) { letterGrade = LetterGrade.A; gradePoint = 4.0; }
          else if (pct >= 80) { letterGrade = LetterGrade.B; gradePoint = 3.0; }
          else if (pct >= 70) { letterGrade = LetterGrade.C; gradePoint = 2.0; }
          else if (pct >= 60) { letterGrade = LetterGrade.D; gradePoint = 1.0; }
          else { letterGrade = LetterGrade.F; gradePoint = 0.0; }

          existingMark.marksObtained = marksObtained;
          existingMark.percentage = pct;
          existingMark.letterGrade = letterGrade;
          existingMark.gradePoint = gradePoint;
          existingMark.remarks = remarks;
          existingMark.modifiedBy = new mongoose.Types.ObjectId(req.user.id);
          existingMark.modifiedAt = new Date();
          await existingMark.save();
          results.push(existingMark);
        } else {
          // Calculate derived fields
          const pct = Math.round((marksObtained / assessment.totalMarks) * 100);
          let letterGrade: LetterGrade, gradePoint: number;
          if (pct >= 90) { letterGrade = LetterGrade.A; gradePoint = 4.0; }
          else if (pct >= 80) { letterGrade = LetterGrade.B; gradePoint = 3.0; }
          else if (pct >= 70) { letterGrade = LetterGrade.C; gradePoint = 2.0; }
          else if (pct >= 60) { letterGrade = LetterGrade.D; gradePoint = 1.0; }
          else { letterGrade = LetterGrade.F; gradePoint = 0.0; }

          const newMark = await AssessmentMark.create({
            assessment: assessmentId,
            student: studentId,
            marksObtained,
            percentage: pct,
            letterGrade,
            gradePoint,
            remarks,
            enteredBy: req.user.id,
            enteredAt: new Date(),
          });
          results.push(newMark);
        }
      } catch (err: any) {
        errors.push({
          studentId: mark.studentId,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Marks entered: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify assessment marks (deprecated - kept for backward compatibility)
 */
export const verifyAssessment = (req: AuthRequest, res: Response, next: NextFunction) => publishResults(req, res, next);

/**
 * Approve assessment (deprecated - kept for backward compatibility)
 */
export const approveAssessment = (req: AuthRequest, res: Response, next: NextFunction) => publishResults(req, res, next);

/**
 * Get assessment by ID
 */
export const getAssessmentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const assessment = await Assessment.findById(id)
      .populate('subject', 'name code')
      .populate('section', 'name grade')
      .populate('teacher', 'teacherId firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    // Get marks count
    const marksCount = await AssessmentMark.countDocuments({ assessment: id });

    res.json({
      success: true,
      data: {
        ...assessment.toObject(),
        marksEntered: marksCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get marks for an assessment
 * Implements Req 8.6, 8.7 - Visibility based on status
 */
export const getAssessmentMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    // Students and parents can only see published marks
    if (req.user.role === UserRole.STUDENT || req.user.role === UserRole.PARENT) {
      if (assessment.status !== AssessmentStatus.PUBLISHED) {
        throw new ApiError(403, 'Marks are not yet published');
      }
    }

    const markFilter: any = { assessment: id };

    if (req.user.role === UserRole.STUDENT) {
      const student = await Student.findOne({ userId: req.user.id });
      if (student) markFilter.student = student._id;
    } else if (req.user.role === 'parent') {
      const guardian = await Guardian.findOne({ userId: req.user.id });
      if (guardian) {
        const children = await Student.find({ guardians: guardian._id });
        markFilter.student = { $in: children.map(c => c._id) };
      }
    }

    const marks = await AssessmentMark.find(markFilter)
      .populate('student', 'studentId firstName lastName')
      .sort({ 'student.lastName': 1 });

    res.json({
      success: true,
      data: {
        assessment: {
          id: assessment._id,
          title: assessment.title,
          type: assessment.type,
          totalMarks: assessment.totalMarks,
          status: assessment.status,
        },
        marks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List assessments with filtering
 */
export const listAssessments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const {
      sectionId,
      subjectId,
      type,
      status,
      academicYear,
      term,
      page = 1,
      limit = 50,
    } = req.query;

    const filter: any = {};

    if (sectionId) filter.section = sectionId;
    if (subjectId) filter.subject = subjectId;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;

    // Teachers see only assessments for their assigned sections
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await Teacher.findOne({ userId: req.user.id }).select('_id');
      if (teacher) {
        const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true }).select('section');
        const sectionIds = [...new Set(assignments.map((a) => a.section.toString()))];
        if (sectionIds.length) {
          filter.section = sectionId ? { $in: sectionIds } : { $in: sectionIds };
        } else {
          filter.section = null; // No assigned sections → no results
        }
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const assessments = await Assessment.find(filter)
      .populate('subject', 'name code')
      .populate('section', 'name grade')
      .populate('teacher', 'firstName lastName')
      .skip(skip)
      .limit(Number(limit))
      .sort({ date: -1 });

    const assessmentsWithMarks = await Promise.all(
      assessments.map(async (a) => {
        const markCount = await AssessmentMark.countDocuments({ assessment: a._id });
        return { ...a.toObject(), markCount };
      })
    );

    const total = await Assessment.countDocuments(filter);

    res.json({
      success: true,
      data: assessmentsWithMarks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit marks for publishing (Teacher marks as ready)
 * Transition: Draft → Draft (marks as ready flag, keeps editable)
 */
export const submitMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (teacher && assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, 'You can only submit your own assessments');
    }

    if (assessment.status !== AssessmentStatus.DRAFT) {
      throw new ApiError(400, 'Only draft assessments can be submitted');
    }

    const markCount = await AssessmentMark.countDocuments({ assessment: id });
    if (markCount === 0) {
      throw new ApiError(400, 'Please enter marks before submitting');
    }

    assessment.submittedAt = new Date();
    await assessment.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_SUBMIT',
      description: `Assessment submitted for review: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: {
        assessmentId: assessment.assessmentId,
        markCount,
        submittedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Assessment submitted for review successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject marks and send back to teacher for correction (kept for backward compat)
 */
export const rejectMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new ApiError(400, 'Rejection reason is required');
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    if (assessment.isLocked) {
      throw new ApiError(400, 'Cannot reject a locked assessment');
    }

    // Revert to Draft
    assessment.status = AssessmentStatus.DRAFT;
    assessment.rejectedBy = new mongoose.Types.ObjectId(req.user.id);
    assessment.rejectedAt = new Date();
    assessment.rejectionReason = reason;
    assessment.submittedAt = undefined;
    assessment.publishedBy = undefined;
    assessment.publishedAt = undefined;
    await assessment.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_REJECT',
      description: `Assessment rejected: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: {
        assessmentId: assessment.assessmentId,
        reason,
        rejectedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Assessment rejected and sent back for correction',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish results — Draft → Published
 * Teacher, Homeroom Teacher, Academic Head, School Director, System Admin can publish
 */
export const publishResults = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    if (assessment.isLocked) {
      throw new ApiError(400, 'Cannot publish a locked assessment');
    }

    if (assessment.status === AssessmentStatus.PUBLISHED) {
      throw new ApiError(400, 'Assessment is already published');
    }

    // Check teacher owns this assessment (for teacher/homeroom roles)
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || assessment.teacher.toString() !== teacher._id.toString()) {
        throw new ApiError(403, 'You can only publish your own assessments');
      }
    }

    assessment.status = AssessmentStatus.PUBLISHED;
    assessment.publishedBy = new mongoose.Types.ObjectId(req.user.id);
    assessment.publishedAt = new Date();
    await assessment.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_PUBLISH',
      description: `Results published: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: {
        assessmentId: assessment.assessmentId,
        publishedBy: req.user.userId,
      },
    });

    // Trigger ranking recalculation
    triggerRankingUpdate(assessment._id.toString()).catch((error: unknown) => {
      logger.error('Error triggering ranking update', { error, assessmentId: assessment.assessmentId });
    });

    // Auto-sync roster management
    generateSemesterRoster(assessment.academicYear, assessment.term as '1' | '2').catch((error: unknown) => {
      logger.error('Error triggering roster sync', { error, academicYear: assessment.academicYear });
    });

    // Notify students and guardians
    try {
      const studentsInSection = await Student.find({ section: assessment.section, status: 'Active' });
      for (const student of studentsInSection) {
        if (student.userId) {
          await Notification.create({
            recipient: student.userId,
            type: NotificationType.GRADE_PUBLISHED,
            title: 'New Grade Available',
            message: `Marks for ${assessment.title} have been published.`,
          });
        }
        if (student.guardians && student.guardians.length > 0) {
          for (const gId of student.guardians) {
            const guardian = await Guardian.findById(gId);
            if (guardian && guardian.userId) {
              await Notification.create({
                recipient: guardian.userId,
                type: NotificationType.GRADE_PUBLISHED,
                title: 'Student Grade Available',
                message: `Marks for ${assessment.title} for ${student.firstName} have been published.`,
              });
            }
          }
        }
      }
    } catch (notifErr) {
      logger.error('Error sending assessment notifications', { error: notifErr });
    }

    res.json({
      success: true,
      message: 'Results published successfully. Rankings will be updated.',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lock assessment results (System Admin only)
 */
export const lockAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    if (assessment.isLocked) {
      throw new ApiError(400, 'Assessment is already locked');
    }

    assessment.isLocked = true;
    assessment.lockedBy = new mongoose.Types.ObjectId(req.user.id);
    assessment.lockedAt = new Date();
    await assessment.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_LOCK',
      description: `Assessment locked: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: {
        assessmentId: assessment.assessmentId,
        lockedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Assessment locked successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlock assessment results (System Admin only)
 */
export const unlockAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    if (!assessment.isLocked) {
      throw new ApiError(400, 'Assessment is not locked');
    }

    assessment.isLocked = false;
    assessment.lockedBy = undefined;
    assessment.lockedAt = undefined;
    await assessment.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_UNLOCK',
      description: `Assessment unlocked: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: {
        assessmentId: assessment.assessmentId,
        unlockedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Assessment unlocked successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student report card
 * Role-based: Homeroom teachers can generate for their section,
 * Students/Parents can view only with published results
 */
export const getReportCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const student = await Student.findById(studentId)
      .populate('section', 'name grade stream');
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Role-based access
    if (req.user.role === UserRole.STUDENT) {
      const me = await Student.findOne({ userId: req.user.id }).select('_id');
      if (!me || me._id.toString() !== studentId) {
        throw new ApiError(403, 'You can only view your own report card');
      }
    }
    if (req.user.role === UserRole.PARENT) {
      const guardian = await Guardian.findOne({ userId: req.user.id }).select('students');
      if (!guardian || !guardian.students.some((s) => s.toString() === studentId)) {
        throw new ApiError(403, 'You can only view your children\'s report card');
      }
    }

    // Get all published marks for this student
    const marks = await AssessmentMark.find({ student: studentId })
      .populate({
        path: 'assessment',
        match: {
          academicYear,
          ...(term && { term }),
          status: AssessmentStatus.PUBLISHED,
        },
        populate: { path: 'subject', select: 'name code' },
      })
      .sort({ createdAt: -1 });

    const validMarks = marks.filter((m: any) => m.assessment);

    // Group by subject
    const subjectMap = new Map<string, {
      subject: any;
      assessments: any[];
      totalObtained: number;
      totalPossible: number;
      count: number;
    }>();

    for (const mark of validMarks) {
      const assessment: any = mark.assessment;
      const subjectId = assessment.subject?._id?.toString() || 'unknown';
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: assessment.subject,
          assessments: [],
          totalObtained: 0,
          totalPossible: 0,
          count: 0,
        });
      }
      const entry = subjectMap.get(subjectId)!;
      entry.assessments.push({
        title: assessment.title,
        type: assessment.type,
        totalMarks: assessment.totalMarks,
        marksObtained: mark.marksObtained,
        percentage: mark.percentage,
        remarks: mark.remarks,
      });
      entry.totalObtained += mark.marksObtained;
      entry.totalPossible += assessment.totalMarks;
      entry.count++;
    }

    const subjects = Array.from(subjectMap.values()).map((entry) => ({
      subject: entry.subject,
      assessments: entry.assessments,
      totalObtained: entry.totalObtained,
      totalPossible: entry.totalPossible,
      average: entry.totalPossible > 0
        ? Math.round((entry.totalObtained / entry.totalPossible) * 1000) / 10
        : 0,
    }));

    const totalObtained = subjects.reduce((s: number, x: any) => s + x.totalObtained, 0);
    const totalPossible = subjects.reduce((s: number, x: any) => s + x.totalPossible, 0);
    const overallAverage = totalPossible > 0
      ? Math.round((totalObtained / totalPossible) * 1000) / 10
      : 0;

    // Compute term-specific averages when no term filter (term = "All")
    let term1Data: any = null;
    let term2Data: any = null;
    let yearAverage: number | null = null;

    if (!term) {
      const getGradeInfo = (avg: number) => {
        if (avg >= 90) return { letterGrade: 'A', gpa: 4.0 };
        if (avg >= 80) return { letterGrade: 'B', gpa: 3.0 };
        if (avg >= 70) return { letterGrade: 'C', gpa: 2.0 };
        if (avg >= 60) return { letterGrade: 'D', gpa: 1.0 };
        return { letterGrade: 'F', gpa: 0.0 };
      };

      const computeTermData = (termMarks: any[]) => {
        const subjectMap: Record<string, { percentages: number[]; subject: any; totalObtained: number; totalPossible: number; assessments: any[] }> = {};

        for (const mark of termMarks) {
          const assessment: any = mark.assessment;
          const subjectId = assessment.subject?._id?.toString() || 'unknown';
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              percentages: [],
              subject: assessment.subject,
              totalObtained: 0,
              totalPossible: 0,
              assessments: [],
            };
          }
          subjectMap[subjectId].percentages.push(mark.percentage);
          subjectMap[subjectId].totalObtained += mark.marksObtained;
          subjectMap[subjectId].totalPossible += assessment.totalMarks;
          subjectMap[subjectId].assessments.push({
            title: assessment.title,
            type: assessment.type,
            totalMarks: assessment.totalMarks,
            marksObtained: mark.marksObtained,
            percentage: mark.percentage,
          });
        }

        const subjectAverages = Object.values(subjectMap).map((entry) => {
          const average = entry.percentages.length > 0
            ? Math.round((entry.percentages.reduce((s, p) => s + p, 0) / entry.percentages.length) * 100) / 10
            : 0;
          return {
            subject: entry.subject,
            average,
            totalObtained: entry.totalObtained,
            totalPossible: entry.totalPossible,
            assessmentCount: entry.assessments.length,
            ...getGradeInfo(average),
          };
        });

        const overallAvg = subjectAverages.length > 0
          ? Math.round((subjectAverages.reduce((s, sa) => s + sa.average, 0) / subjectAverages.length) * 100) / 10
          : 0;
        const gpa = subjectAverages.length > 0
          ? Math.round((subjectAverages.reduce((s, sa) => s + sa.gpa, 0) / subjectAverages.length) * 100) / 100
          : 0;

        const totalOb = subjectAverages.reduce((s, sa) => s + sa.totalObtained, 0);
        const totalPos = subjectAverages.reduce((s, sa) => s + sa.totalPossible, 0);

        return {
          overallAverage: overallAvg,
          gpa,
          totalObtained: totalOb,
          totalPossible: totalPos,
          subjectCount: subjectAverages.length,
          subjects: subjectAverages,
          ...getGradeInfo(overallAvg),
        };
      };

      const term1Marks = validMarks.filter((m: any) => m.assessment?.term === '1');
      const term2Marks = validMarks.filter((m: any) => m.assessment?.term === '2');

      term1Data = term1Marks.length > 0 ? computeTermData(term1Marks) : null;
      term2Data = term2Marks.length > 0 ? computeTermData(term2Marks) : null;

      // Year average = average of term1 and term2 averages
      if (term1Data && term2Data) {
        yearAverage = Math.round(((term1Data.overallAverage + term2Data.overallAverage) / 2) * 10) / 10;
      } else if (term1Data) {
        yearAverage = term1Data.overallAverage;
      } else if (term2Data) {
        yearAverage = term2Data.overallAverage;
      }
    }

    // Get ranking if available
    const ranking = await Ranking.findOne({
      student: studentId,
      academicYear,
      ...(term && { term }),
    }).select('sectionRank gradeRank schoolRank meritCategory');

    // Get attendance summary
    const Attendance = mongoose.model('Attendance');
    const attendanceRecords = await Attendance.find({
      student: studentId,
      ...(academicYear && { academicYear }),
    });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a: any) => a.status === AttendanceStatus.PRESENT).length;
    const absentDays = attendanceRecords.filter((a: any) => a.status === AttendanceStatus.ABSENT).length;
    const lateDays = attendanceRecords.filter((a: any) => a.status === AttendanceStatus.LATE).length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Get teacher comments from assessments
    const teacherComments = validMarks
      .filter((m: any) => m.assessment?.teacherRemarks || m.remarks)
      .map((m: any) => ({
        subject: m.assessment?.subject?.name || 'Unknown',
        assessmentTitle: m.assessment?.title || '',
        teacherRemarks: m.assessment?.teacherRemarks || null,
        markRemarks: m.remarks || null,
      }));

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          section: student.section,
        },
        academicYear,
        term: term || 'All',
        subjects,
        totalObtained,
        totalPossible,
        overallAverage,
        subjectCount: subjects.length,
        term1: term1Data,
        term2: term2Data,
        yearAverage,
        ranking: ranking || null,
        attendance: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate,
        },
        teacherComments,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get at-risk students for Counselor
 * Identifies students with low performance across subjects
 */
export const getAtRiskStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { academicYear, term, threshold = 50 } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const thresholdNum = Number(threshold);

    // Get all students with their published marks aggregated
    const students = await Student.find({ status: 'Active' })
      .populate('section', 'name grade stream');

    const atRisk: any[] = [];

    for (const student of students) {
      const marks = await AssessmentMark.find({ student: student._id })
        .populate({
          path: 'assessment',
          match: {
            academicYear,
            status: AssessmentStatus.PUBLISHED,
            ...(term && { term }),
          },
        });

      const validMarks = marks.filter((m: any) => m.assessment);
      if (validMarks.length === 0) continue;

      // Group by subject
      const subjectAverages: { name: string; average: number }[] = [];
      const subjectGroups = new Map<string, number[]>();

      for (const mark of validMarks) {
        const assessment: any = mark.assessment;
        const subId = assessment.subject?.toString() || 'unknown';
        if (!subjectGroups.has(subId)) subjectGroups.set(subId, []);
        subjectGroups.get(subId)!.push(mark.percentage);
      }

      let totalPercentage = 0;
      for (const [subId, percentages] of subjectGroups) {
        const avg = percentages.reduce((s, p) => s + p, 0) / percentages.length;
        totalPercentage += avg;
      }

      const overallAverage = subjectGroups.size > 0
        ? totalPercentage / subjectGroups.size
        : 0;

      if (overallAverage < thresholdNum) {
        atRisk.push({
          student: {
            _id: student._id,
            studentId: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            section: student.section,
          },
          overallAverage: Math.round(overallAverage * 100) / 100,
          totalSubjects: subjectGroups.size,
          flaggedLevel: overallAverage < 40 ? 'Critical' : 'At Risk',
        });
      }
    }

    // Sort by average ascending (worst first)
    atRisk.sort((a, b) => a.overallAverage - b.overallAverage);

    res.json({
      success: true,
      data: atRisk,
      total: atRisk.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate subject average for a student
 * Implements Req 5.1
 */
export const calculateStudentSubjectAverage = async (
  studentId: string,
  subjectId: string,
  academicYear: string
): Promise<number> => {
  const marks = await AssessmentMark.find({ student: studentId })
    .populate({
      path: 'assessment',
      match: { subject: subjectId, academicYear, status: AssessmentStatus.PUBLISHED },
    });

  const validMarks = marks.filter((m) => m.assessment);

  if (validMarks.length === 0) return 0;

  const totalPercentage = validMarks.reduce((sum, mark) => sum + mark.percentage, 0);
  return totalPercentage / validMarks.length;
};

/**
 * Get student grades (own data)
 */
export const getMyGrades = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { academicYear } = req.query;

    // Find student from user
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      throw new ApiError(404, 'Student record not found');
    }

    // Get all published assessments
    const marks = await AssessmentMark.find({ student: student._id })
      .populate({
        path: 'assessment',
        match: { 
          status: AssessmentStatus.PUBLISHED,
          ...(academicYear && { academicYear }),
        },
        populate: [
          { path: 'subject', select: 'name code' },
          { path: 'section', select: 'name' },
        ],
      });

    const validMarks = marks.filter((m) => m.assessment);

    res.json({
      success: true,
      data: validMarks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update assessment
 */
export const updateAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { title, description, type, totalMarks, date, term, subject, subjectId, sectionId, teacherRemarks } = req.body;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    // Can only edit draft assessments
    if (assessment.status !== AssessmentStatus.DRAFT) {
      throw new ApiError(400, 'Only draft assessments can be edited');
    }

    // Update fields
    if (title) assessment.title = title;
    if (description !== undefined) assessment.description = description;
    if (teacherRemarks !== undefined) assessment.teacherRemarks = teacherRemarks;
    if (type) {
      if (!Object.values(AssessmentType).includes(type)) {
        throw new ApiError(400, 'Invalid assessment type');
      }
      assessment.type = type;
    }
    if (totalMarks) assessment.totalMarks = totalMarks;
    if (date) assessment.date = new Date(date);
    if (term) {
      let formattedTerm = term;
      if (term === 'Term 1' || term === 'Semester 1') formattedTerm = '1';
      if (term === 'Term 2' || term === 'Semester 2') formattedTerm = '2';
      if (formattedTerm !== '1' && formattedTerm !== '2') formattedTerm = '1';
      assessment.term = formattedTerm;
    }
    if (subject || subjectId) {
      assessment.subject = subjectId || subject;
    }
    if (sectionId) assessment.section = sectionId;

    await assessment.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_UPDATE',
      description: `Assessment updated: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: { assessmentId: assessment.assessmentId, updatedBy: req.user.userId },
    });

    res.json({ success: true, data: assessment });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assessments for a specific student
 */
export const getStudentAssessments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    const filter: any = { section: student.section };
    if (student.stream) filter.stream = student.stream;
    if (student.grade) filter.grade = student.grade;

    const assessments = await Assessment.find(filter)
      .populate('subject', 'name code')
      .populate('section', 'name grade')
      .sort({ date: -1 });

    res.json({ success: true, data: assessments });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger ranking calculation for all approved assessments
 */
export const calculateRankings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, term } = req.query;
    const ay = academicYear as string || ((await Assessment.findOne({ status: AssessmentStatus.PUBLISHED }).select('academicYear'))?.academicYear);
    if (!ay) {
      res.json({ success: true, message: 'No published assessments found. Rankings not calculated.' });
      return;
    }
    await calculateAllRankings(ay, (term as '1' | '2') || '1');
    if (!term) await calculateAllRankings(ay, '2');

    res.json({
      success: true,
      message: `Rankings calculated for ${ay}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all marks for an assessment (Admin only)
 */
export const deleteAllAssessmentMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== UserRole.SYSTEM_ADMIN && req.user.role !== UserRole.SCHOOL_DIRECTOR)) {
      throw new ApiError(403, 'Only administrators can delete marks');
    }
    const { id } = req.params;
    const assessment = await Assessment.findById(id);
    if (!assessment) throw new ApiError(404, 'Assessment not found');
    await AssessmentMark.deleteMany({ assessment: id });
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_MARK_MODIFY',
      description: `All marks deleted for assessment: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: { assessmentId: id, deletedBy: req.user.userId },
    });
    res.json({ success: true, message: 'All marks deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a single student's mark from an assessment (Admin only)
 */
export const deleteAssessmentMark = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ApiError(403, 'Only administrators can delete marks');
    }
    const { id: assessmentId, studentId } = req.params;
    if (!studentId) throw new ApiError(400, 'Student ID is required');
    const mark = await AssessmentMark.findOneAndDelete({ assessment: assessmentId, student: studentId });
    if (!mark) throw new ApiError(404, 'Mark not found');
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_MARK_MODIFY',
      description: `Mark deleted for assessment ${assessmentId}, student ${studentId}`,
      ipAddress: req.ip,
      metadata: { assessmentId, studentId, deletedBy: req.user.userId },
    });
    res.json({ success: true, message: 'Mark deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full marks summary for a student
 * Role guard: students see own, parents see children's, staff see any
 */
export const getStudentMarksSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    // Role-based access control
    if (req.user.role === UserRole.STUDENT) {
      const me = await Student.findOne({ userId: req.user.id }).select('_id');
      if (!me || me._id.toString() !== studentId) {
        throw new ApiError(403, 'You can only view your own marks');
      }
    }
    if (req.user.role === UserRole.PARENT) {
      const guardian = await Guardian.findOne({ userId: req.user.id }).select('students');
      if (!guardian || !guardian.students.some((s) => s.toString() === studentId)) {
        throw new ApiError(403, 'You can only view your children\'s marks');
      }
    }

    const student = await Student.findById(studentId).populate('section', 'name grade');
    if (!student) throw new ApiError(404, 'Student not found');

    const marks = await AssessmentMark.find({ student: studentId })
      .populate({
        path: 'assessment',
        match: {
          status: AssessmentStatus.PUBLISHED,
          ...(academicYear && { academicYear }),
          ...(term && { term }),
        },
        populate: { path: 'subject', select: 'name code' },
      })
      .sort({ createdAt: -1 });

    const validMarks = marks.filter((m: any) => m.assessment);
    if (!validMarks.length) {
      res.json({
        success: true,
        data: { student, subjects: [], totalMarks: 0, average: 0, subjectCount: 0 },
      });
      return;
    }

    const subjectMap = new Map<string, { subject: any; marks: any[]; total: number; count: number }>();
    for (const mark of validMarks) {
      const assessment: any = mark.assessment;
      const subjectId = assessment.subject?._id?.toString() || 'unknown';
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, { subject: assessment.subject, marks: [], total: 0, count: 0 });
      }
      const entry = subjectMap.get(subjectId)!;
      entry.marks.push({
        assessmentId: assessment._id,
        assessmentTitle: assessment.title,
        assessmentType: assessment.type,
        totalMarks: assessment.totalMarks,
        marksObtained: mark.marksObtained,
        percentage: mark.percentage,
      });
      entry.total += mark.marksObtained;
      entry.count++;
    }

    const subjects = Array.from(subjectMap.values()).map((entry) => ({
      subject: entry.subject,
      assessments: entry.marks,
      subjectTotal: entry.total,
      assessmentCount: entry.count,
    }));

    // Average of subject-average percentages (consistent with ranking service)
    const subjectAverages: number[] = subjects.map((s: any) => {
      const pcts = s.assessments.map((a: any) => a.percentage);
      return pcts.reduce((sum: number, p: number) => sum + p, 0) / pcts.length;
    });
    const average = subjectAverages.length > 0
      ? subjectAverages.reduce((sum: number, a: number) => sum + a, 0) / subjectAverages.length
      : 0;

    res.json({
      success: true,
      data: {
        student,
        subjects,
        subjectCount: subjects.length,
        average: Math.round(average * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get marks for all children linked to the current parent user
 */
export const getChildrenMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.PARENT) {
      throw new ApiError(403, 'Only parents can access this endpoint');
    }

    const guardian = await Guardian.findOne({ userId: req.user.id }).select('students firstName lastName');
    if (!guardian || !guardian.students.length) {
      res.json({ success: true, data: [] });
      return;
    }

    const results = [];
    for (const studentId of guardian.students) {
      const student = await Student.findById(studentId).populate('section', 'name grade');
      if (!student) continue;

      const marks = await AssessmentMark.find({ student: studentId })
        .populate({
          path: 'assessment',
          match: { status: AssessmentStatus.PUBLISHED },
          populate: { path: 'subject', select: 'name code' },
        });

      const validMarks = marks.filter((m: any) => m.assessment);
      const subjectMap = new Map<string, any>();
      for (const mark of validMarks) {
        const ass: any = mark.assessment;
        const sid = ass.subject?._id?.toString() || 'unknown';
        if (!subjectMap.has(sid)) {
          subjectMap.set(sid, { subject: ass.subject, marks: [], total: 0 });
        }
        const e = subjectMap.get(sid)!;
        e.marks.push({
          assessmentTitle: ass.title,
          assessmentType: ass.type,
          totalMarks: ass.totalMarks,
          marksObtained: mark.marksObtained,
          percentage: mark.percentage,
        });
        e.total += mark.marksObtained;
      }

      const subjects = Array.from(subjectMap.values()).map((e) => ({
        subject: e.subject,
        assessments: e.marks,
        subjectTotal: e.total,
        subjectPct: e.marks.reduce((s: number, a: any) => s + a.percentage, 0) / e.marks.length,
      }));

      const totalMarks = subjects.reduce((s: number, x: any) => s + x.subjectTotal, 0);
      const pcts = subjects.map((s: any) => s.subjectPct);
      const average = pcts.length ? pcts.reduce((s: number, p: number) => s + p, 0) / pcts.length : 0;

      results.push({
        student,
        subjects,
        totalMarks,
        average: Math.round(average * 100) / 100,
        subjectCount: subjects.length,
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assessment dashboard stats
 * Overview counts and summaries for the management page
 */
export const getAssessmentDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { academicYear, sectionId } = req.query;
    const filter: any = {};
    if (academicYear) filter.academicYear = academicYear;
    if (sectionId) filter.section = sectionId;

    // Scope by role
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await Teacher.findOne({ userId: req.user.id }).select('_id');
      if (teacher) filter.teacher = teacher._id;
    }

    const totalAssessments = await Assessment.countDocuments(filter);
    const draftCount = await Assessment.countDocuments({ ...filter, status: AssessmentStatus.DRAFT });
    const publishedCount = await Assessment.countDocuments({ ...filter, status: AssessmentStatus.PUBLISHED });
    const lockedCount = await Assessment.countDocuments({ ...filter, isLocked: true });

    // Get assessments with marks count
    const assessments = await Assessment.find(filter)
      .select('_id title type status totalMarks date')
      .sort({ date: -1 })
      .limit(5);

    const assessmentStats = await Promise.all(
      assessments.map(async (a) => {
        const marksCount = await AssessmentMark.countDocuments({ assessment: a._id });
        return {
          _id: a._id,
          title: a.title,
          type: a.type,
          status: a.status,
          totalMarks: a.totalMarks,
          date: a.date,
          marksEntered: marksCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalAssessments,
        draftCount,
        publishedCount,
        lockedCount,
        recentAssessments: assessmentStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get teacher's own assessments with marks summary
 * Subject Teacher view — shows only their assigned subject assessments
 */
export const getSubjectTeacherAssessments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) throw new ApiError(403, 'Teacher profile not found');

    const { academicYear, term, status } = req.query;
    const filter: any = { teacher: teacher._id };
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (status) filter.status = status;

    const assessments = await Assessment.find(filter)
      .populate('subject', 'name code')
      .populate('section', 'name grade')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      assessments.map(async (a) => {
        const totalStudents = await Student.countDocuments({ section: a.section, status: 'Active' });
        const marksEntered = await AssessmentMark.countDocuments({ assessment: a._id });
        return {
          ...a.toObject(),
          totalStudents,
          marksEntered,
          completionRate: totalStudents > 0 ? Math.round((marksEntered / totalStudents) * 100) : 0,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an assessment and all its associated marks
 */
export const deleteAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const assessment = await Assessment.findById(id);
    if (!assessment) throw new ApiError(404, 'Assessment not found');

    await AssessmentMark.deleteMany({ assessment: id });
    await Assessment.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'ASSESSMENT_DELETE',
      description: `Assessment deleted: ${assessment.title}`,
      ipAddress: req.ip,
      metadata: { assessmentId: assessment.assessmentId, deletedBy: req.user.userId },
    });

    logger.info('Assessment deleted', { assessmentId: assessment.assessmentId, deletedBy: req.user.userId });

    res.json({ success: true, message: 'Assessment and all marks deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Export marks for an assessment as CSV
 */
export const exportAssessmentMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const assessment = await Assessment.findById(id).populate('subject', 'name code').populate('section', 'name grade');
    if (!assessment) throw new ApiError(404, 'Assessment not found');

    const marks = await AssessmentMark.find({ assessment: id })
      .populate('student', 'studentId firstName lastName')
      .sort({ 'student.lastName': 1 });

    const rows = [
      ['Student ID', 'First Name', 'Last Name', 'Marks Obtained', 'Total Marks', 'Percentage', 'Grade', 'Remarks'].join(','),
    ];

    for (const mark of marks) {
      const s = mark.student as any;
      rows.push([
        s?.studentId || '',
        s?.firstName || '',
        s?.lastName || '',
        mark.marksObtained,
        assessment.totalMarks,
        mark.percentage.toFixed(1),
        mark.letterGrade,
        (mark.remarks || '').replace(/,/g, ';'),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${assessment.title.replace(/\s+/g, '_')}_marks.csv"`);
    res.send(rows.join('\n'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive student transcript across all terms and academic years
 */
export const getStudentTranscript = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate('section', 'name grade stream');
    if (!student) throw new ApiError(404, 'Student not found');

    // Role-based access
    if (req.user.role === UserRole.STUDENT) {
      const me = await Student.findOne({ userId: req.user.id }).select('_id');
      if (!me || me._id.toString() !== studentId) {
        throw new ApiError(403, 'You can only view your own transcript');
      }
    }
    if (req.user.role === UserRole.PARENT) {
      const guardian = await Guardian.findOne({ userId: req.user.id }).select('students');
      if (!guardian || !guardian.students.some((s) => s.toString() === studentId)) {
        throw new ApiError(403, 'You can only view your children\'s transcript');
      }
    }

    const marks = await AssessmentMark.find({ student: studentId })
      .populate({
        path: 'assessment',
        match: { status: AssessmentStatus.PUBLISHED },
        populate: { path: 'subject', select: 'name code' },
      })
      .sort({ createdAt: 1 });

    const validMarks = marks.filter((m: any) => m.assessment) as any[];
    if (!validMarks.length) {
      res.json({ success: true, data: { student, academicYears: [] } });
      return;
    }

    // Group by academicYear → term → subject
    const byYear: Record<string, Record<string, Record<string, { marks: any[]; total: number; count: number }>>> = {};

    for (const mark of validMarks) {
      const ass = mark.assessment;
      const year = ass.academicYear || 'Unknown';
      const term = ass.term || '1';
      const subId = ass.subject?._id?.toString() || 'unknown';

      if (!byYear[year]) byYear[year] = {};
      if (!byYear[year][term]) byYear[year][term] = {};
      if (!byYear[year][term][subId]) {
        byYear[year][term][subId] = { marks: [], total: 0, count: 0 };
      }

      byYear[year][term][subId].marks.push(mark);
      byYear[year][term][subId].total += mark.marksObtained;
      byYear[year][term][subId].count++;
    }

    const academicYears = Object.entries(byYear).map(([year, terms]) => ({
      academicYear: year,
      terms: Object.entries(terms).map(([term, subjects]) => ({
        term,
        subjects: Object.entries(subjects).map(([subId, data]) => {
          const first = data.marks[0];
          const subjectName = first.assessment.subject?.name || 'Unknown';
          return {
            subject: { name: subjectName, code: first.assessment.subject?.code },
            totalObtained: data.total,
            assessmentCount: data.count,
          };
        }),
      })),
    }));

    // Get rankings history
    const rankings = await Ranking.find({ student: studentId })
      .select('academicYear term overallAverage gpa sectionRank meritCategory')
      .sort({ academicYear: 1, term: 1 });

    // Compute term averages per academic year
    for (const yearEntry of academicYears) {
      const termAverages: Record<string, number> = {};
      for (const termEntry of yearEntry.terms) {
        const subjectAvgs = termEntry.subjects.map((s: any) => {
          const subData = validMarks.filter(
            (m: any) => m.assessment?.academicYear === yearEntry.academicYear
              && m.assessment?.term === termEntry.term
              && m.assessment?.subject?._id?.toString() === (s.subject?._id?.toString() || s.subject?.name)
          );
          const totalOb = subData.reduce((sum: number, m: any) => sum + m.marksObtained, 0);
          const totalPos = subData.reduce((sum: number, m: any) => sum + (m.assessment?.totalMarks || 0), 0);
          return totalPos > 0 ? (totalOb / totalPos) * 100 : 0;
        });
        const tAvg = subjectAvgs.length > 0
          ? Math.round((subjectAvgs.reduce((s, a) => s + a, 0) / subjectAvgs.length) * 10) / 10
          : 0;
        termAverages[termEntry.term] = tAvg;
      }
      (yearEntry as any).termAverages = termAverages;
      if (termAverages['1'] !== undefined && termAverages['2'] !== undefined) {
        (yearEntry as any).yearAverage = Math.round(((termAverages['1'] + termAverages['2']) / 2) * 10) / 10;
      } else {
        (yearEntry as any).yearAverage = termAverages['1'] ?? termAverages['2'] ?? 0;
      }
    }

    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          section: student.section,
        },
        academicYears,
        rankings,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHomeroomSectionMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const { academicYear } = req.query;

    const section = await Section.findById(sectionId).lean();
    if (!section) throw new ApiError(404, 'Section not found');

    const students = await Student.find({ section: sectionId, status: 'Active' })
      .select('firstName lastName studentId _id')
      .lean();

    if (students.length === 0) {
      res.json({ success: true, data: { section: { name: section.name, grade: section.grade }, students: [] } });
      return;
    }

    const studentIds = students.map((s) => s._id);

    const match: any = { section: new mongoose.Types.ObjectId(sectionId) };
    if (academicYear) match.academicYear = academicYear;

    const assessments = await Assessment.find(match)
      .select('subject title totalMarks type date')
      .populate('subject', 'name')
      .lean();

    const assessmentIds = assessments.map((a) => a._id);

    const marks = await AssessmentMark.find({ assessment: { $in: assessmentIds }, student: { $in: studentIds } })
      .select('assessment student marksObtained percentage')
      .lean();

    const marksByStudent: Record<string, any[]> = {};
    for (const m of marks) {
      const sid = m.student.toString();
      if (!marksByStudent[sid]) marksByStudent[sid] = [];
      marksByStudent[sid].push(m);
    }

    const assessmentsBySubject: Record<string, any[]> = {};
    for (const a of assessments) {
      const subId = (a.subject as any)?._id?.toString() || a.subject.toString();
      if (!assessmentsBySubject[subId]) assessmentsBySubject[subId] = [];
      assessmentsBySubject[subId].push(a);
    }

    const subjectMap: Record<string, string> = {};
    for (const a of assessments) {
      const sub = a.subject as any;
      const subId = sub._id?.toString() || a.subject.toString();
      subjectMap[subId] = sub.name || 'Unknown';
    }

    const studentEntries = students.map((student) => {
      const sid = student._id.toString();
      const studentMarks = marksByStudent[sid] || [];
      const subjects = Object.entries(assessmentsBySubject).map(([subId, subAssessments]) => {
        let totalObtained = 0;
        let totalPossible = 0;
        const assessmentEntries = subAssessments.map((a) => {
          const mark = studentMarks.find((m) => m.assessment.toString() === a._id.toString());
          const marksObtained = mark?.marksObtained ?? 0;
          totalObtained += marksObtained;
          totalPossible += a.totalMarks;
          return { marksObtained, totalMarks: a.totalMarks };
        });
        const average = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;
        return { subjectName: subjectMap[subId] || 'Unknown', assessments: assessmentEntries, totalObtained, totalPossible, average };
      });
      const overallTotal = subjects.reduce((s, sub) => s + sub.totalObtained, 0);
      const overallPossible = subjects.reduce((s, sub) => s + sub.totalPossible, 0);
      const overallAverage = overallPossible > 0 ? Math.round((overallTotal / overallPossible) * 100) : 0;
      return { student, subjects, overallAverage };
    });

    res.json({
      success: true,
      data: {
        section: { name: section.name, grade: section.grade },
        students: studentEntries,
      },
    });
  } catch (error) {
    next(error);
  }
};
