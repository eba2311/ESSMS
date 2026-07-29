import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SemesterResult, AnnualResult, Student, Section, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import {
  generateSemesterRoster, generateAnnualRoster, getStudentSubjectBreakdown,
  getEnhancedDashboardStats, transitionToNewAcademicYear
} from '../services/roster.service';
import { getCurrentAcademicYear } from '../utils/academicYear.util';
import { logger } from '../utils/logger';

export const saveSemesterMarks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, semester, subjectId, mark, grade, academicYear } = req.body;
    
    if (!studentId || !semester || !subjectId || mark === undefined || !grade) {
      throw new ApiError(400, 'Missing required fields for semester mark');
    }

    const year = academicYear || await getCurrentAcademicYear();

    const result = await SemesterResult.findOneAndUpdate(
      { student: studentId, subject: subjectId, semester, academicYear: year },
      { mark, grade },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getSemesterRoster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, semester, sectionId, grade } = req.query;
    const year = (academicYear as string) || await getCurrentAcademicYear();

    if (!semester) {
      throw new ApiError(400, 'Semester is required');
    }

    let filter: any = { academicYear: year };
    
    const results = await AnnualResult.find(filter).populate({
      path: 'student',
      populate: { path: 'section' }
    });

    const semesterMarks = await SemesterResult.find({ academicYear: year, semester }).populate('subject', 'name');

    let filtered = results.filter(r => {
      const student = r.student as any;
      if (!student) return false;
      if (sectionId && student.section?._id?.toString() !== sectionId) return false;
      if (grade && student.section?.grade?.toString() !== grade) return false;
      return true;
    });

    const mapped = filtered.map(r => {
      const student = r.student as any;
      const isSem1 = semester === '1';
      
      const studentMarks = semesterMarks.filter(sm => sm.student.toString() === student._id.toString()).map(sm => ({
        subjectId: sm.subject?._id,
        subjectName: (sm.subject as any)?.name,
        mark: sm.mark,
        grade: sm.grade
      }));

      return {
        studentId: student.studentId,
        registrationNumber: student.admissionNumber,
        fullName: student.fullName,
        gender: student.gender,
        grade: student.section?.grade,
        section: student.section?.name,
        stream: student.section?.stream,
        academicYear: r.academicYear,
        totalMarks: isSem1 ? r.semester1Total : r.semester2Total,
        average: isSem1 ? r.semester1Average : r.semester2Average,
        sectionRank: isSem1 ? r.semester1SectionRank : r.semester2SectionRank,
        gradeRank: isSem1 ? r.semester1GradeRank : r.semester2GradeRank,
        attendance: r.attendance,
        conduct: r.conduct,
        result: isSem1 ? r.semester1Result : r.semester2Result,
        marks: studentMarks
      };
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
};

export const getAnnualRoster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, sectionId, grade } = req.query;
    const year = (academicYear as string) || await getCurrentAcademicYear();

    const results = await AnnualResult.find({ academicYear: year }).populate({
      path: 'student',
      populate: { path: 'section' }
    });

    const studentIds = results.map(r => (r.student as any)?._id).filter(Boolean);
    const sem1Marks = await SemesterResult.find({ academicYear: year, semester: '1', student: { $in: studentIds } }).populate('subject', 'name');
    const sem2Marks = await SemesterResult.find({ academicYear: year, semester: '2', student: { $in: studentIds } }).populate('subject', 'name');

    const sem1Map = new Map<string, any[]>();
    const sem2Map = new Map<string, any[]>();
    sem1Marks.forEach(sm => {
      const sid = sm.student.toString();
      if (!sem1Map.has(sid)) sem1Map.set(sid, []);
      sem1Map.get(sid)!.push({ subjectId: sm.subject?._id, subjectName: (sm.subject as any)?.name, mark: sm.mark, grade: sm.grade });
    });
    sem2Marks.forEach(sm => {
      const sid = sm.student.toString();
      if (!sem2Map.has(sid)) sem2Map.set(sid, []);
      sem2Map.get(sid)!.push({ subjectId: sm.subject?._id, subjectName: (sm.subject as any)?.name, mark: sm.mark, grade: sm.grade });
    });

    let filtered = results.filter(r => {
      const student = r.student as any;
      if (!student) return false;
      if (sectionId && student.section?._id?.toString() !== sectionId) return false;
      if (grade && student.section?.grade?.toString() !== grade) return false;
      return true;
    });

    const mapped = filtered.map(r => {
      const student = r.student as any;
      const sid = student._id.toString();
      return {
        studentId: student.studentId,
        registrationNumber: student.admissionNumber,
        fullName: student.fullName,
        gender: student.gender,
        grade: student.section?.grade,
        section: student.section?.name,
        stream: student.section?.stream,
        academicYear: r.academicYear,
        semester1Average: r.semester1Average,
        semester2Average: r.semester2Average,
        annualAverage: r.annualAverage,
        sectionRank: r.annualSectionRank,
        gradeRank: r.annualGradeRank,
        schoolRank: r.annualSchoolRank,
        finalResult: r.finalResult,
        promotionStatus: r.promotionStatus,
        attendance: r.attendance,
        sem1Marks: sem1Map.get(sid) || [],
        sem2Marks: sem2Map.get(sid) || [],
      };
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
};

export const calculateSemesterRoster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, semester } = req.body;
    if (!academicYear || !semester) {
      throw new ApiError(400, 'academicYear and semester are required');
    }
    await generateSemesterRoster(academicYear, semester);
    res.status(200).json({ success: true, message: `Semester ${semester} roster generated for ${academicYear}` });
  } catch (error) {
    next(error);
  }
};

