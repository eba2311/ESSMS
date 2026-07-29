import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  Section, Teacher, TeacherAssignment, Subject, Student, AssessmentMark, Assessment, User,
  AuditLog, Notification, Timetable,
} from '../models';
import { ApiError } from '../middleware/errorHandler';
import { UserRole, NotificationType } from '../types';
import { logger } from '../utils/logger';

/* ───────── GET ALL SECTIONS ───────── */

export const getSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grade, academicYear } = req.query;
    const filter: any = { isActive: true, isArchived: false };
    if (grade) filter.grade = Number(grade);
    if (academicYear) filter.academicYear = academicYear;

    const sections = await Section.find(filter)
      .sort({ grade: 1, name: 1 });

    const result = await Promise.all(sections.map(async (sec) => {
      const enrolled = await Student.countDocuments({ section: sec._id, status: 'Active' });
      return {
        _id: sec._id,
        name: sec.name,
        grade: sec.grade,
        stream: sec.stream,
        academicYear: sec.academicYear,
        capacity: sec.capacity,
        enrolled,
        availableSeats: Math.max(0, (sec.capacity || 50) - enrolled),
      };
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/* ───────── GET SECTION FULL DATA (subjects, teachers, students) ───────── */

export const getSectionData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const section = await Section.findById(sectionId)
      .populate('assistantTeacher', 'firstName lastName teacherId');
    if (!section) throw new ApiError(404, 'Section not found');

    const [students, teacherAssignments, gradeSubjects] = await Promise.all([
      Student.find({ section: sectionId, status: 'Active' })
        .select('studentId firstName lastName gender')
        .sort({ firstName: 1 }),
      TeacherAssignment.find({ section: sectionId, isActive: true })
        .populate('teacher', 'firstName lastName teacherId employeeId')
        .populate('subject', 'name code shortName subjectType weeklyPeriods'),
      Subject.find({ grades: section.grade, status: 'Active' })
        .select('name code shortName subjectType weeklyPeriods')
        .sort({ name: 1 }),
    ]);

    const subjectMap: Record<string, any[]> = {};
    for (const ta of teacherAssignments) {
      const subId = (ta.subject as any)?._id?.toString();
      if (!subId) continue;
      if (!subjectMap[subId]) subjectMap[subId] = [];
      subjectMap[subId].push({
        assignmentId: ta._id,
        teacher: ta.teacher,
        periodsPerWeek: ta.periodsPerWeek,
        startDate: ta.startDate,
      });
    }

    const subjects = gradeSubjects.map((sub) => ({
      _id: sub._id,
      name: sub.name,
      code: sub.code,
      shortName: sub.shortName,
      subjectType: sub.subjectType,
      weeklyPeriods: sub.weeklyPeriods,
      teachers: subjectMap[sub._id.toString()] || [],
    }));

    const unassignedSubjects = subjects.filter((s) => s.teachers.length === 0);
    const assignedSubjects = subjects.filter((s) => s.teachers.length > 0);

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
          assistantTeacher: section.assistantTeacher,
        },
        subjects,
        unassignedSubjects,
        assignedSubjects,
        students,
        totalStudents: students.length,
        totalSubjects: subjects.length,
        totalAssignedSubjects: assignedSubjects.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── ASSIGN TEACHER TO SECTION + SUBJECT ───────── */

export const assignTeacher = async (
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
    if (section && teacher.status !== 'Active') throw new ApiError(400, 'Teacher is not active');
    if (!section) throw new ApiError(404, 'Section not found');
    if (!subject) throw new ApiError(404, 'Subject not found');

    const isQualified = teacher.subjects?.some((s: any) => s._id?.toString() === subjectId);
    if (!isQualified) {
      throw new ApiError(400, `Teacher ${teacher.firstName} ${teacher.lastName} is not qualified to teach ${subject.name}`);
    }

    const currentAssignments = await TeacherAssignment.find({ teacher: teacherId, isActive: true });
    const currentPeriods = currentAssignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);
    const ppw = periodsPerWeek || 4;
    if (currentPeriods + ppw > 30) {
      throw new ApiError(400,
        `Cannot assign: would exceed 30 period max (currently ${currentPeriods}, adding ${ppw})`
      );
    }

    const existing = await TeacherAssignment.findOne({
      teacher: teacherId, section: sectionId, subject: subjectId, academicYear, isActive: true,
    });
    if (existing) throw new ApiError(400, 'Teacher already assigned to this section-subject');

    // Check for timetable conflicts - same teacher at same period in different sections
    const allAssignments = await TeacherAssignment.find({ teacher: teacherId, academicYear, isActive: true })
      .populate('section', 'name');
    const sectionIds = allAssignments.map(a => a.section?._id?.toString()).filter(Boolean);
    sectionIds.push(sectionId);

    const timetables = await Timetable.find({
      section: { $in: sectionIds },
      academicYear,
      isActive: true,
    });

    const teacherSlots = new Map<string, string>();
    for (const tt of timetables) {
      for (const slot of tt.schedule) {
        if (slot.teacher?.toString() === teacherId) {
          const key = `${slot.dayOfWeek}_${slot.periodNumber}`;
          teacherSlots.set(key, `${(tt.section as any)?.name || 'Unknown'} (Period ${slot.periodNumber})`);
        }
      }
    }

    const conflicts: string[] = [];
    // If there's a timetable for the target section, check for period conflicts
    const targetTimetable = timetables.find(t => t.section?._id?.toString() === sectionId);
    if (targetTimetable) {
      // Check if adding periods would conflict with existing schedule
      const sectionSlots = targetTimetable.schedule.filter(s => s.teacher?.toString() === teacherId);
      if (sectionSlots.length > 0) {
        conflicts.push(`Teacher already has ${sectionSlots.length} period(s) scheduled in this section`);
      }
    }

    const assignment = await TeacherAssignment.create({
      teacher: teacherId, section: sectionId, subject: subjectId,
      academicYear, periodsPerWeek: ppw, startDate: new Date(), isActive: true,
    });

    const populated = await TeacherAssignment.findById(assignment._id)
      .populate('teacher', 'firstName lastName teacherId')
      .populate('subject', 'name code');

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_ASSIGNMENT',
      description: `Teacher ${teacher.firstName} ${teacher.lastName} assigned to ${section.name} for ${subject.name}`,
      ipAddress: req.ip,
      metadata: { teacherId, sectionId, subjectId, academicYear, assignedBy: req.user.userId },
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
      message: `${teacher.firstName} ${teacher.lastName} assigned to ${section.name} for ${subject.name}`,
      data: {
        assignment: populated,
        workload: { current: updatedWorkload, max: 30, remaining: 30 - updatedWorkload },
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── REMOVE TEACHER ASSIGNMENT ───────── */

export const removeAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { assignmentId } = req.params;

    const assignment = await TeacherAssignment.findById(assignmentId)
      .populate('teacher', 'firstName lastName')
      .populate('section', 'name')
      .populate('subject', 'name');
    if (!assignment) throw new ApiError(404, 'Assignment not found');

    assignment.isActive = false;
    assignment.endDate = new Date();
    await assignment.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_UNASSIGNMENT',
      description: `Assignment removed: ${(assignment.teacher as any)?.firstName} ${(assignment.teacher as any)?.lastName} removed from ${(assignment.section as any)?.name} for ${(assignment.subject as any)?.name}`,
      ipAddress: req.ip,
      metadata: { assignmentId: assignment._id, removedBy: req.user.userId },
    });

    res.json({ success: true, message: 'Assignment removed successfully' });
  } catch (error) {
    next(error);
  }
};

