import { Student, AssessmentMark, Assessment, Ranking } from '../models';
import { AssessmentStatus, MeritCategory, Stream } from '../types';
import { logger } from '../utils/logger';
import { getActiveGradeScale, calculateWeightedAverage, calculateGradeFromPercentage } from '../utils/gradeCalculation';

/**
 * Ranking Service
 * Implements Req 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

export interface StudentPerformance {
  studentId: string;
  student: any;
  overallAverage: number;
  totalSubjects: number;
  gpa: number;
}

export interface RankingResult {
  student: string;
  overallAverage: number;
  gpa: number;
  sectionRank: number;
  gradeRank: number;
  streamRank?: number;
  schoolRank: number;
  totalStudentsInSection: number;
  totalStudentsInGrade: number;
  totalStudentsInStream?: number;
  totalStudentsInSchool: number;
  meritCategory: MeritCategory;
}

/**
 * Calculate overall average for a student
 * Uses type weights from active GradeScale when available
 */
export const calculateStudentOverallAverage = async (
  studentId: string,
  academicYear: string,
  term?: string
): Promise<{ average: number; gpa: number; totalSubjects: number }> => {
  const match: any = { academicYear, status: AssessmentStatus.PUBLISHED };
  if (term) match.term = term;

  const marks = await AssessmentMark.find({ student: studentId })
    .populate({
      path: 'assessment',
      match,
      populate: { path: 'subject' },
    });

  const validMarks = marks.filter((m) => m.assessment);

  if (validMarks.length === 0) {
    return { average: 0, gpa: 0, totalSubjects: 0 };
  }

  // Fetch active grade scale for type weights and thresholds
  const gradeScale = await getActiveGradeScale(academicYear);

  // Group by subject to calculate subject averages
  const subjectMarks: { [key: string]: { percentage: number; type: string }[] } = {};

  validMarks.forEach((mark: any) => {
    const subjectId = mark.assessment.subject._id.toString();
    if (!subjectMarks[subjectId]) {
      subjectMarks[subjectId] = [];
    }
    subjectMarks[subjectId].push({
      percentage: mark.percentage,
      type: mark.assessment.type,
    });
  });

  // Calculate subject averages with type weights
  const subjectAverages: number[] = [];
  const subjectGPAs: number[] = [];

  Object.values(subjectMarks).forEach((marksData) => {
    let average: number;

    // Try to apply type weights
    const weighted = calculateWeightedAverage(marksData, gradeScale?.typeWeights);
    if (weighted !== null) {
      average = weighted;
    } else {
      // Fallback to simple average
      average = marksData.reduce((sum, m) => sum + m.percentage, 0) / marksData.length;
    }

    subjectAverages.push(average);
    
    // Convert to GPA using grade scale thresholds
    const { gradePoint } = calculateGradeFromPercentage(average, gradeScale?.gradeThresholds);
    subjectGPAs.push(gradePoint);
  });

  const overallAverage = subjectAverages.reduce((sum, avg) => sum + avg, 0) / subjectAverages.length;
  const gpa = subjectGPAs.reduce((sum, gpa) => sum + gpa, 0) / subjectGPAs.length;

  return {
    average: Math.round(overallAverage * 100) / 100,
    gpa: Math.round(gpa * 100) / 100,
    totalSubjects: subjectAverages.length,
  };
};

/**
 * Determine merit category
 * Implements Req 5.8
 */
export const getMeritCategory = (average: number, passThreshold?: number): MeritCategory => {
  const threshold = passThreshold ?? 50;
  if (average >= 90) return MeritCategory.ACADEMIC_EXCELLENCE;
  if (average >= 85) return MeritCategory.HONOR_STUDENT;
  return MeritCategory.REGULAR;
};

/**
 * Calculate rankings for all students
 * Implements Req 5.2, 5.3, 5.4, 5.5, 5.6
 */