export const calculateAnnualRoster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear } = req.body;
    if (!academicYear) {
      throw new ApiError(400, 'academicYear is required');
    }
    await generateAnnualRoster(academicYear);
    res.status(200).json({ success: true, message: `Annual roster generated for ${academicYear}` });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear } = req.query;
    const year = (academicYear as string) || await getCurrentAcademicYear();

    const results = await AnnualResult.find({ academicYear: year });
    const students = await Student.countDocuments({ status: 'Active' });
    const sections = await Student.distinct('section'); // Basic estimation

    let passed = 0;
    let failed = 0;
    let highestAvg = 0;
    let lowestAvg = 100;
    let sumAvg = 0;
    let avgCount = 0;

    results.forEach(r => {
      if (r.annualAverage !== undefined) {
        if (r.promotionStatus === 'Promoted') passed++;
        if (r.promotionStatus === 'Repeat') failed++;
        if (r.annualAverage > highestAvg) highestAvg = r.annualAverage;
        if (r.annualAverage < lowestAvg) lowestAvg = r.annualAverage;
        sumAvg += r.annualAverage;
        avgCount++;
      }
    });

    if (avgCount === 0) lowestAvg = 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents: students,
        totalSections: sections.length,
        totalPassed: passed,
        totalFailed: failed,
        highestAverage: highestAvg,
        lowestAverage: lowestAvg,
        overallSchoolAverage: avgCount > 0 ? parseFloat((sumAvg / avgCount).toFixed(2)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const bulkSaveMarks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sectionId, semester, subjectId, marks, academicYear } = req.body;
    if (!sectionId || !semester || !subjectId || !marks || !Array.isArray(marks)) {
      throw new ApiError(400, 'sectionId, semester, subjectId, and marks array are required');
    }

    const year = academicYear || await getCurrentAcademicYear();
    const { calculateGradeFromPercentage } = await import('../utils/gradeCalculation');

    const bulkOps = marks.map((m: any) => {
      const finalMark = Math.min(100, Math.round(m.mark));
      const { letterGrade } = calculateGradeFromPercentage(finalMark, undefined);
      return {
        updateOne: {
          filter: { student: m.studentId, subject: subjectId, semester, academicYear: year },
          update: { $set: { mark: finalMark, grade: letterGrade } },
          upsert: true,
        }
      };
    });

    if (bulkOps.length > 0) {
      await SemesterResult.bulkWrite(bulkOps);
    }

    res.status(200).json({ success: true, message: `${bulkOps.length} marks saved for semester ${semester}` });
  } catch (error) {
    next(error);
  }
};

