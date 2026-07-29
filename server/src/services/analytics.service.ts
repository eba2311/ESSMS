import { Student, AssessmentMark, Assessment, Ranking, Subject, Section } from '../models';
import { AssessmentStatus } from '../types';

export interface TopPerformer {
  student: any;
  overallAverage: number;
  gpa: number;
  sectionRank: number;
  schoolRank: number;
  meritCategory: string;
}

export interface WeakSubject {
  subject: any;
  sectionAverage: number;
  failingCount: number;
  totalStudents: number;
  passRate: number;
}

export interface ClassTrend {
  subject: string;
  assessmentTitle: string;
  type: string;
  classAverage: number;
  highest: number;
  lowest: number;
  median: number;
  stdDeviation: number;
}

/**
 * Get top N performers across the school
 */
export const getTopPerformersAnalytics = async (
  academicYear: string,
  limit: number = 10
): Promise<TopPerformer[]> => {
  const rankings = await Ranking.find({ academicYear })
    .populate({
      path: 'student',
      select: 'studentId firstName lastName section',
      populate: { path: 'section', select: 'name grade stream' },
    })
    .sort({ schoolRank: 1 })
    .limit(limit);

  return rankings.map((r: any) => ({
    student: r.student,
    overallAverage: r.overallAverage,
    gpa: r.gpa,
    sectionRank: r.sectionRank,
    schoolRank: r.schoolRank,
    meritCategory: r.meritCategory,
  }));
};

/**
 * Identify weak subjects (subjects with low pass rates)
 */
export const getWeakSubjects = async (
  academicYear: string,
  grade?: number
): Promise<WeakSubject[]> => {
  const subjectFilter: any = { status: 'Active' };
  if (grade) subjectFilter.grades = grade;

  const subjects = await Subject.find(subjectFilter);
  const results: WeakSubject[] = [];

  for (const subject of subjects) {
    const assessments = await Assessment.find({
      subject: subject._id,
      academicYear,
      status: AssessmentStatus.PUBLISHED,
    });

    if (assessments.length === 0) continue;

    const assessmentIds = assessments.map((a) => a._id);
    const marks = await AssessmentMark.find({
      assessment: { $in: assessmentIds },
    });

    if (marks.length === 0) continue;

    const totalStudents = marks.length;
    const failingCount = marks.filter((m) => m.percentage < 60).length;

    const totalPercentage = marks.reduce((sum, m) => sum + m.percentage, 0);
    const sectionAverage = Math.round((totalPercentage / totalStudents) * 100) / 100;
    const passRate = Math.round(((totalStudents - failingCount) / totalStudents) * 100);

    results.push({
      subject: { _id: subject._id, name: subject.name, code: subject.code },
      sectionAverage,
      failingCount,
      totalStudents,
      passRate,
    });
  }

  results.sort((a, b) => a.passRate - b.passRate);
  return results;
};

/**
 * Get class performance trend for a section
 */
export const getClassPerformanceTrend = async (
  sectionId: string,
  academicYear: string
): Promise<ClassTrend[]> => {
  const assessments = await Assessment.find({
    section: sectionId,
    academicYear,
    status: AssessmentStatus.PUBLISHED,
  }).populate('subject', 'name code');

  const results: ClassTrend[] = [];

  for (const assessment of assessments) {
    const marks = await AssessmentMark.find({ assessment: assessment._id });
    if (marks.length === 0) continue;

    const percentages = marks.map((m) => m.percentage).sort((a, b) => a - b);
    const total = percentages.reduce((s, p) => s + p, 0);
    const classAverage = Math.round((total / percentages.length) * 100) / 100;
    const highest = percentages[percentages.length - 1];
    const lowest = percentages[0];
    const median = percentages.length % 2 === 0
      ? (percentages[percentages.length / 2 - 1] + percentages[percentages.length / 2]) / 2
      : percentages[Math.floor(percentages.length / 2)];

    // Standard deviation
    const mean = total / percentages.length;
    const variance = percentages.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / percentages.length;
    const stdDeviation = Math.round(Math.sqrt(variance) * 100) / 100;

    results.push({
      subject: (assessment as any).subject?.name || 'Unknown',
      assessmentTitle: assessment.title,
      type: assessment.type,
      classAverage,
      highest,
      lowest,
      median,
      stdDeviation,
    });
  }

  return results;
};

/**
 * Get section performance summary
 */
export const getSectionPerformanceSummary = async (
  sectionId: string,
  academicYear: string
) => {
  const students = await Student.find({ section: sectionId, status: 'Active' });
  if (students.length === 0) return null;

  const studentIds = students.map((s) => s._id);
  const rankings = await Ranking.find({
    student: { $in: studentIds },
    academicYear,
  });

  const sectionAverages = rankings.map((r) => r.overallAverage);
  const total = sectionAverages.reduce((s, a) => s + a, 0);
  const sectionAverage = sectionAverages.length > 0
    ? Math.round((total / sectionAverages.length) * 100) / 100
    : 0;

  const topStudent = rankings.length > 0
    ? await Student.findById(rankings.reduce((best, r) => r.overallAverage > best.overallAverage ? r : best).student)
    : null;

  return {
    totalStudents: students.length,
    sectionAverage,
    highestAverage: sectionAverages.length > 0 ? Math.max(...sectionAverages) : 0,
    lowestAverage: sectionAverages.length > 0 ? Math.min(...sectionAverages) : 0,
    topStudent: topStudent ? { id: topStudent._id, name: `${topStudent.firstName} ${topStudent.lastName}` } : null,
  };
};
