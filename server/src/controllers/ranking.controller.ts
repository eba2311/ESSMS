import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Ranking, Student, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getCurrentAcademicYear } from '../utils/academicYear.util';
import { 
  calculateAllRankings, 
  getTopPerformers, 
  getSubjectTopPerformers,
  recalculateRankingsForStudent 
} from '../services/ranking.service';

/**
 * Calculate rankings for all students
 * Implements Req 5.7
 */
export const calculateRankings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { academicYear, term } = req.body;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const rankingTerm: '1' | '2' = term === '2' ? '2' : '1';

    // Start ranking calculation (this might take a while)
    await calculateAllRankings(academicYear, rankingTerm);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'RANKING_CALCULATION',
      description: `Rankings calculated for academic year ${academicYear}`,
      ipAddress: req.ip,
      metadata: {
        academicYear,
        calculatedBy: req.user.userId,
      },
    });

    logger.info('Rankings calculated via API', {
      academicYear,
      calculatedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Rankings calculated successfully',
      data: {
        academicYear,
        calculatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student ranking
 */
export const getStudentRanking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: studentId } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const ranking = await Ranking.findOne({
      student: studentId,
      academicYear,
    }).populate('student', 'studentId firstName lastName section');

    if (!ranking) {
      throw new ApiError(404, 'Ranking not found for this student');
    }

    const rankingObj = ranking.toObject ? ranking.toObject() : ranking;
    (rankingObj as any).rank = (rankingObj as any).schoolRank;
    (rankingObj as any).totalStudents = (rankingObj as any).totalStudentsInSchool;

    res.json({
      success: true,
      data: rankingObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section rankings
 */
export const getSectionRankings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: sectionId } = req.params;
    const { academicYear, limit = 50 } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const rankings = await Ranking.find({ academicYear })
      .populate({
        path: 'student',
        match: { section: sectionId },
        select: 'studentId firstName lastName',
      })
      .sort({ sectionRank: 1 })
      .limit(Number(limit));

    // Filter out null students (not in the section)
    const sectionRankings = rankings.filter((ranking) => ranking.student);

    res.json({
      success: true,
      data: sectionRankings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get grade rankings
 */
export const getGradeRankings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grade } = req.params;
    const { academicYear, limit = 100 } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const rankings = await Ranking.find({ academicYear })
      .populate({
        path: 'student',
        populate: {
          path: 'section',
          match: { grade: Number(grade) },
          select: 'name grade stream',
        },
        select: 'studentId firstName lastName section',
      })
      .sort({ gradeRank: 1 })
      .limit(Number(limit));

    // Filter students in the specified grade
    const gradeRankings = rankings.filter((ranking) => {
      const student = ranking.student as { section?: unknown } | null;
      return student && student.section;
    });

    res.json({
      success: true,
      data: gradeRankings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stream rankings (for grades 11-12)
 */
export const getStreamRankings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grade, stream } = req.params;
    const { academicYear, limit = 100 } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const gradeNum = Number(grade);
    if (gradeNum < 11) {
      throw new ApiError(400, 'Stream rankings are only available for grades 11 and 12');
    }

    const rankings = await Ranking.find({ 
      academicYear,
      streamRank: { $exists: true },
    })
      .populate({
        path: 'student',
        populate: {
          path: 'section',
          match: { grade: gradeNum, stream },
          select: 'name grade stream',
        },
        select: 'studentId firstName lastName section',
      })
      .sort({ streamRank: 1 })
      .limit(Number(limit));

    const streamRankings = rankings.filter((ranking) => {
      const student = ranking.student as { section?: unknown } | null;
      return student && student.section;
    });

    res.json({
      success: true,
      data: streamRankings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get school-wide rankings
 */
export const getSchoolRankings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear: academicYearParam, term, limit = 100, meritCategory } = req.query;
    const academicYear = (academicYearParam as string) || await getCurrentAcademicYear();

    const filter: any = { academicYear };
    if (term) filter.term = term;
    if (meritCategory) {
      filter.meritCategory = meritCategory;
    }

    const rankings = await Ranking.find(filter)
      .populate({
        path: 'student',
        select: 'studentId firstName lastName section',
        populate: {
          path: 'section',
          select: 'name grade stream',
        },
      })
      .sort({ schoolRank: 1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: rankings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top performers
 */
export const getTopPerformersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, limit = 10 } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const topPerformers = await getTopPerformers(academicYear as string, Number(limit));

    res.json({
      success: true,
      data: topPerformers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subject top performers
 */
export const getSubjectTopPerformersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { academicYear, level = 'school', limit = 10 } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    const validLevels = ['section', 'grade', 'stream', 'school'] as const;
    type Level = typeof validLevels[number];
    const rankingLevel: Level = validLevels.includes((level as string) as Level) ? (level as Level) : 'school';

    const topPerformers = await getSubjectTopPerformers(
      subjectId,
      academicYear as string,
      rankingLevel
    );

    res.json({
      success: true,
      data: topPerformers.slice(0, Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my ranking (for students)
 */
export const getMyRanking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { academicYear } = req.query;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    // Find student from user
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      throw new ApiError(404, 'Student record not found');
    }

    const ranking = await Ranking.findOne({
      student: student._id,
      academicYear,
    }).populate({
      path: 'student',
      select: 'studentId firstName lastName section',
      populate: {
        path: 'section',
        select: 'name grade stream',
      },
    });

    if (!ranking) {
      res.json({
        success: true,
        message: 'Rankings have not been calculated yet',
        data: null,
      });
      return;
    }

    const rankingObj = ranking.toObject ? ranking.toObject() : ranking;
    (rankingObj as any).rank = (rankingObj as any).schoolRank;
    (rankingObj as any).totalStudents = (rankingObj as any).totalStudentsInSchool;

    res.json({
      success: true,
      data: rankingObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recalculate rankings for a specific student
 */
export const recalculateStudentRanking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { studentId } = req.params;
    const { academicYear } = req.body;

    if (!academicYear) {
      throw new ApiError(400, 'Academic year is required');
    }

    await recalculateRankingsForStudent(studentId, academicYear);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'RANKING_RECALCULATION',
      description: `Rankings recalculated for student`,
      ipAddress: req.ip,
      metadata: {
        studentId,
        academicYear,
        triggeredBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Student ranking recalculated successfully',
    });
  } catch (error) {
    next(error);
  }
};