import { Student, SemesterResult, AnnualResult, Section, Assessment, AssessmentMark, Attendance } from '../models';
import { logger } from '../utils/logger';
import { AttendanceStatus } from '../types';

export const getResultStatus = (average: number): string => {
  if (average >= 90) return 'Excellent';
  if (average >= 80) return 'Very Good';
  if (average >= 70) return 'Good';
  if (average >= 50) return 'Pass';
  return 'Fail';
};

export const getPromotionStatus = (annualAverage: number, hasMissingMarks: boolean = false): string => {
  if (hasMissingMarks) return 'Incomplete';
  if (annualAverage >= 50) return 'Promoted';
  return 'Repeat';
};

/**
 * Calculate attendance percentage for a student within a given academic year/semester date range.
 */
export const calculateAttendancePercentage = async (
  studentId: string,
  sectionId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const totalDays = await Attendance.countDocuments({
    student: studentId,
    section: sectionId,
    date: { $gte: startDate, $lte: endDate },
  });

  if (totalDays === 0) return 100;

  const presentDays = await Attendance.countDocuments({
    student: studentId,
    section: sectionId,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] },
  });

  return Math.round((presentDays / totalDays) * 100);
};

/**
 * Get semester date range based on academic year and semester number.
 */
const getSemesterDateRange = (academicYear: string, semester: '1' | '2'): { start: Date; end: Date } => {
  const [startYear] = academicYear.split('/').map(Number);
  if (semester === '1') {
    return { start: new Date(startYear, 8, 1), end: new Date(startYear, 11, 31) };
  }
  return { start: new Date(startYear + 1, 0, 1), end: new Date(startYear + 1, 5, 30) };
};

// Syncs published assessment marks to SemesterResult before generating the roster
export const syncAssessmentMarksToSemesterResults = async (academicYear: string, semester: '1' | '2') => {
  const publishedAssessments = await Assessment.find({ academicYear, term: semester, status: 'Published' });
  const assessmentIds = publishedAssessments.map(a => a._id);

  if (assessmentIds.length === 0) return;

  const marks = await AssessmentMark.find({ assessment: { $in: assessmentIds } }).populate('assessment');
  const studentSubjectMap = new Map<string, { totalMarks: number }>();

  marks.forEach(mark => {
    const assessment = mark.assessment as any;
    const key = `${mark.student.toString()}_${assessment.subject.toString()}`;
    if (!studentSubjectMap.has(key)) {
      studentSubjectMap.set(key, { totalMarks: 0 });
    }
    studentSubjectMap.get(key)!.totalMarks += mark.marksObtained;
  });

  const { calculateGradeFromPercentage } = await import('../utils/gradeCalculation');
  const bulkOps = [];

  for (const [key, data] of studentSubjectMap.entries()) {
    const [studentId, subjectId] = key.split('_');
    const finalMark = Math.min(100, Math.round(data.totalMarks));
    const { letterGrade } = calculateGradeFromPercentage(finalMark, undefined);

    bulkOps.push({
      updateOne: {
        filter: { student: studentId, subject: subjectId, academicYear, semester },
        update: { $set: { mark: finalMark, grade: letterGrade } },
        upsert: true
      }
    });
  }

  if (bulkOps.length > 0) {
    await SemesterResult.bulkWrite(bulkOps);
  }
};