export const calculateAllRankings = async (academicYear: string, term: '1' | '2' = '1'): Promise<void> => {
  try {
    logger.info('Starting ranking calculation', { academicYear });

    // Fetch active grade scale for merit category thresholds
    const gradeScale = await getActiveGradeScale(academicYear);

    // Get all active students
    const students = await Student.find({ status: 'Active' })
      .populate('section', 'name grade stream');

    const studentPerformances: StudentPerformance[] = [];

    // Calculate performance for each student
    for (const student of students) {
      const performance = await calculateStudentOverallAverage(student._id.toString(), academicYear, term);
      
      studentPerformances.push({
        studentId: student._id.toString(),
        student,
        overallAverage: performance.average,
        totalSubjects: performance.totalSubjects,
        gpa: performance.gpa,
      });
    }

    // Sort by overall average (descending), then by total marks for tie-breaking
    studentPerformances.sort((a, b) => {
      if (b.overallAverage !== a.overallAverage) return b.overallAverage - a.overallAverage;
      // Tie-breaker: use GPA as secondary sort
      return b.gpa - a.gpa;
    });

    // Function to assign ranks with tie handling
    const assignRanksWithTies = (performances: StudentPerformance[]): Map<string, number> => {
      const rankMap = new Map<string, number>();
      if (performances.length === 0) return rankMap;

      let currentRank = 1;
      for (let i = 0; i < performances.length; i++) {
        if (i > 0 && performances[i].overallAverage < performances[i - 1].overallAverage) {
          currentRank = i + 1;
        }
        // If same average, assign same rank (tie)
        rankMap.set(performances[i].studentId, currentRank);
      }
      return rankMap;
    };

    // Calculate rankings
    const rankings: RankingResult[] = [];

    studentPerformances.forEach((performance, index) => {
      const student = performance.student;
      
      // Section ranking (Req 5.3) with tie handling
      const sectionStudents = studentPerformances.filter(
        (p) => p.student.section?._id.toString() === student.section?._id.toString()
      );
      sectionStudents.sort((a, b) => {
        if (b.overallAverage !== a.overallAverage) return b.overallAverage - a.overallAverage;
        return b.gpa - a.gpa;
      });
      const sectionRanks = assignRanksWithTies(sectionStudents);
      const sectionRank = sectionRanks.get(performance.studentId) || sectionStudents.length;

      // Grade ranking (Req 5.4) with tie handling
      const gradeStudents = studentPerformances.filter(
        (p) => p.student.section?.grade === student.section?.grade
      );
      gradeStudents.sort((a, b) => {
        if (b.overallAverage !== a.overallAverage) return b.overallAverage - a.overallAverage;
        return b.gpa - a.gpa;
      });
      const gradeRanks = assignRanksWithTies(gradeStudents);
      const gradeRank = gradeRanks.get(performance.studentId) || gradeStudents.length;

      // Stream ranking for grades 11-12 (Req 5.5) with tie handling
      let streamRank: number | undefined;
      let totalStudentsInStream: number | undefined;
      
      if (student.section?.grade >= 11 && student.section?.stream) {
        const streamStudents = studentPerformances.filter(
          (p) => p.student.section?.grade >= 11 && 
                 p.student.section?.stream === student.section?.stream
        );
        streamStudents.sort((a, b) => {
          if (b.overallAverage !== a.overallAverage) return b.overallAverage - a.overallAverage;
          return b.gpa - a.gpa;
        });
        const streamRanks = assignRanksWithTies(streamStudents);
        streamRank = streamRanks.get(performance.studentId) || streamStudents.length;
        totalStudentsInStream = streamStudents.length;
      }

      // School ranking (Req 5.6) with tie handling
      const schoolRanks = assignRanksWithTies(studentPerformances);
      const schoolRank = schoolRanks.get(performance.studentId) || studentPerformances.length;

      const ranking: RankingResult = {
        student: performance.studentId,
        overallAverage: performance.overallAverage,
        gpa: performance.gpa,
        sectionRank,
        gradeRank,
        streamRank,
        schoolRank,
        totalStudentsInSection: sectionStudents.length,
        totalStudentsInGrade: gradeStudents.length,
        totalStudentsInStream,
        totalStudentsInSchool: studentPerformances.length,
        meritCategory: getMeritCategory(performance.overallAverage, gradeScale?.passThreshold),
      };

      rankings.push(ranking);
    });

    // Save rankings to database
    await Ranking.deleteMany({ academicYear, term });

    for (const ranking of rankings) {
      await Ranking.create({
        student: ranking.student,
        academicYear,
        term,
        overallAverage: ranking.overallAverage,
        gpa: ranking.gpa,
        subjectAverages: [],
        sectionRank: ranking.sectionRank,
        gradeRank: ranking.gradeRank,
        streamRank: ranking.streamRank,
        schoolRank: ranking.schoolRank,
        totalStudentsInSection: ranking.totalStudentsInSection,
        totalStudentsInGrade: ranking.totalStudentsInGrade,
        totalStudentsInStream: ranking.totalStudentsInStream,
        totalStudentsInSchool: ranking.totalStudentsInSchool,
        meritCategory: ranking.meritCategory,
        calculatedAt: new Date(),
      });
    }

    logger.info('Ranking calculation completed', {
      academicYear,
      totalStudents: rankings.length,
      excellenceCount: rankings.filter((r) => r.meritCategory === MeritCategory.ACADEMIC_EXCELLENCE).length,
      honorCount: rankings.filter((r) => r.meritCategory === MeritCategory.HONOR_STUDENT).length,
    });
  } catch (error) {
    logger.error('Error calculating rankings', { error, academicYear });
    throw error;
  }
};