/* ───────── GET MARKS FOR SUBJECT IN SECTION ───────── */

export const getSubjectMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId, subjectId } = req.params;

    const [section, subject] = await Promise.all([
      Section.findById(sectionId),
      Subject.findById(subjectId),
    ]);
    if (!section) throw new ApiError(404, 'Section not found');
    if (!subject) throw new ApiError(404, 'Subject not found');

    const students = await Student.find({ section: sectionId, status: 'Active' })
      .select('studentId firstName lastName gender')
      .sort({ firstName: 1 });

    const assessments = await Assessment.find({
      subject: subjectId,
      section: sectionId,
      status: 'Published',
    }).select('name type totalMarks term');

    const marks = await AssessmentMark.find({
      assessment: { $in: assessments.map((a) => a._id) },
      student: { $in: students.map((s) => s._id) },
    }).populate('assessment', 'name type totalMarks');

    const marksByStudent: Record<string, any[]> = {};
    for (const m of marks) {
      const sid = (m.student as any).toString();
      if (!marksByStudent[sid]) marksByStudent[sid] = [];
      marksByStudent[sid].push(m);
    }

    const studentsWithMarks = students.map((s) => ({
      _id: s._id,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender,
      marks: marksByStudent[s._id.toString()] || [],
    }));

    res.json({
      success: true,
      data: {
        section: { _id: section._id, name: section.name, grade: section.grade },
        subject: { _id: subject._id, name: subject.name, code: subject.code },
        assessments,
        students: studentsWithMarks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── SAVE MARKS FOR SUBJECT IN SECTION ───────── */

export const saveSubjectMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { sectionId, subjectId } = req.params;
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new ApiError(400, 'Required: entries array with { assessmentId, studentId, marksObtained }');
    }

    const assessmentIds = [...new Set(entries.map((e: any) => e.assessmentId).filter(Boolean))];
    const assessments = await Assessment.find({ _id: { $in: assessmentIds } });
    const assessmentMap: Record<string, number> = {};
    for (const a of assessments) {
      assessmentMap[a._id.toString()] = a.totalMarks;
    }

    const calcFields = (marksObtained: number, totalMarks: number) => {
      const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
      let letterGrade: string;
      let gradePoint: number;
      if (percentage >= 90) { letterGrade = 'A'; gradePoint = 4.0; }
      else if (percentage >= 80) { letterGrade = 'B'; gradePoint = 3.0; }
      else if (percentage >= 70) { letterGrade = 'C'; gradePoint = 2.0; }
      else if (percentage >= 60) { letterGrade = 'D'; gradePoint = 1.0; }
      else { letterGrade = 'F'; gradePoint = 0.0; }
      return { percentage: Math.round(percentage * 100) / 100, letterGrade, gradePoint };
    };

    const results: { studentId: string; status: string; mark?: number; error?: string }[] = [];

    for (const entry of entries) {
      try {
        if (!entry.assessmentId || !entry.studentId || entry.marksObtained === undefined) {
          results.push({ studentId: entry.studentId || 'unknown', status: 'error', error: 'Missing required fields' });
          continue;
        }

        const totalMarks = assessmentMap[entry.assessmentId];
        if (!totalMarks) {
          results.push({ studentId: entry.studentId, status: 'error', error: 'Assessment not found' });
          continue;
        }

        const derived = calcFields(entry.marksObtained, totalMarks);

        const mark = await AssessmentMark.findOneAndUpdate(
          { assessment: entry.assessmentId, student: entry.studentId },
          {
            marksObtained: entry.marksObtained,
            ...derived,
            enteredBy: req.user.id,
            enteredAt: new Date(),
            modifiedBy: req.user.id,
            modifiedAt: new Date(),
          },
          { upsert: true, new: true, runValidators: true }
        );

        results.push({ studentId: entry.studentId, status: 'saved', mark: mark.marksObtained });
      } catch (err: any) {
        results.push({ studentId: entry.studentId, status: 'error', error: err.message });
      }
    }

    logger.info(`Marks saved for ${assessmentIds.length} assessment(s) by user ${req.user.userId}`);

    res.json({
      success: true,
      message: `${results.filter((r) => r.status === 'saved').length} mark(s) saved`,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── GET ALL TEACHERS (for assignment dropdown) ───────── */

export const getTeachers = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teachers = await Teacher.find({ status: 'Active' })
      .select('firstName lastName teacherId employeeId subjects')
      .populate('subjects', 'name code')
      .sort({ firstName: 1 });
    res.json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

/* ───────── GET ALL TEACHER ASSIGNMENTS (teacher -> subjects per section) ───────── */

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
