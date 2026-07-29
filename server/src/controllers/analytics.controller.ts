import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from '../types';
import {
  getTopPerformersAnalytics,
  getWeakSubjects,
  getClassPerformanceTrend,
  getSectionPerformanceSummary,
} from '../services/analytics.service';
import { Student, Section, Subject, AssessmentMark, Assessment } from '../models';

/**
 * Get top performers across school
 */
export const getTopPerformers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, limit = 10 } = req.query;
    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const topPerformers = await getTopPerformersAnalytics(
      academicYear as string,
      Number(limit)
    );

    res.json({ success: true, data: topPerformers });
  } catch (error) {
    next(error);
  }
};

/**
 * Get weak subjects with low pass rates
 */
export const getWeakSubjectsAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, grade } = req.query;
    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const weakSubjects = await getWeakSubjects(
      academicYear as string,
      grade ? Number(grade) : undefined
    );

    res.json({ success: true, data: weakSubjects });
  } catch (error) {
    next(error);
  }
};

/**
 * Get class performance trend
 */
export const getClassTrend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) throw new ApiError(400, 'Academic year is required');
    if (!sectionId) throw new ApiError(400, 'Section ID is required');

    const trend = await getClassPerformanceTrend(sectionId, academicYear as string);

    res.json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section performance summary
 */
export const getSectionSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const summary = await getSectionPerformanceSummary(sectionId, academicYear as string);
    if (!summary) throw new ApiError(404, 'No data found for this section');

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student performance comparison
 * Shows student's marks vs class average per subject
 */
export const getStudentPerformanceComparison = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const student = await Student.findById(studentId).populate('section', 'name');
    if (!student) throw new ApiError(404, 'Student not found');

    const sectionId = student.section?._id;

    const marks = await AssessmentMark.find({ student: studentId })
      .populate({
        path: 'assessment',
        match: { academicYear, status: 'Published' },
        populate: { path: 'subject', select: 'name code' },
      });

    const validMarks = marks.filter((m: any) => m.assessment);
    const subjectAverages: Record<string, { studentTotal: number; count: number; subject: any }> = {};

    for (const mark of validMarks) {
      const ass: any = mark.assessment;
      const subId = ass.subject?._id?.toString() || 'unknown';
      if (!subjectAverages[subId]) {
        subjectAverages[subId] = { studentTotal: 0, count: 0, subject: ass.subject };
      }
      subjectAverages[subId].studentTotal += mark.percentage;
      subjectAverages[subId].count++;
    }

    const comparison = await Promise.all(
      Object.entries(subjectAverages).map(async ([subId, data]) => {
        const studentAvg = Math.round((data.studentTotal / data.count) * 100) / 100;

        // Get class average for this subject
        const subjectAssessments = await Assessment.find({
          subject: subId,
          section: sectionId,
          academicYear,
          status: 'Published',
        });
        const subjectAssessmentIds = subjectAssessments.map((a) => a._id);
        const classMarks = await AssessmentMark.find({
          assessment: { $in: subjectAssessmentIds },
        });
        const classAvg = classMarks.length > 0
          ? Math.round((classMarks.reduce((s, m) => s + m.percentage, 0) / classMarks.length) * 100) / 100
          : 0;

        return {
          subject: data.subject,
          studentAverage: studentAvg,
          classAverage: classAvg,
          difference: Math.round((studentAvg - classAvg) * 100) / 100,
          aboveAverage: studentAvg >= classAvg,
        };
      })
    );

    res.json({
      success: true,
      data: {
        student: { _id: student._id, studentId: student.studentId, firstName: student.firstName, lastName: student.lastName },
        comparison,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get marks dashboard stats
 */
export const getMarksDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear } = req.query;
    const filter: any = {};
    if (academicYear) filter.academicYear = academicYear;

    const totalPublishedAssessments = await Assessment.countDocuments({
      ...filter,
      status: 'Published',
    });

    const totalStudents = await Student.countDocuments({ status: 'Active' });
    const totalMarks = await AssessmentMark.countDocuments();

    // Top 10 performers
    let topPerformers: any[] = [];
    if (academicYear) {
      topPerformers = await getTopPerformersAnalytics(academicYear as string, 10);
    }

    // Weak subjects
    let weakSubjects: any[] = [];
    if (academicYear) {
      weakSubjects = await getWeakSubjects(academicYear as string);
      weakSubjects = weakSubjects.slice(0, 5);
    }

    res.json({
      success: true,
      data: {
        totalPublishedAssessments,
        totalStudents,
        totalMarks,
        topPerformers,
        weakSubjects,
      },
    });
  } catch (error) {
    next(error);
  }
};