export const promoteStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, studentIds, action } = req.body;
    if (!academicYear || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, 'academicYear and studentIds array are required');
    }
    if (action && !['promote', 'repeat', 'hold'].includes(action)) {
      throw new ApiError(400, 'action must be promote, repeat, or hold');
    }

    const results = await AnnualResult.find({
      academicYear,
      student: { $in: studentIds },
    }).populate({ path: 'student', populate: { path: 'section' } });

    const promoted: any[] = [];
    const repeated: any[] = [];
    const skipped: any[] = [];

    for (const result of results) {
      const student = result.student as any;
      if (!student) { skipped.push(result.student); continue; }

      const determinedAction = action || (result.promotionStatus === 'Promoted' ? 'promote' : result.promotionStatus === 'Repeat' ? 'repeat' : 'hold');

      if (determinedAction === 'promote' && student.section) {
        const currentGrade = student.section.grade;
        const nextGrade = currentGrade + 1;
        if (nextGrade <= 12) {
          student.grade = nextGrade;
          student.section = undefined;
          student.status = 'Active';
          await student.save();
          result.promotionStatus = 'Promoted';
          await result.save();
          promoted.push({ studentId: student.studentId, name: `${student.firstName} ${student.lastName}`, from: currentGrade, to: nextGrade });
        } else {
          result.promotionStatus = 'Graduated';
          await result.save();
          promoted.push({ studentId: student.studentId, name: `${student.firstName} ${student.lastName}`, from: currentGrade, to: 'Graduated' });
        }
      } else if (determinedAction === 'repeat') {
        result.promotionStatus = 'Repeat';
        await result.save();
        repeated.push({ studentId: student.studentId, name: `${student.firstName} ${student.lastName}`, grade: student.section?.grade });
      } else {
        skipped.push({ studentId: student.studentId, name: `${student.firstName} ${student.lastName}` });
      }
    }

    try {
      await AuditLog.create({
        userId: req.user?._id,
        activityType: 'PROMOTE_STUDENTS',
        entityType: 'Student',
        description: `Promoted ${promoted.length} students, ${repeated.length} repeats for ${academicYear}`,
        metadata: { academicYear, promotedCount: promoted.length, repeatCount: repeated.length, totalProcessed: studentIds.length },
        success: true,
      });
    } catch { /* audit log non-critical */ }

    res.status(200).json({
      success: true,
      message: `${promoted.length} promoted, ${repeated.length} repeated, ${skipped.length} skipped`,
      data: { promoted, repeated, skipped },
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionsForRoster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, grade } = req.query;
    const filter: any = { isActive: true, isArchived: false };
    if (academicYear) filter.academicYear = academicYear;
    if (grade) filter.grade = Number(grade);

    const sections = await Section.find(filter)
      .populate('assistantTeacher', 'firstName lastName teacherId')
      .sort({ grade: 1, name: 1 })
      .lean();

    const sectionsWithCounts = await Promise.all(
      sections.map(async (sec: any) => {
        const count = await Student.countDocuments({ section: sec._id, status: 'Active' });
        return { ...sec, enrolled: count };
      })
    );

    res.status(200).json({ success: true, data: sectionsWithCounts });
  } catch (error) {
    next(error);
  }
};

// === NEW ENDPOINTS ===

export const getMyResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw new ApiError(401, 'Not authenticated');

    const { academicYear, semester } = req.query;
    const year = (academicYear as string) || await getCurrentAcademicYear();

    let studentId = user._id;

    // If user is a student, find the student record
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (!student) throw new ApiError(404, 'Student profile not found');
      studentId = student._id;
    }

    // If user is a parent, find their children
    if (user.role === 'parent') {
      const students = await Student.find({ guardian: user._id });
      if (students.length === 0) throw new ApiError(404, 'No children found');
      studentId = students[0]._id;
    }

    const annualResult = await AnnualResult.findOne({ student: studentId, academicYear: year })
      .populate({ path: 'student', populate: { path: 'section' } });

    if (!annualResult) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    const student = annualResult.student as any;

    // Get subject-wise marks
    const semFilter: any = {};
    if (semester) semFilter.semester = semester;
    const subjectMarks = await SemesterResult.find({
      student: studentId,
      academicYear: year,
      ...semFilter
    }).populate('subject', 'name code');

    const marksBySubject = subjectMarks.reduce((acc: any, sm: any) => {
      const subName = sm.subject?.name || 'Unknown';
      if (!acc[subName]) acc[subName] = { subject: subName, code: sm.subject?.code, semesters: {} };
      acc[subName].semesters[sm.semester] = { mark: sm.mark, grade: sm.grade };
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        studentId: student?.studentId,
        fullName: student?.fullName,
        gender: student?.gender,
        grade: student?.section?.grade,
        section: student?.section?.name,
        stream: student?.section?.stream,
        academicYear: year,
        semester1: {
          total: annualResult.semester1Total,
          average: annualResult.semester1Average,
          sectionRank: annualResult.semester1SectionRank,
          gradeRank: annualResult.semester1GradeRank,
          result: annualResult.semester1Result,
        },
        semester2: {
          total: annualResult.semester2Total,
          average: annualResult.semester2Average,
          sectionRank: annualResult.semester2SectionRank,
          gradeRank: annualResult.semester2GradeRank,
          result: annualResult.semester2Result,
        },
        annual: {
          average: annualResult.annualAverage,
          sectionRank: annualResult.annualSectionRank,
          gradeRank: annualResult.annualGradeRank,
          schoolRank: annualResult.annualSchoolRank,
          finalResult: annualResult.finalResult,
          promotionStatus: annualResult.promotionStatus,
        },
        attendance: annualResult.attendance,
        conduct: annualResult.conduct,
        subjectMarks: Object.values(marksBySubject),
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjectBreakdown = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, academicYear, semester } = req.query;
    if (!studentId || !academicYear) {
      throw new ApiError(400, 'studentId and academicYear are required');
    }

    const breakdown = await getStudentSubjectBreakdown(
      studentId as string,
      academicYear as string,
      semester as '1' | '2' | undefined
    );

    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    next(error);
  }
};