// Generates or updates the semester roster for all students in an academic year
export const generateSemesterRoster = async (academicYear: string, semester: '1' | '2'): Promise<void> => {
  try {
    await syncAssessmentMarksToSemesterResults(academicYear, semester);
    const students = await Student.find({ status: 'Active' }).populate('section');
    const results = await SemesterResult.find({ academicYear, semester });

    // Calculate attendance for the semester
    const dateRange = getSemesterDateRange(academicYear, semester);

    // Group results by student
    const studentResults = new Map<string, any[]>();
    results.forEach(r => {
      const sId = r.student.toString();
      if (!studentResults.has(sId)) studentResults.set(sId, []);
      studentResults.get(sId)!.push(r);
    });

    const rosterData: any[] = [];

    // Calculate averages, totals, and attendance
    for (const student of students) {
      const sId = student._id.toString();
      const sMarks = studentResults.get(sId) || [];
      if (sMarks.length === 0) continue;

      const totalMarks = sMarks.reduce((sum, r) => sum + r.mark, 0);
      const average = parseFloat((totalMarks / sMarks.length).toFixed(2));

      // Calculate attendance percentage
      let attendance = 100;
      if (student.section) {
        attendance = await calculateAttendancePercentage(
          sId,
          student.section._id.toString(),
          dateRange.start,
          dateRange.end
        );
      }

      rosterData.push({
        studentId: sId,
        student,
        totalMarks,
        average,
        result: getResultStatus(average),
        attendance
      });
    }

    // Sort by average to assign ranks
    rosterData.sort((a, b) => b.average - a.average);

    const assignRanks = (data: any[]) => {
      let currentRank = 1;
      for (let i = 0; i < data.length; i++) {
        if (i > 0 && data[i].average < data[i - 1].average) {
          currentRank = i + 1;
        }
        data[i].rank = currentRank;
      }
    };

    // Calculate section ranks
    const sectionGroups = new Map<string, any[]>();
    rosterData.forEach(d => {
      const secId = d.student.section?._id.toString();
      if (!secId) return;
      if (!sectionGroups.has(secId)) sectionGroups.set(secId, []);
      sectionGroups.get(secId)!.push(d);
    });

    sectionGroups.forEach(group => assignRanks(group));

    // Calculate grade ranks
    const gradeGroups = new Map<number, any[]>();
    rosterData.forEach(d => {
      const grade = d.student.section?.grade;
      if (!grade) return;
      if (!gradeGroups.has(grade)) gradeGroups.set(grade, []);
      gradeGroups.get(grade)!.push(d);
    });

    gradeGroups.forEach(group => assignRanks(group));

    // Update AnnualResult with Semester data
    for (const data of rosterData) {
      const secId = data.student.section?._id.toString();
      const grade = data.student.section?.grade;
      const sectionRank = sectionGroups.get(secId)?.find(x => x.studentId === data.studentId)?.rank;
      const gradeRank = gradeGroups.get(grade)?.find(x => x.studentId === data.studentId)?.rank;

      const updateData: any = {};
      if (semester === '1') {
        updateData.semester1Total = data.totalMarks;
        updateData.semester1Average = data.average;
        updateData.semester1SectionRank = sectionRank;
        updateData.semester1GradeRank = gradeRank;
        updateData.semester1Result = data.result;
        updateData.attendance = data.attendance;
      } else {
        updateData.semester2Total = data.totalMarks;
        updateData.semester2Average = data.average;
        updateData.semester2SectionRank = sectionRank;
        updateData.semester2GradeRank = gradeRank;
        updateData.semester2Result = data.result;
        updateData.attendance = data.attendance;
      }

      await AnnualResult.findOneAndUpdate(
        { student: data.studentId, academicYear },
        { $set: updateData },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    logger.error('Error generating semester roster', { error, academicYear, semester });
    throw error;
  }
};

export const generateAnnualRoster = async (academicYear: string): Promise<void> => {
  try {
    const students = await Student.find({ status: 'Active' }).populate('section');
    const annualResults = await AnnualResult.find({ academicYear }).populate({ path: 'student', populate: { path: 'section' } });

    const rosterData = annualResults.filter(r => r.semester1Average !== undefined && r.semester2Average !== undefined).map(r => {
      const s1Avg = r.semester1Average || 0;
      const s2Avg = r.semester2Average || 0;
      const annualAvg = parseFloat(((s1Avg + s2Avg) / 2).toFixed(2));

      // Check for missing marks (both semesters should have marks for all subjects)
      const hasSem1Marks = r.semester1Total !== undefined && r.semester1Total !== null;
      const hasSem2Marks = r.semester2Total !== undefined && r.semester2Total !== null;
      const hasMissingMarks = !hasSem1Marks || !hasSem2Marks;

      // Average attendance from both semesters
      const attendance = r.attendance || 100;

      return {
        _id: r._id,
        studentId: r.student._id.toString(),
        student: r.student,
        annualAverage: annualAvg,
        finalResult: getResultStatus(annualAvg),
        promotionStatus: getPromotionStatus(annualAvg, hasMissingMarks),
        attendance,
      };
    });

    rosterData.sort((a, b) => b.annualAverage - a.annualAverage);

    const assignRanks = (data: any[]) => {
      let currentRank = 1;
      for (let i = 0; i < data.length; i++) {
        if (i > 0 && data[i].annualAverage < data[i - 1].annualAverage) {
          currentRank = i + 1;
        }
        data[i].rank = currentRank;
      }
    };

    // Calculate section ranks
    const sectionGroups = new Map<string, any[]>();
    rosterData.forEach(d => {
      const secId = (d.student as any).section?._id?.toString();
      if (!secId) return;
      if (!sectionGroups.has(secId)) sectionGroups.set(secId, []);
      sectionGroups.get(secId)!.push(d);
    });
    sectionGroups.forEach(group => assignRanks(group));

    // Calculate grade ranks
    const gradeGroups = new Map<number, any[]>();
    rosterData.forEach(d => {
      const grade = (d.student as any).section?.grade;
      if (!grade) return;
      if (!gradeGroups.has(grade)) gradeGroups.set(grade, []);
      gradeGroups.get(grade)!.push(d);
      (d as any).grade = grade;
    });
    gradeGroups.forEach(group => assignRanks(group));

    // Calculate school ranks
    assignRanks(rosterData);

    // Save annual averages and ranks
    for (const data of rosterData) {
      const secId = (data.student as any).section?._id?.toString();
      const sectionRank = sectionGroups.get(secId)?.find(x => x.studentId === data.studentId)?.rank;
      const gradeRank = gradeGroups.get((data as any).grade)?.find(x => x.studentId === data.studentId)?.rank;
      const schoolRank = data.rank;

      await AnnualResult.findByIdAndUpdate(data._id, {
        $set: {
          annualAverage: data.annualAverage,
          annualSectionRank: sectionRank,
          annualGradeRank: gradeRank,
          annualSchoolRank: schoolRank,
          finalResult: data.finalResult,
          promotionStatus: data.promotionStatus
        }
      });
    }
  } catch (error) {
    logger.error('Error generating annual roster', { error, academicYear });
    throw error;
  }
};

/**
 * Get subject-wise marks breakdown for a student.
 */
export const getStudentSubjectBreakdown = async (
  studentId: string,
  academicYear: string,
  semester?: '1' | '2'
): Promise<any[]> => {
  const filter: any = { student: studentId, academicYear };
  if (semester) filter.semester = semester;

  const marks = await SemesterResult.find(filter)
    .populate('subject', 'name code')
    .sort({ semester: 1, 'subject.name': 1 });

  return marks.map(m => ({
    subjectId: m.subject?._id,
    subjectName: (m.subject as any)?.name,
    subjectCode: (m.subject as any)?.code,
    semester: m.semester,
    mark: m.mark,
    grade: m.grade,
  }));
};

/**
 * Get enhanced dashboard statistics with breakdowns.
 */
export const getEnhancedDashboardStats = async (academicYear: string) => {
  const results = await AnnualResult.find({ academicYear }).populate({
    path: 'student',
    populate: { path: 'section' },
  });

  const totalStudents = await Student.countDocuments({ status: 'Active' });
  const sectionIds = await Student.distinct('section', { status: 'Active' });

  let passed = 0;
  let failed = 0;
  let incomplete = 0;
  let highestAvg = 0;
  let lowestAvg = 100;
  let sumAvg = 0;
  let avgCount = 0;

  const gradeDistribution: Record<string, number> = { Excellent: 0, 'Very Good': 0, Good: 0, Pass: 0, Fail: 0 };
  const genderBreakdown = { male: 0, female: 0 };
  const promotionBreakdown = { Promoted: 0, Repeat: 0, Incomplete: 0, Graduated: 0 };

  // Per-grade stats
  const gradeStats: Record<number, { total: number; passed: number; avg: number; sum: number }> = {};

  for (const r of results) {
    const student = r.student as any;
    if (!student) continue;

    // Gender
    if (student.gender === 'Male') genderBreakdown.male++;
    else genderBreakdown.female++;

    // Annual average
    if (r.annualAverage !== undefined) {
      if (r.promotionStatus === 'Promoted') passed++;
      if (r.promotionStatus === 'Repeat') failed++;
      if (r.promotionStatus === 'Incomplete') incomplete++;
      if (r.promotionStatus === 'Graduated') promotionBreakdown.Graduated++;

      if (r.annualAverage > highestAvg) highestAvg = r.annualAverage;
      if (r.annualAverage < lowestAvg) lowestAvg = r.annualAverage;
      sumAvg += r.annualAverage;
      avgCount++;

      // Grade result distribution
      const result = getResultStatus(r.annualAverage);
      if (gradeDistribution[result] !== undefined) gradeDistribution[result]++;

      // Promotion distribution
      if (r.promotionStatus && promotionBreakdown[r.promotionStatus as keyof typeof promotionBreakdown] !== undefined) {
        promotionBreakdown[r.promotionStatus as keyof typeof promotionBreakdown]++;
      }

      // Per-grade stats
      const grade = student.section?.grade;
      if (grade) {
        if (!gradeStats[grade]) gradeStats[grade] = { total: 0, passed: 0, avg: 0, sum: 0 };
        gradeStats[grade].total++;
        gradeStats[grade].sum += r.annualAverage;
        if (r.promotionStatus === 'Promoted') gradeStats[grade].passed++;
      }
    }
  }

  if (avgCount === 0) lowestAvg = 0;

  // Calculate per-grade averages
  for (const grade of Object.keys(gradeStats)) {
    const g = gradeStats[Number(grade)];
    g.avg = g.total > 0 ? parseFloat((g.sum / g.total).toFixed(2)) : 0;
  }

  return {
    totalStudents,
    totalSections: sectionIds.length,
    totalPassed: passed,
    totalFailed: failed,
    totalIncomplete: incomplete,
    highestAverage: highestAvg,
    lowestAverage: lowestAvg,
    overallSchoolAverage: avgCount > 0 ? parseFloat((sumAvg / avgCount).toFixed(2)) : 0,
    gradeDistribution,
    genderBreakdown,
    promotionBreakdown,
    gradeStats,
  };
};

/**
 * Transition students to a new academic year.
 * Assigns promoted students to sections in the new year.
 */
export const transitionToNewAcademicYear = async (
  currentAcademicYear: string,
  newAcademicYear: string,
  sectionAssignments: { studentId: string; newSectionId: string }[]
): Promise<{ assigned: number; skipped: number }> => {
  let assigned = 0;
  let skipped = 0;

  for (const assignment of sectionAssignments) {
    try {
      const result = await AnnualResult.findOne({
        student: assignment.studentId,
        academicYear: currentAcademicYear,
        promotionStatus: 'Promoted',
      });

      if (!result) {
        skipped++;
        continue;
      }

      // Update student's section and grade
      const student = await Student.findById(assignment.studentId);
      if (!student) { skipped++; continue; }

      const newSection = await Section.findById(assignment.newSectionId);
      if (!newSection) { skipped++; continue; }

      student.section = newSection._id as any;
      student.grade = newSection.grade;
      student.status = 'Active' as any;
      await student.save();

      // Create blank AnnualResult for new year
      await AnnualResult.findOneAndUpdate(
        { student: assignment.studentId, academicYear: newAcademicYear },
        { $set: { student: assignment.studentId, academicYear: newAcademicYear } },
        { upsert: true, new: true }
      );

      assigned++;
    } catch (err) {
      logger.error('Error transitioning student', { studentId: assignment.studentId, error: err });
      skipped++;
    }
  }

  try {
    await (await import('../models')).AuditLog.create({
      userId: undefined,
      activityType: 'ACADEMIC_YEAR_TRANSITION',
      entityType: 'Student',
      description: `Transitioned ${assigned} students from ${currentAcademicYear} to ${newAcademicYear}`,
      metadata: { currentAcademicYear, newAcademicYear, assigned, skipped },
      success: true,
    });
  } catch { /* audit log non-critical */ }

  return { assigned, skipped };
};
