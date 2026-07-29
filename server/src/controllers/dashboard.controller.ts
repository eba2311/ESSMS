import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Student, Teacher, Section, Assessment, Attendance, Book, User, Payment, Event, FeeStructure } from '../models';
import { Types } from 'mongoose';
import { AssessmentStatus } from '../types';
import { getCurrentAcademicYear } from '../utils/academicYear.util';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const academicYear = await getCurrentAcademicYear();
    const totalStudents = await Student.countDocuments({ status: 'Active' });
    const totalTeachers = await Teacher.countDocuments();
    const totalSections = await Section.countDocuments();
    const totalAssessments = await Assessment.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();

    // Calculate pending (outstanding) fees
    const [totalCollected, feeStructures, studentCounts] = await Promise.all([
      Payment.aggregate([
        { $match: { academicYear } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      FeeStructure.find({ academicYear, isActive: true }),
      Student.aggregate([
        { $match: { status: 'Active', academicYear } },
        { $group: { _id: '$grade', count: { $sum: 1 } } },
      ]),
    ]);

    const collected = totalCollected[0]?.total || 0;
    const gradeCountMap: Record<number, number> = {};
    studentCounts.forEach((g: any) => { gradeCountMap[g._id] = g.count; });
    const totalOwed = feeStructures.reduce((sum: number, fs: any) => {
      const studentsInGrade = gradeCountMap[fs.grade] || 0;
      return sum + (fs.totalAmount * studentsInGrade);
    }, 0);
    const pendingFees = Math.max(0, totalOwed - collected);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const todayPresent = await Attendance.countDocuments({ date: { $gte: todayStart, $lt: todayEnd }, status: 'Present' });
    const todayAbsent = await Attendance.countDocuments({ date: { $gte: todayStart, $lt: todayEnd }, status: 'Absent' });
    const events = await Event.find({ startDate: { $gte: now } }).sort({ startDate: 1 }).limit(5);
    const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(5).populate('section');

    // Students by grade for pie chart
    const studentsByGrade = await Student.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const gradeMap: Record<number, number> = {};
    studentsByGrade.forEach((g: any) => { gradeMap[g._id] = g.count; });

    // Weekly attendance (last 7 days)
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAttendance = await Attendance.aggregate([
      { $match: { date: { $gte: weekAgo, $lt: todayEnd } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const dayMap: Record<string, { present: number; total: number }> = {};
    weekAttendance.forEach((r: any) => {
      const d = r._id.date;
      if (!dayMap[d]) dayMap[d] = { present: 0, total: 0 };
      dayMap[d].total += r.count;
      if (r._id.status === 'Present') dayMap[d].present += r.count;
    });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyAttendance = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-5)
      .map(([date, data]) => ({
        month: dayNames[new Date(date + 'T12:00:00').getDay()],
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      }));

    res.json({
      success: true,
      data: {
        totalStudents, totalTeachers, totalSections, totalAssessments,
        totalBooks, totalUsers,
        academicYear,
        pendingFees,
        todayPresent, todayAbsent,
        attendanceRate: (todayPresent + todayAbsent) > 0 ? Math.round((todayPresent / (todayPresent + todayAbsent)) * 100) : 0,
        events, recentStudents,
        grade9: gradeMap[9] || 0, grade10: gradeMap[10] || 0, grade11: gradeMap[11] || 0, grade12: gradeMap[12] || 0,
        studentsByGrade: studentsByGrade.map((g: any) => ({ name: `Grade ${g._id}`, value: g.count })),
        weeklyAttendance,
      },
    });
  } catch (error) { next(error); }
};

export const getTeacherDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { TeacherAssignment } = await import('../models');
    const teacher = await Teacher.findOne({ userId: req.user?.id });
    if (!teacher) {
      res.json({ success: true, data: { classes: 0, students: 0, assessments: 0 } });
      return;
    }
    const assignments = await TeacherAssignment.find({ teacher: teacher._id }).populate<{ section: { _id: Types.ObjectId; name: string } }>('section');
    const sectionIds = assignments.map((a) => a.section?._id).filter(Boolean) as Types.ObjectId[];
    const students = await Student.countDocuments({ section: { $in: sectionIds }, status: 'Active' });
    const assessments = await Assessment.countDocuments({ teacher: teacher._id });
    res.json({
      success: true,
      data: {
        classes: assignments.length, students, assessments,
        sections: assignments.map((a) => ({ section: a.section?.name })),
      },
    });
  } catch (error) { next(error); }
};

export const getStudentDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await Student.findOne({ userId: req.user?.id }).populate('section');
    if (!student) {
      res.json({ success: true, data: null });
      return;
    }

    const academicYear = student.academicYear || await getCurrentAcademicYear();
    const { AssessmentMark, Ranking } = await import('../models');

    const marks = await AssessmentMark.find({ student: student._id })
      .populate({
        path: 'assessment',
        match: { academicYear, status: AssessmentStatus.PUBLISHED },
        populate: { path: 'subject' },
      });

    const validMarks = marks.filter((m) => m.assessment);

    const attendanceRecords = await Attendance.find({ student: student._id }).sort({ date: -1 }).limit(30);
    const present = attendanceRecords.filter((a) => a.status === 'Present').length;

    const getGradeInfo = (avg: number) => {
      if (avg >= 90) return { letterGrade: 'A', gpa: 4.0 };
      if (avg >= 80) return { letterGrade: 'B', gpa: 3.0 };
      if (avg >= 70) return { letterGrade: 'C', gpa: 2.0 };
      if (avg >= 60) return { letterGrade: 'D', gpa: 1.0 };
      return { letterGrade: 'F', gpa: 0.0 };
    };

    const processTermMarks = (termMarks: any[]) => {
      const subjectMap: Record<string, { percentages: number[]; subject: any }> = {};
      termMarks.forEach((m: any) => {
        const subjectId = m.assessment.subject._id.toString();
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = { percentages: [], subject: m.assessment.subject };
        }
        subjectMap[subjectId].percentages.push(m.percentage);
      });

      const subjects = Object.values(subjectMap).map(({ percentages, subject }) => {
        const average = Math.round((percentages.reduce((s, p) => s + p, 0) / percentages.length) * 100) / 100;
        return { subject, average, ...getGradeInfo(average) };
      });

      const overallAverage = subjects.length > 0
        ? Math.round((subjects.reduce((s, sa) => s + sa.average, 0) / subjects.length) * 100) / 100
        : 0;
      const gpa = subjects.length > 0
        ? Math.round((subjects.reduce((s, sa) => s + sa.gpa, 0) / subjects.length) * 100) / 100
        : 0;

      return { subjects, overallAverage, gpa };
    };

    const term1Marks = validMarks.filter((m: any) => m.assessment.term === '1');
    const term2Marks = validMarks.filter((m: any) => m.assessment.term === '2');

    const term1 = processTermMarks(term1Marks);
    const term2 = processTermMarks(term2Marks);

    const rankings = await Ranking.find({ student: student._id, academicYear });
    const formatRanking = (r: any) => r ? {
      sectionRank: r.sectionRank,
      gradeRank: r.gradeRank,
      streamRank: r.streamRank,
      schoolRank: r.schoolRank,
      totalStudentsInSection: r.totalStudentsInSection,
      totalStudentsInGrade: r.totalStudentsInGrade,
      totalStudentsInStream: r.totalStudentsInStream,
      totalStudentsInSchool: r.totalStudentsInSchool,
      meritCategory: r.meritCategory,
    } : null;

    res.json({
      success: true,
      data: {
        student,
        attendanceRate: attendanceRecords.length > 0 ? Math.round((present / attendanceRecords.length) * 100) : 0,
        totalAssessments: marks.length,
        term1: { ...term1, ranking: formatRanking(rankings.find((r) => r.term === '1')) },
        term2: { ...term2, ranking: formatRanking(rankings.find((r) => r.term === '2')) },
      },
    });
  } catch (error) { next(error); }
};