export const getEnhancedDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear } = req.query;
    const year = (academicYear as string) || await getCurrentAcademicYear();
    const stats = await getEnhancedDashboardStats(year);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const transitionAcademicYear = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentAcademicYear, newAcademicYear, sectionAssignments } = req.body;
    if (!currentAcademicYear || !newAcademicYear || !sectionAssignments || !Array.isArray(sectionAssignments)) {
      throw new ApiError(400, 'currentAcademicYear, newAcademicYear, and sectionAssignments array are required');
    }

    const result = await transitionToNewAcademicYear(currentAcademicYear, newAcademicYear, sectionAssignments);
    res.status(200).json({
      success: true,
      message: `Transition complete: ${result.assigned} assigned, ${result.skipped} skipped`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getReportCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, academicYear } = req.query;
    if (!studentId || !academicYear) {
      throw new ApiError(400, 'studentId and academicYear are required');
    }

    const annualResult = await AnnualResult.findOne({ student: studentId, academicYear })
      .populate({ path: 'student', populate: { path: 'section' } });

    if (!annualResult) throw new ApiError(404, 'No results found for this student');

    const student = annualResult.student as any;

    const sem1Marks = await SemesterResult.find({ student: studentId, academicYear, semester: '1' })
      .populate('subject', 'name code');
    const sem2Marks = await SemesterResult.find({ student: studentId, academicYear, semester: '2' })
      .populate('subject', 'name code');

    // Get school settings for report card header
    let schoolName = 'School Name';
    let schoolAddress = '';
    try {
      const Settings = (await import('../models')).Settings;
      const settings = await Settings.findOne();
      if (settings) {
        schoolName = settings.schoolName || schoolName;
        schoolAddress = settings.schoolAddress || schoolAddress;
      }
    } catch { /* use defaults */ }

    res.status(200).json({
      success: true,
      data: {
        school: { name: schoolName, address: schoolAddress },
        student: {
          id: student?.studentId,
          name: student?.fullName,
          gender: student?.gender,
          dateOfBirth: student?.dateOfBirth,
          grade: student?.section?.grade,
          section: student?.section?.name,
          stream: student?.section?.stream,
        },
        academicYear,
        semester1: {
          average: annualResult.semester1Average,
          total: annualResult.semester1Total,
          sectionRank: annualResult.semester1SectionRank,
          gradeRank: annualResult.semester1GradeRank,
          result: annualResult.semester1Result,
          marks: sem1Marks.map(m => ({
            subject: (m.subject as any)?.name,
            code: (m.subject as any)?.code,
            mark: m.mark,
            grade: m.grade,
          })),
        },
        semester2: {
          average: annualResult.semester2Average,
          total: annualResult.semester2Total,
          sectionRank: annualResult.semester2SectionRank,
          gradeRank: annualResult.semester2GradeRank,
          result: annualResult.semester2Result,
          marks: sem2Marks.map(m => ({
            subject: (m.subject as any)?.name,
            code: (m.subject as any)?.code,
            mark: m.mark,
            grade: m.grade,
          })),
        },
        annual: {
          average: annualResult.annualAverage,
          sectionRank: annualResult.annualSectionRank,
          gradeRank: annualResult.annualGradeRank,
          schoolRank: annualResult.annualSchoolRank,
          finalResult: annualResult.finalResult,
          promotionStatus: annualResult.promotionStatus,
        },
        attendance: annualResult.attendance,
        conduct: annualResult.conduct,
      }
    });
  } catch (error) {
    next(error);
  }
};