/**
 * Recalculate rankings for affected students when marks change
 * Implements Req 5.7
 */
export const recalculateRankingsForStudent = async (
  studentId: string,
  academicYear: string,
  term?: '1' | '2'
): Promise<void> => {
  try {
    const student = await Student.findById(studentId).populate('section');
    if (!student) return;

    if (term) {
      await calculateAllRankings(academicYear, term);
    } else {
      await calculateAllRankings(academicYear, '1');
      await calculateAllRankings(academicYear, '2');
    }

    logger.info('Rankings recalculated for student', {
      studentId: student.studentId,
      academicYear,
    });
  } catch (error) {
    logger.error('Error recalculating rankings for student', { error, studentId, academicYear });
  }
};

/**
 * Get top performers
 * Implements Req 5.8, 5.10
 */
export const getTopPerformers = async (
  academicYear: string,
  limit: number = 10
): Promise<any[]> => {
  const topRankings = await Ranking.find({ academicYear })
    .populate('student', 'studentId firstName lastName section')
    .populate({
      path: 'student',
      populate: {
        path: 'section',
        select: 'name grade stream',
      },
    })
    .sort({ schoolRank: 1 })
    .limit(limit);

  return topRankings;
};

/**
 * Get subject top performers
 * Implements Req 5.10
 */
export const getSubjectTopPerformers = async (
  subjectId: string,
  academicYear: string,
  level: 'section' | 'grade' | 'stream' | 'school' = 'school'
): Promise<any[]> => {
  const pipeline: any[] = [
    {
      $lookup: {
        from: 'assessments',
        localField: 'assessment',
        foreignField: '_id',
        as: 'assessmentInfo',
      },
    },
    { $unwind: '$assessmentInfo' },
    {
      $match: {
        'assessmentInfo.subject': subjectId,
        'assessmentInfo.academicYear': academicYear,
        'assessmentInfo.status': AssessmentStatus.PUBLISHED,
      },
    },
    {
      $group: {
        _id: '$student',
        highestPercentage: { $max: '$percentage' },
        averagePercentage: { $avg: '$percentage' },
      },
    },
    { $sort: { highestPercentage: -1, averagePercentage: -1 } },
    { $limit: 10 },
  ];

  const results = await AssessmentMark.aggregate(pipeline);

  // Populate student details
  return await Student.populate(results, {
    path: '_id',
    select: 'studentId firstName lastName section',
    populate: {
      path: 'section',
      select: 'name grade stream',
    },
  });
};

/**
 * Trigger ranking recalculation after assessment approval
 */
export const triggerRankingUpdate = async (assessmentId: string): Promise<void> => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) return;
  await calculateAllRankings(assessment.academicYear, assessment.term as '1' | '2');
};
