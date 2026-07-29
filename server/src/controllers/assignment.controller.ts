import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  Student, Section, Teacher, TeacherAssignment, Subject, User, AuditLog, Notification,
} from '../models';
import { ApiError } from '../middleware/errorHandler';
import { UserRole, NotificationType } from '../types';
import { logger } from '../utils/logger';

/* ───────── BATCH ASSIGN STUDENTS TO SECTION ───────── */

export const batchAssignStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { sectionId, studentIds } = req.body;

    if (!sectionId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, 'Required: sectionId, studentIds[]');
    }

    const section = await Section.findById(sectionId);
    if (!section) throw new ApiError(404, 'Section not found');
    if (!section.isActive) throw new ApiError(400, 'Section is not active');

    const students = await Student.find({ _id: { $in: studentIds }, status: 'Active' });
    if (students.length === 0) throw new ApiError(404, 'No active students found');

    const gradeMismatch = students.filter((s) => s.grade !== section.grade);
    if (gradeMismatch.length > 0) {
      throw new ApiError(400,
        `${gradeMismatch.length} student(s) have grade ${gradeMismatch[0].grade} but section is grade ${section.grade}`
      );
    }

    const currentEnrolled = await Student.countDocuments({ section: sectionId, status: 'Active' });
    const capacity = section.capacity || 50;
    const availableSeats = capacity - currentEnrolled;

    if (studentIds.length > availableSeats) {
      throw new ApiError(400,
        `Section has only ${availableSeats} seat(s) available (${currentEnrolled}/${capacity}). Cannot assign ${studentIds.length} student(s).`
      );
    }

    const results: { studentId: string; studentName: string; status: string; message?: string }[] = [];

    for (const student of students) {
      if (student.section?.toString() === sectionId) {
        results.push({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          status: 'skipped',
          message: 'Already in this section',
        });
        continue;
      }

      student.section = new mongoose.Types.ObjectId(sectionId);
      await student.save();

      results.push({
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        status: 'assigned',
      });
    }

    const assignedCount = results.filter((r) => r.status === 'assigned').length;

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_BATCH_ASSIGNMENT',
      description: `${assignedCount} student(s) assigned to section ${section.name} (Grade ${section.grade})`,
      ipAddress: req.ip,
      metadata: {
        sectionId, studentIds, assignedCount, assignedBy: req.user.userId,
      },
    });

    logger.info(`Batch student assignment: ${assignedCount} students to ${section.name}`);

    res.status(201).json({
      success: true,
      message: `${assignedCount} student(s) assigned to ${section.name}. ${studentIds.length - assignedCount} skipped.`,
      data: {
        section: { _id: section._id, name: section.name, grade: section.grade },
        results,
        enrolled: currentEnrolled + assignedCount,
        capacity,
        availableSeats: Math.max(0, capacity - currentEnrolled - assignedCount),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── ASSIGNMENT HISTORY ───────── */

export const getAssignmentHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, page = 1, limit = 30, startDate, endDate } = req.query;

    const activityTypes = ['TEACHER_ASSIGNMENT', 'TEACHER_UNASSIGNMENT', 'TEACHER_BATCH_ASSIGNMENT', 'STUDENT_BATCH_ASSIGNMENT'];

    const filter: any = {
      activityType: { $in: type ? [type] : activityTypes },
    };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'firstName lastName userId')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const enriched = logs.map((log) => ({
      _id: log._id,
      activityType: log.activityType,
      description: log.description,
      performedBy: log.userId ? {
        _id: (log.userId as any)._id,
        name: `${(log.userId as any).firstName} ${(log.userId as any).lastName}`,
        userId: (log.userId as any).userId,
      } : null,
      metadata: log.metadata,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
    }));

    res.json({
      success: true,
      data: enriched,
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

/* ───────── ASSIGNMENT DASHBOARD ───────── */

export const getAssignmentDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear } = req.query;
    const year = academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

    const [totalStudents, assignedStudents, totalSections, totalTeachers, sectionData] = await Promise.all([
      Student.countDocuments({ status: 'Active' }),
      Student.countDocuments({ status: 'Active', section: { $ne: null } }),
      Section.countDocuments({ isActive: true, isArchived: false }),
      Teacher.countDocuments({ status: 'Active' }),
      Section.find({ isActive: true, isArchived: false }).select('capacity grade name _id'),
    ]);

    const unassignedStudents = totalStudents - assignedStudents;
    const assignedTeachers = await TeacherAssignment.distinct('teacher', { isActive: true });
    const unassignedTeachers = totalTeachers - assignedTeachers.length;

    const overloadedTeachers = await TeacherAssignment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$teacher', totalPeriods: { $sum: '$periodsPerWeek' } } },
      { $match: { totalPeriods: { $gt: 30 } } },
      { $count: 'count' },
    ]);

    let fullSections = 0;
    let totalCapacity = 0;
    let totalEnrolled = 0;
    for (const sec of sectionData) {
      const count = await Student.countDocuments({ section: sec._id, status: 'Active' });
      totalCapacity += sec.capacity || 50;
      totalEnrolled += count;
      if (count >= (sec.capacity || 50)) fullSections++;
    }
    const utilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    const availableSeats = totalCapacity - totalEnrolled;

    const byGrade = await Section.aggregate([
      { $match: { isActive: true, isArchived: false } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const byGradeEnrollment = await Student.aggregate([
      { $match: { status: 'Active', section: { $ne: null } } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          assigned: assignedStudents,
          unassigned: unassignedStudents,
          assignmentRate: totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0,
        },
        sections: {
          total: totalSections,
          full: fullSections,
          availableSeats: Math.max(0, availableSeats),
          utilization,
          byGrade,
        },
        teachers: {
          total: totalTeachers,
          assigned: assignedTeachers.length,
          unassigned: unassignedTeachers,
          overloaded: overloadedTeachers[0]?.count || 0,
          assignmentRate: totalTeachers > 0 ? Math.round((assignedTeachers.length / totalTeachers) * 100) : 0,
        },
        enrollment: { total: totalEnrolled, capacity: totalCapacity, utilization, byGrade: byGradeEnrollment },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── UNASSIGNED STUDENTS ───────── */

export const getUnassignedStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grade, search, page = 1, limit = 50 } = req.query;
    const filter: any = {
      status: 'Active',
      $or: [
        { section: { $exists: false } },
        { section: null },
      ],
    };
    if (grade) filter.grade = Number(grade);
    if (search) {
      const re = new RegExp(String(search), 'i');
      filter.$or = [
        { firstName: re }, { lastName: re }, { studentId: re },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('userId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Student.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: students,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── SECTION OVERVIEW (subjects + teachers) ───────── */

export const getSectionOverview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id)
      .populate('assistantTeacher', 'teacherId firstName lastName');
    if (!section) throw new ApiError(404, 'Section not found');

    const [students, teacherAssignments, subjectAssignments] = await Promise.all([
      Student.find({ section: id, status: 'Active' }).select('studentId firstName lastName gender').sort({ firstName: 1 }),
      TeacherAssignment.find({ section: id, isActive: true })
        .populate('teacher', 'teacherId firstName lastName')
        .populate('subject', 'name code shortName'),
      Subject.find({ grades: section.grade, status: 'Active' }).select('name code shortName subjectType weeklyPeriods'),
    ]);

    const subjectTeachers: Record<string, any[]> = {};
    for (const ta of teacherAssignments) {
      const subId = (ta.subject as any)?._id?.toString();
      if (!subId) continue;
      if (!subjectTeachers[subId]) subjectTeachers[subId] = [];
      subjectTeachers[subId].push({
        teacher: ta.teacher,
        periodsPerWeek: ta.periodsPerWeek,
        assignmentId: ta._id,
      });
    }

    const subjectsWithTeachers = subjectAssignments.map((sub) => ({
      _id: sub._id,
      name: sub.name,
      code: sub.code,
      shortName: sub.shortName,
      subjectType: sub.subjectType,
      weeklyPeriods: sub.weeklyPeriods,
      teachers: subjectTeachers[sub._id.toString()] || [],
    }));

    const unassignedSubjects = subjectsWithTeachers.filter((s) => s.teachers.length === 0);

    const assignedSubjects = subjectsWithTeachers
      .filter((s) => s.teachers.length > 0)
      .flatMap((s) =>
        s.teachers.map((t: any) => ({
          subjectId: s._id.toString(),
          subjectName: s.name,
          teacherName: t.teacher ? `${t.teacher.firstName} ${t.teacher.lastName}` : 'Unknown',
          teacherId: t.teacher?._id?.toString(),
          periodsPerWeek: t.periodsPerWeek,
          assignmentId: t.assignmentId?.toString(),
        }))
      );

    res.json({
      success: true,
      data: {
        section: {
          _id: section._id,
          name: section.name,
          grade: section.grade,
          stream: section.stream,
          academicYear: section.academicYear,
          capacity: section.capacity,
          enrolled: students.length,
          availableSeats: Math.max(0, (section.capacity || 50) - students.length),
          isFull: students.length >= (section.capacity || 50),
        },
        assistantTeacher: section.assistantTeacher,
        subjects: subjectsWithTeachers,
        unassignedSubjects,
        assignedSubjects,
        students,
        totalStudents: students.length,
        totalSubjects: subjectsWithTeachers.length,
        totalAssignedSubjects: subjectsWithTeachers.length - unassignedSubjects.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── BATCH TEACHER ASSIGNMENT ───────── */

export const batchAssignTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { teacherId, subjectId, sectionIds, periodsPerWeek, academicYear } = req.body;
    if (!teacherId || !subjectId || !sectionIds || !sectionIds.length || !academicYear) {
      throw new ApiError(400, 'Required: teacherId, subjectId, sectionIds[], academicYear');
    }

    const teacher = await Teacher.findById(teacherId).populate('subjects');
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    if (teacher.status !== 'Active') throw new ApiError(400, 'Teacher is not active');

    const subject = await Subject.findById(subjectId);
    if (!subject) throw new ApiError(404, 'Subject not found');

    const sections = await Section.find({ _id: { $in: sectionIds }, isActive: true, isArchived: false });
    if (sections.length !== sectionIds.length) {
      throw new ApiError(400, 'One or more sections not found or inactive');
    }

    const isQualified = teacher.subjects.some((s: any) => s._id.toString() === subjectId);
    if (!isQualified) {
      throw new ApiError(400, `Teacher ${teacher.fullName} is not qualified to teach ${subject.name}`);
    }

    // Check current workload
    const currentAssignments = await TeacherAssignment.find({ teacher: teacherId, isActive: true });
    const currentPeriods = currentAssignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);
    const newPeriods = (periodsPerWeek || 4) * sectionIds.length;
    const MAX_PERIODS = 30;

    if (currentPeriods + newPeriods > MAX_PERIODS) {
      throw new ApiError(400,
        `Cannot assign: teacher would have ${currentPeriods + newPeriods} periods (max ${MAX_PERIODS}). ` +
        `Current: ${currentPeriods}, new: ${newPeriods}. Remove other assignments first.`
      );
    }

    const results: { sectionId: string; status: string; message?: string }[] = [];
    for (const sectionId of sectionIds) {
      const existing = await TeacherAssignment.findOne({
        teacher: teacherId, section: sectionId, subject: subjectId, academicYear, isActive: true,
      });
      if (existing) {
        results.push({ sectionId, status: 'skipped', message: 'Already assigned' });
        continue;
      }
      await TeacherAssignment.create({
        teacher: teacherId, section: sectionId, subject: subjectId,
        academicYear, periodsPerWeek: periodsPerWeek || 4,
        startDate: new Date(), isActive: true,
      });
      results.push({ sectionId, status: 'assigned' });
    }

    const assignedCount = results.filter((r) => r.status === 'assigned').length;

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_BATCH_ASSIGNMENT',
      description: `Teacher ${teacher.fullName} assigned to ${subject.name} for ${assignedCount} section(s)`,
      ipAddress: req.ip,
      metadata: {
        teacherId: teacher.teacherId, subjectId, sectionIds, academicYear,
        periodsPerWeek: periodsPerWeek || 4, assignedBy: req.user.userId,
      },
    });

    if (teacher.userId) {
      await Notification.create({
        recipient: teacher.userId,
        type: NotificationType.ACADEMIC,
        title: 'New Class Assignments',
        message: `You have been assigned to teach ${subject.name} in ${assignedCount} new section(s).`,
      });
    }

    const nowAssignments = await TeacherAssignment.find({ teacher: teacherId, isActive: true });
    const nowPeriods = nowAssignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);

    logger.info(`Batch teacher assignment`, {
      teacherId: teacher.teacherId, subject: subject.name, sections: assignedCount, totalPeriods: nowPeriods,
    });

    res.status(201).json({
      success: true,
      message: `${assignedCount} section(s) assigned. Teacher now has ${nowPeriods}/${MAX_PERIODS} periods.`,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        subject: { name: subject.name, code: subject.code },
        results,
        workload: { current: nowPeriods, max: MAX_PERIODS, remaining: MAX_PERIODS - nowPeriods },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── CHECK TEACHER WORKLOAD ───────── */

export const checkTeacherWorkload = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');

    const assignments = await TeacherAssignment.find({ teacher: id, isActive: true })
      .populate('subject', 'name code')
      .populate('section', 'name grade');

    const totalPeriods = assignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);
    const MAX_PERIODS = 30;
    const sectionIds = [...new Set(assignments.map((a) => a.section?._id?.toString()).filter(Boolean))];
    const totalStudents = await Student.countDocuments({ section: { $in: sectionIds }, status: 'Active' });
    const totalSubjects = [...new Set(assignments.map((a) => a.subject?._id?.toString()).filter(Boolean))].length;

    res.json({
      success: true,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        workload: {
          totalPeriods,
          maxAllowed: MAX_PERIODS,
          remaining: Math.max(0, MAX_PERIODS - totalPeriods),
          isOverloaded: totalPeriods > MAX_PERIODS,
          utilization: Math.round((totalPeriods / MAX_PERIODS) * 100),
        },
        details: {
          totalSubjects,
          totalSections: sectionIds.length,
          totalStudents,
          assignments,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── SECTION SUBJECT-TEACHER MAPPING ───────── */

export const assignSectionSubjectTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { sectionId, subjectId, teacherId, periodsPerWeek, academicYear } = req.body;
    if (!sectionId || !subjectId || !teacherId || !academicYear) {
      throw new ApiError(400, 'Required: sectionId, subjectId, teacherId, academicYear');
    }

    const [teacher, section, subject] = await Promise.all([
      Teacher.findById(teacherId).populate('subjects'),
      Section.findById(sectionId),
      Subject.findById(subjectId),
    ]);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    if (teacher.status !== 'Active') throw new ApiError(400, 'Teacher is not active');
    if (!section) throw new ApiError(404, 'Section not found');
    if (!subject) throw new ApiError(404, 'Subject not found');

    const isQualified = teacher.subjects.some((s: any) => s._id.toString() === subjectId);
    if (!isQualified) throw new ApiError(400, `Teacher not qualified to teach ${subject.name}`);

    // Workload check
    const currentAssignments = await TeacherAssignment.find({ teacher: teacherId, isActive: true });
    const currentPeriods = currentAssignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);
    const ppw = periodsPerWeek || 4;
    if (currentPeriods + ppw > 30) {
      throw new ApiError(400, `Cannot assign: would exceed 30 period max (currently ${currentPeriods}, adding ${ppw})`);
    }

    const existing = await TeacherAssignment.findOne({
      teacher: teacherId, section: sectionId, subject: subjectId, academicYear, isActive: true,
    });
    if (existing) throw new ApiError(400, 'Teacher already assigned to this section-subject');

    const assignment = await TeacherAssignment.create({
      teacher: teacherId, section: sectionId, subject: subjectId,
      academicYear, periodsPerWeek: ppw, startDate: new Date(), isActive: true,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_ASSIGNMENT',
      description: `Teacher ${teacher.fullName} assigned to ${section.name} for ${subject.name}`,
      ipAddress: req.ip,
      metadata: { teacherId: teacher.teacherId, sectionId, subjectId, academicYear, assignedBy: req.user.userId },
    });

    if (teacher.userId) {
      await Notification.create({
        recipient: teacher.userId,
        type: NotificationType.ACADEMIC,
        title: 'New Class Assignment',
        message: `You have been assigned to teach ${subject.name} for section ${section.name}.`,
      });
    }

    const updatedWorkload = currentPeriods + ppw;
    res.status(201).json({
      success: true,
      message: `Teacher assigned. Workload: ${updatedWorkload}/30 periods.`,
      data: { assignment, workload: { current: updatedWorkload, max: 30, remaining: 30 - updatedWorkload } },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── ASSIGNMENT REPORTS ───────── */

export const getAssignmentReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, grade, academicYear } = req.query;

    switch (type) {
      case 'enrollment': {
        const match: any = { isActive: true, isArchived: false };
        if (grade) match.grade = Number(grade);

        const sections = await Section.find(match).select('name grade capacity _id').sort({ grade: 1, name: 1 });
        const byGradeMap: Record<number, { _id: number; students: number; capacity: number }> = {};
        let totalStudents = 0;
        let totalCapacity = 0;

        for (const sec of sections) {
          const enrolled = await Student.countDocuments({ section: sec._id, status: 'Active' });
          const g = sec.grade;
          if (!byGradeMap[g]) byGradeMap[g] = { _id: g, students: 0, capacity: 0 };
          byGradeMap[g].students += enrolled;
          byGradeMap[g].capacity += sec.capacity || 50;
          totalStudents += enrolled;
          totalCapacity += sec.capacity || 50;
        }

        res.json({
          success: true,
          data: {
            reportType: 'enrollment',
            byGrade: Object.values(byGradeMap),
            totalStudents,
            totalCapacity,
            utilization: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
          },
        });
        break;
      }

      case 'teacher-workload': {
        const teachers = await Teacher.find({ status: 'Active' }).select('teacherId firstName lastName employeeNumber');
        const workloads = await Promise.all(teachers.map(async (t) => {
          const assignments = await TeacherAssignment.find({ teacher: t._id, isActive: true });
          const totalPeriods = assignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);
          return {
            _id: t._id,
            teacherName: `${t.firstName} ${t.lastName}`,
            employeeId: (t as any).employeeNumber || t.teacherId,
            totalPeriods,
            maxPeriods: 30,
            remaining: Math.max(0, 30 - totalPeriods),
            overloaded: totalPeriods > 30,
          };
        }));
        res.json({
          success: true,
          data: {
            reportType: 'teacher-workload',
            workloads,
          },
        });
        break;
      }

      case 'section-subject-teacher': {
        const match: any = { isActive: true, isArchived: false };
        if (grade) match.grade = Number(grade);

        const sections = await Section.find(match).select('name grade _id').sort({ grade: 1, name: 1 });
        const mappings: { sectionName: string; grade: number; subjectName: string; teacherName: string | null; periodsPerWeek: number }[] = [];

        for (const sec of sections) {
          const assignments = await TeacherAssignment.find({ section: sec._id, isActive: true })
            .populate('teacher', 'firstName lastName')
            .populate('subject', 'name');
          for (const a of assignments) {
            mappings.push({
              sectionName: sec.name,
              grade: sec.grade,
              subjectName: (a.subject as any)?.name || 'Unknown',
              teacherName: (a.teacher as any) ? `${(a.teacher as any).firstName} ${(a.teacher as any).lastName}` : null,
              periodsPerWeek: a.periodsPerWeek,
            });
          }
        }

        res.json({
          success: true,
          data: {
            reportType: 'section-subject-teacher',
            mappings,
          },
        });
        break;
      }

      default:
        throw new ApiError(400, `Unknown report type: ${type}. Available: enrollment, teacher-workload, section-subject-teacher`);
    }
  } catch (error) {
    next(error);
  }
};

/* ───────── TEACHER ASSIGNMENTS OVERVIEW ───────── */

export const getTeacherAssignments = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [assignments, allTeachers] = await Promise.all([
      TeacherAssignment.find({ isActive: true })
        .populate('teacher', 'firstName lastName teacherId employeeId')
        .populate('section', 'name grade stream')
        .populate('subject', 'name code subjectType')
        .sort({ createdAt: -1 })
        .lean(),
      Teacher.find({ status: 'Active' }).select('_id firstName lastName teacherId employeeId').lean(),
    ]);

    const grouped: Record<string, any> = {};
    for (const a of assignments) {
      const t = a.teacher as any;
      if (!t || !t._id) continue;
      const tid = String(t._id);
      if (!grouped[tid]) {
        grouped[tid] = {
          _id: tid,
          teacherId: t.teacherId || '',
          employeeId: t.employeeId || '',
          firstName: t.firstName || '',
          lastName: t.lastName || '',
          totalPeriods: 0,
          sections: [],
        };
      }
      grouped[tid].totalPeriods += a.periodsPerWeek || 0;
      grouped[tid].sections.push({
        assignmentId: a._id,
        section: a.section || null,
        subject: a.subject || null,
        periodsPerWeek: a.periodsPerWeek || 0,
        startDate: a.startDate || null,
      });
    }

    const teachers = Object.values(grouped);
    const totalTeachers = allTeachers.length;
    const assigned = teachers.length;
    const unassigned = totalTeachers - assigned;

    res.json({
      success: true,
      data: {
        teachers,
        stats: {
          totalTeachers,
          assigned,
          unassigned,
          assignmentRate: totalTeachers > 0 ? Math.round((assigned / totalTeachers) * 100) : 0,
        },
      },
    });
  } catch (error) {
    logger.error('getTeacherAssignments error:', error);
    next(error);
  }
};