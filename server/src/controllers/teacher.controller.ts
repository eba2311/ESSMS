import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  Teacher, TeacherAssignment, Section, Subject, User, AuditLog,
  Timetable, Student, SubjectSchedule, Assessment, AssessmentMark,
  Attendance,
} from '../models';
import { ApiError } from '../middleware/errorHandler';
import { UserRole, AssessmentStatus, LetterGrade } from '../types';
import { logger } from '../utils/logger';
import { generateAccount } from '../utils/account.util';

/* ───────── REGISTER ───────── */

export const registerTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const {
      firstName, middleName, lastName, gender, dateOfBirth, nationality, photo, maritalStatus,
      phoneNumber, altPhoneNumber, email,
      residentialAddress, emergencyContact,
      qualifications, specialization, teachingLicenseNumber,
      subjects, yearsOfExperience, employmentDate, employmentType, position,
    } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !employmentDate) {
      throw new ApiError(400, 'Missing required fields: firstName, lastName, email, phoneNumber, employmentDate');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, 'User with this email already exists');

    if (subjects && subjects.length > 0) {
      const subjectDocs = await Subject.find({ _id: { $in: subjects } });
      if (subjectDocs.length !== subjects.length) {
        throw new ApiError(404, 'One or more subjects not found');
      }
    }

    const account = await generateAccount(UserRole.TEACHER);
    const user = await User.create({
      username: account.username,
      email,
      passwordHash: account.hashedPassword,
      role: UserRole.TEACHER,
      firstName,
      lastName,
      forcePasswordChange: true,
    });

    const teacher = await Teacher.create({
      teacherId: account.username,
      userId: user._id,
      firstName, middleName: middleName || '', lastName,
      gender, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      nationality: nationality || 'Ethiopian', photo, maritalStatus,
      phoneNumber, altPhoneNumber, email,
      residentialAddress: residentialAddress || {},
      emergencyContact: emergencyContact || { name: '', relationship: '', phone: '' },
      qualifications: qualifications || [],
      specialization: specialization || '',
      teachingLicenseNumber,
      subjects: subjects || [],
      yearsOfExperience: yearsOfExperience || 0,
      employmentDate: new Date(employmentDate),
      employmentType: employmentType || 'Full-time',
      position: position || 'Subject Teacher',
      status: 'Active',
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_REGISTRATION',
      description: `New teacher registered: ${teacher.fullName}`,
      ipAddress: req.ip,
      metadata: { teacherId: teacher.teacherId, teacherUserId: user._id, registeredBy: req.user.userId },
    });

    logger.info(`Teacher registered`, { teacherId: teacher.teacherId, name: teacher.fullName, registeredBy: req.user.userId });

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      data: {
        teacherId: teacher.teacherId,
        fullName: teacher.fullName,
        email: user.email,
        credentials: { username: user.username, tempPassword: account.tempPassword },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── LIST ───────── */

export const listTeachers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subject, status, employmentType, position, gender, search, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (subject) filter.subjects = subject;
    if (status) filter.status = status;
    if (employmentType) filter.employmentType = employmentType;
    if (position) filter.position = position;
    if (gender) filter.gender = gender;
    if (search) {
      const re = new RegExp(String(search), 'i');
      filter.$or = [
        { firstName: re }, { middleName: re }, { lastName: re },
        { teacherId: re }, { employeeNumber: re }, { email: re },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [teachers, total] = await Promise.all([
      Teacher.find(filter)
        .populate('subjects', 'name code')
        .populate('userId', 'email')
        .skip(skip).limit(Number(limit))
        .sort({ lastName: 1, firstName: 1 }),
      Teacher.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: teachers,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── GET BY ID ───────── */

export const getTeacherById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id)
      .populate('userId', 'email userId username')
      .populate('subjects', 'name code shortName');
    if (!teacher) throw new ApiError(404, 'Teacher not found');

    const [assignments, workload] = await Promise.all([
      TeacherAssignment.find({ teacher: id, isActive: true })
        .populate('section', 'name grade')
        .populate('subject', 'name code'),
      TeacherAssignment.aggregate([
        { $match: { teacher: new mongoose.Types.ObjectId(id), isActive: true } },
        { $group: { _id: null, totalPeriods: { $sum: '$periodsPerWeek' }, sections: { $addToSet: '$section' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        ...teacher.toObject(),
        assignments,
        workloadSummary: workload[0] || { totalPeriods: 0, sections: [] },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── UPDATE ───────── */

export const updateTeacherProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');

    delete req.body.teacherId;
    delete req.body.userId;
    delete req.body.employeeNumber;

    const allowed = [
      'firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'nationality', 'photo', 'maritalStatus',
      'phoneNumber', 'altPhoneNumber', 'email', 'residentialAddress', 'emergencyContact',
      'qualifications', 'specialization', 'teachingLicenseNumber',
      'subjects', 'yearsOfExperience', 'employmentDate', 'employmentType', 'position', 'status',
    ];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (teacher as any)[field] = req.body[field];
      }
    }
    if (req.body.employmentDate) teacher.employmentDate = new Date(req.body.employmentDate);
    if (req.body.dateOfBirth) teacher.dateOfBirth = new Date(req.body.dateOfBirth);

    await teacher.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_PROFILE_UPDATE',
      description: `Teacher profile updated: ${teacher.fullName}`,
      ipAddress: req.ip,
      metadata: { teacherId: teacher.teacherId, updatedFields: Object.keys(req.body), updatedBy: req.user.userId },
    });

    res.json({ success: true, message: 'Teacher profile updated', data: teacher });
  } catch (error) {
    next(error);
  }
};

/* ───────── DELETE / ARCHIVE ───────── */

export const deleteTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, { status: 'Terminated' }, { new: true });
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    await TeacherAssignment.updateMany({ teacher: req.params.id, isActive: true }, { isActive: false, endDate: new Date() });
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_DELETED',
      description: `Teacher terminated: ${teacher.fullName}`,
      ipAddress: req.ip,
      metadata: { teacherId: teacher.teacherId, terminatedBy: req.user.userId },
    });
    res.json({ success: true, message: 'Teacher terminated and assignments deactivated' });
  } catch (error) {
    next(error);
  }
};

/* ───────── ASSIGN TEACHER ───────── */

export const assignTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { teacherId, sectionId, subjectId, academicYear, periodsPerWeek } = req.body;
    if (!teacherId || !sectionId || !subjectId || !academicYear) {
      throw new ApiError(400, 'Missing required fields');
    }

    const teacher = await Teacher.findById(teacherId).populate('subjects');
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    if (teacher.status !== 'Active') throw new ApiError(400, 'Teacher is not active');

    const section = await Section.findById(sectionId);
    if (!section) throw new ApiError(404, 'Section not found');

    const subject = await Subject.findById(subjectId);
    if (!subject) throw new ApiError(404, 'Subject not found');

    // Check qualification — warn if teacher has no subjects listed (e.g. seeded without subjects)
    const hasSubjectsList = teacher.subjects && teacher.subjects.length > 0;
    const isQualified = hasSubjectsList ? teacher.subjects.some((s: any) => {
      const sId = s._id ? s._id.toString() : s.toString();
      return sId === subjectId.toString();
    }) : true; // allow if no subjects list configured
    if (!isQualified) {
      logger.warn(`Teacher ${teacher.fullName} is not listed as qualified for subject ${subject.name}, but assigning anyway.`);
    }

    const existing = await TeacherAssignment.findOne({
      teacher: teacherId, section: sectionId, subject: subjectId, academicYear, isActive: true,
    });
    if (existing) throw new ApiError(400, 'Teacher already assigned to this section-subject');

    const assignment = await TeacherAssignment.create({
      teacher: teacherId, section: sectionId, subject: subjectId, academicYear,
      periodsPerWeek: periodsPerWeek || 4, startDate: new Date(), isActive: true,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_ASSIGNMENT',
      description: `Teacher ${teacher.fullName} assigned to ${section.name} for ${subject.name}`,
      ipAddress: req.ip,
      metadata: { teacherId: teacher.teacherId, sectionId, subjectId, academicYear, assignedBy: req.user.userId },
    });

    res.status(201).json({ success: true, message: 'Teacher assigned', data: assignment });
  } catch (error) {
    next(error);
  }
};

/* ───────── UNASSIGN ───────── */

export const unassignTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { assignmentId } = req.params;
    const assignment = await TeacherAssignment.findById(assignmentId)
      .populate('teacher', 'teacherId firstName lastName')
      .populate('section', 'name')
      .populate('subject', 'name');
    if (!assignment) throw new ApiError(404, 'Assignment not found');
    assignment.isActive = false;
    assignment.endDate = new Date();
    await assignment.save();
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_UNASSIGNMENT',
      description: 'Teacher unassigned from section-subject',
      ipAddress: req.ip,
      metadata: { assignmentId, teacherId: (assignment.teacher as any).teacherId, unassignedBy: req.user.userId },
    });
    res.json({ success: true, message: 'Teacher unassigned' });
  } catch (error) {
    next(error);
  }
};

/* ───────── GET ASSIGNMENTS ───────── */

export const getTeacherAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { academicYear } = req.query;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    const currentYear = new Date().getFullYear();
    const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
    const assignments = await TeacherAssignment.find({
      teacher: id,
      academicYear: academicYear || defaultAcademicYear,
      isActive: true,
    })
      .populate('section', 'name grade stream')
      .populate('subject', 'name code')
      .sort({ 'section.grade': 1, 'section.name': 1 });
    res.json({ success: true, data: { teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName }, assignments, totalAssignments: assignments.length } });
  } catch (error) {
    next(error);
  }
};

/* ───────── WORKLOAD ───────── */

export const getTeacherWorkload = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { academicYear } = req.query;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    const year = academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const assignments = await TeacherAssignment.find({ teacher: id, academicYear: year, isActive: true })
      .populate('section', 'name grade')
      .populate('subject', 'name code');
    const totalPeriods = assignments.reduce((s, a) => s + a.periodsPerWeek, 0);
    const totalStudents = await User.countDocuments({ role: 'student' });
    res.json({
      success: true,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        assignments,
        totalPeriodsPerWeek: totalPeriods,
        totalSections: assignments.length,
        totalSubjects: [...new Set(assignments.map(a => a.subject?._id?.toString()))].length,
        totalStudents,
        isOverloaded: totalPeriods > 30,
        workloadStatus: totalPeriods > 30 ? 'Overloaded' : 'Normal',
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── TEACHER ATTENDANCE ───────── */

export const recordTeacherAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const { checkIn, checkOut, status, notes, date } = req.body;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    const existingIdx = teacher.attendance.findIndex(
      (a) => new Date(a.date).toDateString() === today.toDateString()
    );
    const record = { date: today, checkIn, checkOut, status: status || 'Present', notes };
    if (existingIdx >= 0) {
      teacher.attendance[existingIdx] = { ...teacher.attendance[existingIdx].toObject(), ...record };
    } else {
      teacher.attendance.push(record as any);
    }
    await teacher.save();
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_ATTENDANCE',
      description: `Attendance recorded for ${teacher.fullName}: ${status || 'Present'}`,
      ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Attendance recorded', data: teacher.attendance });
  } catch (error) {
    next(error);
  }
};

export const getTeacherAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { from, to, limit = 50 } = req.query;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    let records = teacher.attendance || [];
    if (from) records = records.filter((a) => new Date(a.date) >= new Date(String(from)));
    if (to) records = records.filter((a) => new Date(a.date) <= new Date(String(to)));
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, data: records.slice(0, Number(limit)) });
  } catch (error) {
    next(error);
  }
};

/* ───────── LEAVE MANAGEMENT ───────── */

export const requestLeave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const { type, startDate, endDate, reason } = req.body;
    if (!type || !startDate || !endDate) throw new ApiError(400, 'Leave type, startDate, endDate required');
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    teacher.leaves.push({ type, startDate: new Date(startDate), endDate: new Date(endDate), reason, status: 'Pending' } as any);
    await teacher.save();
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_LEAVE_REQUEST',
      description: `Leave requested for ${teacher.fullName}: ${type}`,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, message: 'Leave request submitted', data: teacher.leaves });
  } catch (error) {
    next(error);
  }
};

export const approveLeave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id, leaveId } = req.params;
    const { status } = req.body;
    const validActions = ['Approved', 'Rejected'];
    if (!validActions.includes(status)) throw new ApiError(400, 'Status must be Approved or Rejected');

    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    const leave = (teacher.leaves as any).id(leaveId);
    if (!leave) throw new ApiError(404, 'Leave request not found');
    if (leave.status !== 'Pending' && leave.status !== 'AcademicApproved') {
      throw new ApiError(400, 'Leave already processed');
    }

    const user = await User.findById(req.user.id);
    const role = user?.role;

    if (status === 'Rejected') {
      leave.status = 'Rejected';
      leave.directorApprovedBy = req.user.id;
      await teacher.save();
      await AuditLog.create({
        userId: req.user.id, activityType: 'TEACHER_LEAVE_APPROVAL',
        description: `Leave rejected for ${teacher.fullName}`,
        ipAddress: req.ip,
      });
      return res.json({ success: true, message: 'Leave rejected', data: teacher.leaves });
    }

    // Multi-step approval: Academic Head → Director
    if (role === UserRole.ACADEMIC_HEAD || role === UserRole.SYSTEM_ADMIN) {
      leave.academicApprovedBy = req.user.id;
      leave.status = 'AcademicApproved';
      await teacher.save();
      await AuditLog.create({
        userId: req.user.id, activityType: 'TEACHER_LEAVE_APPROVAL',
        description: `Leave academically approved for ${teacher.fullName}`,
        ipAddress: req.ip,
      });
      return res.json({ success: true, message: 'Leave approved (academic head)', data: teacher.leaves });
    }

    if (role === UserRole.SCHOOL_DIRECTOR || role === UserRole.SYSTEM_ADMIN) {
      if (leave.status === 'Pending') {
        // Director can approve directly if no academic head
        leave.academicApprovedBy = req.user.id;
      }
      leave.directorApprovedBy = req.user.id;
      leave.status = 'Approved';
      teacher.status = 'On Leave';
      await teacher.save();
      await AuditLog.create({
        userId: req.user.id, activityType: 'TEACHER_LEAVE_APPROVAL',
        description: `Leave fully approved for ${teacher.fullName}`,
        ipAddress: req.ip,
      });
      return res.json({ success: true, message: 'Leave fully approved', data: teacher.leaves });
    }

    throw new ApiError(403, 'You do not have permission to approve leave at this stage');
  } catch (error) {
    next(error);
  }
};

/* ───────── TRANSFER ───────── */

export const transferTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const { fromSection, fromSubject, toSection, toSubject, reason, transferDate } = req.body;
    if (!toSection || !toSubject) throw new ApiError(400, 'To-section and to-subject are required');
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    teacher.transfers.push({
      fromSection, fromSubject, toSection, toSubject,
      reason, transferDate: new Date(transferDate || Date.now()),
      status: 'Approved', approvedBy: req.user.id,
    } as any);
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_TRANSFER',
      description: `Teacher ${teacher.fullName} transferred`,
      ipAddress: req.ip,
    });
    await teacher.save();
    res.json({ success: true, message: 'Transfer recorded', data: teacher.transfers });
  } catch (error) {
    next(error);
  }
};

/* ───────── DASHBOARD ───────── */

export const getTeacherDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: 'Active' });
    const onLeave = await Teacher.countDocuments({ status: 'On Leave' });
    const subjectTeachers = await Teacher.countDocuments({ position: 'Subject Teacher', status: 'Active' });
    const recentLeaves = await Teacher.aggregate([
      { $unwind: '$leaves' },
      { $match: { 'leaves.status': 'Pending' } },
      { $count: 'total' },
    ]);
    const workloadStats = await TeacherAssignment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgPeriods: { $avg: '$periodsPerWeek' }, total: { $sum: 1 } } },
    ]);
    const statusBreakdown = await Teacher.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const attendanceRate = await Teacher.aggregate([
      { $unwind: '$attendance' },
      { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$attendance.status', 'Present'] }, 1, 0] } } } },
    ]);

    res.json({
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        onLeave,
        subjectTeachers,
        pendingLeaveRequests: recentLeaves[0]?.total || 0,
        avgWorkload: Math.round((workloadStats[0]?.avgPeriods || 0) * 10) / 10,
        totalAssignments: workloadStats[0]?.total || 0,
        attendanceRate: attendanceRate[0] ? Math.round((attendanceRate[0].present / attendanceRate[0].total) * 100) : 0,
        statusBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── TEACHER PERFORMANCE ───────── */

export const getTeacherPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { academicYear } = req.query;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');

    const assignments = await TeacherAssignment.find({ teacher: id, isActive: true })
      .populate('subject', 'name code')
      .populate('section', 'name grade');

    const attendance = teacher.attendance || [];
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === 'Present').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        subjects: assignments.map((a) => ({ subject: a.subject, section: a.section })),
        totalAssignments: assignments.length,
        attendance: { totalDays, presentDays, attendanceRate },
        performanceMetrics: teacher.performanceMetrics || {},
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── UPDATE PERFORMANCE METRICS ───────── */

export const updateTeacherPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    if (req.body.academic) teacher.performanceMetrics.academic = { ...teacher.performanceMetrics?.academic, ...req.body.academic };
    if (req.body.administrative) teacher.performanceMetrics.administrative = { ...teacher.performanceMetrics?.administrative, ...req.body.administrative };
    await teacher.save();
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TEACHER_PERFORMANCE_UPDATE',
      description: `Performance metrics updated for ${teacher.fullName}`,
      ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Performance metrics updated', data: teacher.performanceMetrics });
  } catch (error) {
    next(error);
  }
};

/* ───────── HELPER: find teacher by user ID ───────── */

const findTeacherByUserId = async (userId: string) => {
  const teacher = await Teacher.findOne({ userId })
    .populate('subjects', 'name code shortName');
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  return teacher;
};

/* ───────── MY DASHBOARD ───────── */

export const getMyDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const [assignments, scheduleCount, pendingLeaves] = await Promise.all([
      TeacherAssignment.find({ teacher: teacher._id, isActive: true })
        .populate('section', 'name grade')
        .populate('subject', 'name code shortName'),
      SubjectSchedule.countDocuments({ teacher: teacher._id, isActive: true }),
      teacher.leaves.filter((l) => l.status === 'Pending').length,
    ]);

    const totalSubjects = [...new Set(assignments.map((a) => a.subject?._id?.toString()))].length;
    const totalSections = [...new Set(assignments.map((a) => a.section?._id?.toString()))].length;
    const totalPeriods = assignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);

    const sectionIds = [...new Set(assignments.map((a) => a.section?._id?.toString()).filter(Boolean))];
    const totalStudents = await Student.countDocuments({
      section: { $in: sectionIds }, status: 'Active',
    });

    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];

    const todaySchedule = await SubjectSchedule.find({
      teacher: teacher._id, dayOfWeek: todayName, isActive: true,
    })
      .populate('subject', 'name code shortName')
      .populate('section', 'name grade')
      .sort({ startTime: 1 });

    const attendance = teacher.attendance || [];
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const pendingMarks = await Assessment.countDocuments({
      teacher: teacher._id, status: AssessmentStatus.DRAFT,
    });

    const workloadStatus = totalPeriods > 30 ? 'Overloaded' : totalPeriods < 15 && assignments.length > 0 ? 'Underloaded' : 'Normal';

    const recentAssessments = await Assessment.find({ teacher: teacher._id })
      .populate('subject', 'name')
      .populate('section', 'name grade')
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        teacher: {
          teacherId: teacher.teacherId,
          fullName: teacher.fullName,
          position: teacher.position,
          status: teacher.status,
          employeeNumber: teacher.employeeNumber,
          photo: teacher.photo,
        },
        stats: {
          totalSubjects,
          totalSections,
          totalStudents,
          totalPeriods,
          scheduleCount,
          pendingLeaves,
          pendingMarks,
          attendanceRate,
          workloadStatus,
          workloadSummary: { totalPeriods, status: workloadStatus },
        },
        todaySchedule,
        recentAssessments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY TIMETABLE ───────── */

export const getMyTimetable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const schedule = await SubjectSchedule.find({ teacher: teacher._id, isActive: true })
      .populate('subject', 'name code shortName')
      .populate('section', 'name grade stream')
      .sort({ dayOfWeek: 1, startTime: 1 });

    const dayOrder: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    schedule.sort((a, b) => (dayOrder[a.dayOfWeek] || 0) - (dayOrder[b.dayOfWeek] || 0) || a.startTime.localeCompare(b.startTime));

    const grouped: Record<string, any[]> = {};
    for (const slot of schedule) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek].push(slot);
    }

    const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true })
      .populate('section', 'name grade')
      .populate('subject', 'name code');

    const totalPeriods = assignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);

    res.json({
      success: true,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        timetable: grouped,
        assignments,
        totalPeriods,
        workloadStatus: totalPeriods > 30 ? 'Overloaded' : totalPeriods < 15 && assignments.length > 0 ? 'Underloaded' : 'Normal',
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY SECTIONS ───────── */

export const getMySections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true })
      .populate('section', 'name grade stream academicYear')
      .populate('subject', 'name code shortName');

    const sectionMap: Record<string, any> = {};
    for (const a of assignments) {
      const sec = a.section as any;
      if (!sec?._id) continue;
      const key = sec._id.toString();
      if (!sectionMap[key]) {
        const studentCount = await Student.countDocuments({ section: sec._id, status: 'Active' });
        sectionMap[key] = {
          _id: sec._id,
          name: sec.name,
          grade: sec.grade,
          stream: sec.stream,
          academicYear: sec.academicYear,
          subjects: [],
          studentCount,
        };
      }
      sectionMap[key].subjects.push({ _id: a.subject?._id, name: a.subject?.name, code: a.subject?.code, periodsPerWeek: a.periodsPerWeek });
    }

    res.json({
      success: true,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        sections: Object.values(sectionMap),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY SECTION STUDENTS ───────── */

export const getMySectionStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { sectionId } = req.params;
    const teacher = await findTeacherByUserId(req.user.id);

    const isAssigned = await TeacherAssignment.findOne({
      teacher: teacher._id, section: sectionId, isActive: true,
    });
    if (!isAssigned) {
      throw new ApiError(403, 'You are not assigned to this section');
    }

    const [students, section, assignments] = await Promise.all([
      Student.find({ section: sectionId, status: 'Active' })
        .populate('userId', 'username')
        .sort({ firstName: 1 }),
      Section.findById(sectionId),
      TeacherAssignment.find({ teacher: teacher._id, section: sectionId, isActive: true })
        .populate('subject', 'name code shortName'),
    ]);

      res.json({
        success: true,
        data: {
          section: { _id: section?._id, name: section?.name, grade: section?.grade, stream: section?.stream, academicYear: section?.academicYear },
          subjects: assignments.map((a) => a.subject),
          students,
          totalStudents: students.length,
        },
      });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY SECTION ATTENDANCE ───────── */

export const getMySectionAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { sectionId } = req.params;
    const teacher = await findTeacherByUserId(req.user.id);

    const isAssigned = await TeacherAssignment.findOne({
      teacher: teacher._id, section: sectionId, isActive: true,
    });
    if (!isAssigned) {
      throw new ApiError(403, 'You are not assigned to this section');
    }

    const { date, from, to } = req.query;
    const filter: any = { section: sectionId };
    if (date) {
      const d = new Date(String(date));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    } else if (from && to) {
      filter.date = { $gte: new Date(String(from)), $lte: new Date(String(to)) };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.date = { $gte: today };
    }

    const records = await Attendance.find(filter)
      .populate('student', 'studentId firstName lastName')
      .populate('subject', 'name')
      .sort({ date: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY SUBJECTS ───────── */

export const getMySubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true })
      .populate('section', 'name grade')
      .populate('subject', 'name code shortName');

    const subjectMap: Record<string, any> = {};
    for (const a of assignments) {
      const sub = a.subject as any;
      if (!sub?._id) continue;
      const key = sub._id.toString();
      if (!subjectMap[key]) {
        subjectMap[key] = {
          _id: sub._id, name: sub.name, code: sub.code, shortName: sub.shortName,
          sections: [], totalPeriods: 0,
        };
      }
      subjectMap[key].sections.push({ _id: a.section?._id, name: a.section?.name, grade: a.section?.grade, periodsPerWeek: a.periodsPerWeek });
      subjectMap[key].totalPeriods += (a.periodsPerWeek || 0);
    }

    res.json({
      success: true,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        subjects: Object.values(subjectMap),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY ASSESSMENTS (for marks entry) ───────── */

export const getMyAssessments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const { subject, section: sectionQ, status, limit = 50 } = req.query;
    const filter: any = { teacher: teacher._id };
    if (subject) filter.subject = subject;
    if (sectionQ) filter.section = sectionQ;
    if (status) filter.status = status;

    const assessments = await Assessment.find(filter)
      .populate('subject', 'name code shortName')
      .populate('section', 'name grade')
      .sort({ date: -1 })
      .limit(Number(limit));

    const result = await Promise.all(assessments.map(async (a) => {
      const markCount = await AssessmentMark.countDocuments({ assessment: a._id });
      const studentCount = await Student.countDocuments({ section: a.section, status: 'Active' });
      return { ...a.toObject(), markCount, studentCount };
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY MARKS ───────── */

export const getMyMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const { assessment: assessmentId } = req.query;
    if (!assessmentId) throw new ApiError(400, 'Assessment ID required');

    const assessment = await Assessment.findOne({ _id: assessmentId, teacher: teacher._id });
    if (!assessment) throw new ApiError(404, 'Assessment not found or not yours');

    const [marks, students] = await Promise.all([
      AssessmentMark.find({ assessment: assessment._id })
        .populate('student', 'studentId firstName lastName'),
      Student.find({ section: assessment.section, status: 'Active' }).sort({ firstName: 1 }),
    ]);

    const markMap: Record<string, any> = {};
    for (const m of marks) {
      const s = m.student as any;
      if (s?._id) markMap[s._id.toString()] = m;
    }

    res.json({
      success: true,
      data: {
        assessment,
        marks,
        students,
        markMap,
        totalEntered: marks.length,
        totalStudents: students.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const saveMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const { assessment: assessmentId, marks } = req.body;
    if (!assessmentId || !marks) throw new ApiError(400, 'Assessment ID and marks required');

    const assessment = await Assessment.findOne({ _id: assessmentId, teacher: teacher._id });
    if (!assessment) throw new ApiError(404, 'Assessment not found or not yours');

    const results: { student: string; marksObtained: number; status: string }[] = [];

    for (const entry of marks) {
      const { studentId, marksObtained, remarks } = entry;
      if (marksObtained === undefined || marksObtained === null) continue;

      const student = await Student.findById(studentId);
      if (!student) continue;

      const existing = await AssessmentMark.findOne({ assessment: assessmentId, student: studentId });

      if (existing) {
        // Calculate derived fields
        const pct = Math.round((marksObtained / assessment.totalMarks) * 100);
        let letterGrade: LetterGrade, gradePoint: number;
        if (pct >= 90) { letterGrade = LetterGrade.A; gradePoint = 4.0; }
        else if (pct >= 80) { letterGrade = LetterGrade.B; gradePoint = 3.0; }
        else if (pct >= 70) { letterGrade = LetterGrade.C; gradePoint = 2.0; }
        else if (pct >= 60) { letterGrade = LetterGrade.D; gradePoint = 1.0; }
        else { letterGrade = LetterGrade.F; gradePoint = 0.0; }

        existing.marksObtained = marksObtained;
        existing.percentage = pct;
        existing.letterGrade = letterGrade;
        existing.gradePoint = gradePoint;
        existing.remarks = remarks || existing.remarks;
        existing.modifiedBy = req.user.id;
        await existing.save();
        results.push({ student: studentId, marksObtained, status: 'updated' });
      } else {
        // Calculate derived fields
        const pct = Math.round((marksObtained / assessment.totalMarks) * 100);
        let letterGrade: LetterGrade, gradePoint: number;
        if (pct >= 90) { letterGrade = LetterGrade.A; gradePoint = 4.0; }
        else if (pct >= 80) { letterGrade = LetterGrade.B; gradePoint = 3.0; }
        else if (pct >= 70) { letterGrade = LetterGrade.C; gradePoint = 2.0; }
        else if (pct >= 60) { letterGrade = LetterGrade.D; gradePoint = 1.0; }
        else { letterGrade = LetterGrade.F; gradePoint = 0.0; }

        await AssessmentMark.create({
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
        results.push({ student: studentId, marksObtained, status: 'created' });
      }
    }

    await assessment.save();

    res.json({
      success: true,
      message: `${results.length} marks saved`,
      data: { results, total: results.length },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY PERFORMANCE ───────── */

export const getMyPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true })
      .populate('subject', 'name code')
      .populate('section', 'name grade');

    const attendance = teacher.attendance || [];
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const totalPeriods = assignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);

    const assessments = await Assessment.find({ teacher: teacher._id, status: AssessmentStatus.PUBLISHED })
      .populate('subject', 'name code')
      .populate('section', 'name grade');

    let totalMarks = 0;
    let totalPercentage = 0;
    for (const a of assessments) {
      const marks = await AssessmentMark.find({ assessment: a._id });
      for (const m of marks) {
        totalMarks++;
        totalPercentage += m.percentage || 0;
      }
    }
    const avgStudentScore = totalMarks > 0 ? Math.round((totalPercentage / totalMarks) * 10) / 10 : 0;

    const sectionIds = [...new Set(assignments.map((a) => a.section?._id?.toString()).filter(Boolean))];
    const totalStudents = await Student.countDocuments({ section: { $in: sectionIds }, status: 'Active' });

    res.json({
      success: true,
      data: {
        teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName },
        performanceMetrics: teacher.performanceMetrics || {},
        attendance: { totalDays, presentDays, attendanceRate },
        workload: { totalPeriods, totalAssignments: assignments.length, totalStudents },
        academic: {
          avgStudentScore,
          totalAssessments: assessments.length,
          assessments,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── MY REPORTS ───────── */

export const getMyReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const { type } = req.params;

    switch (type) {
      case 'subject-assignment': {
        const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true })
          .populate('subject', 'name code shortName')
          .populate('section', 'name grade stream');
        res.json({ success: true, data: { teacher: { id: teacher.teacherId, name: teacher.fullName }, assignments } });
        break;
      }
      case 'workload': {
        const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true })
          .populate('subject', 'name code')
          .populate('section', 'name grade');
        const totalPeriods = assignments.reduce((s, a) => s + (a.periodsPerWeek || 0), 0);
        const sectionIds = [...new Set(assignments.map((a) => a.section?._id?.toString()).filter(Boolean))];
        const totalStudents = await Student.countDocuments({ section: { $in: sectionIds }, status: 'Active' });
        res.json({
          success: true,
          data: {
            teacher: { id: teacher.teacherId, name: teacher.fullName },
            totalSubjects: [...new Set(assignments.map((a) => a.subject?._id?.toString()))].length,
            totalSections: sectionIds.length,
            totalStudents,
            totalPeriods,
            status: totalPeriods > 30 ? 'Overloaded' : totalPeriods < 15 ? 'Underloaded' : 'Normal',
            assignments,
          },
        });
        break;
      }
      case 'attendance': {
        const attendance = teacher.attendance || [];
        const totalDays = attendance.length;
        const presentDays = attendance.filter((a) => a.status === 'Present').length;
        const lateDays = attendance.filter((a) => a.status === 'Late').length;
        const absentDays = attendance.filter((a) => a.status === 'Absent').length;
        const leaveDays = attendance.filter((a) => a.status === 'On Leave').length;
        res.json({
          success: true,
          data: {
            teacher: { id: teacher.teacherId, name: teacher.fullName },
            summary: { totalDays, presentDays, lateDays, absentDays, leaveDays, attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0 },
            records: attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          },
        });
        break;
      }
      case 'academic-performance': {
        const assessments = await Assessment.find({ teacher: teacher._id, status: AssessmentStatus.PUBLISHED })
          .populate('subject', 'name code')
          .populate('section', 'name grade');
        let totalMarks = 0;
        let totalPassing = 0;
        let totalFailing = 0;
        const subjectStats: Record<string, { total: number; pass: number; fail: number; sum: number }> = {};
        for (const a of assessments) {
          const marks = await AssessmentMark.find({ assessment: a._id });
          const subKey = a.subject?._id?.toString() || 'unknown';
          if (!subjectStats[subKey]) subjectStats[subKey] = { total: 0, pass: 0, fail: 0, sum: 0 };
          for (const m of marks) {
            subjectStats[subKey].total++;
            subjectStats[subKey].sum += m.percentage || 0;
            if ((m.percentage || 0) >= 50) { totalPassing++; subjectStats[subKey].pass++; }
            else { totalFailing++; subjectStats[subKey].fail++; }
            totalMarks++;
          }
        }
        const subjectAverages = Object.entries(subjectStats).map(([id, stats]) => ({
          subject: assessments.find((a) => a.subject?._id?.toString() === id)?.subject || { name: 'Unknown' },
          average: stats.total > 0 ? Math.round((stats.sum / stats.total) * 10) / 10 : 0,
          passRate: stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0,
          totalStudents: stats.total,
        }));
        res.json({
          success: true,
          data: {
            teacher: { id: teacher.teacherId, name: teacher.fullName },
            overall: {
              totalAssessments: assessments.length,
              totalMarks,
              passRate: totalMarks > 0 ? Math.round((totalPassing / totalMarks) * 100) : 0,
              failureRate: totalMarks > 0 ? Math.round((totalFailing / totalMarks) * 100) : 0,
            },
            subjectAverages,
          },
        });
        break;
      }
      default:
        throw new ApiError(400, `Unknown report type: ${type}. Available: subject-assignment, workload, attendance, academic-performance`);
    }
  } catch (error) {
    next(error);
  }
};

/* ───────── RECORD MY OWN ATTENDANCE ───────── */

export const recordMyAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const { checkIn, checkOut, status, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingIdx = teacher.attendance.findIndex(
      (a) => new Date(a.date).toDateString() === today.toDateString()
    );

    const record = { date: today, checkIn, checkOut, status: status || 'Present', notes };
    if (existingIdx >= 0) {
      teacher.attendance[existingIdx] = { ...teacher.attendance[existingIdx].toObject(), ...record };
    } else {
      teacher.attendance.push(record as any);
    }

    await teacher.save();
    res.json({ success: true, message: 'Attendance recorded', data: teacher.attendance });
  } catch (error) {
    next(error);
  }
};

/* ───────── TEACHER TRAINING ───────── */

export const addTraining = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    teacher.trainings.push(req.body);
    await teacher.save();
    res.json({ success: true, message: 'Training added', data: teacher.trainings });
  } catch (error) { next(error); }
};

export const getTrainings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).select('trainings');
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    res.json({ success: true, data: teacher.trainings });
  } catch (error) { next(error); }
};

export const deleteTraining = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, trainingId } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    const idx = teacher.trainings.findIndex((t: any) => t._id.toString() === trainingId);
    if (idx === -1) throw new ApiError(404, 'Training not found');
    teacher.trainings.splice(idx, 1);
    await teacher.save();
    res.json({ success: true, message: 'Training deleted', data: teacher.trainings });
  } catch (error) { next(error); }
};

/* ───────── TEACHER DISCIPLINARY ───────── */

export const addDisciplinaryRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    teacher.disciplinaryRecords.push({ ...req.body, issuedBy: req.user.id });
    await teacher.save();
    res.json({ success: true, message: 'Disciplinary record added', data: teacher.disciplinaryRecords });
  } catch (error) { next(error); }
};

export const getDisciplinaryRecords = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).select('disciplinaryRecords');
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    res.json({ success: true, data: teacher.disciplinaryRecords });
  } catch (error) { next(error); }
};

export const updateDisciplinaryStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, recordId } = req.params;
    const { status, resolution } = req.body;
    const teacher = await Teacher.findById(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    const record = teacher.disciplinaryRecords.find((r: any) => r._id.toString() === recordId);
    if (!record) throw new ApiError(404, 'Disciplinary record not found');
    record.status = status || record.status;
    if (resolution) record.resolution = resolution;
    await teacher.save();
    res.json({ success: true, message: 'Status updated', data: teacher.disciplinaryRecords });
  } catch (error) { next(error); }
};

/* ───────── TEACHER TIMETABLE (ADMIN) ───────── */

export const getTeacherTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).populate('subjects', 'code name');
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    const schedule = await mongoose.model('SubjectSchedule').find({
      teacher: id,
      isActive: true,
    }).populate('subject', 'name code').populate('section', 'name grade').populate('classroom', 'roomNumber').sort({ dayOfWeek: 1, startTime: 1 });
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timetable = days.map((day) => ({
      day,
      periods: schedule.filter((s: any) => s.dayOfWeek === day.toLowerCase()),
    }));
    res.json({ success: true, data: { teacher: { teacherId: teacher.teacherId, fullName: teacher.fullName }, timetable } });
  } catch (error) { next(error); }
};

/* ───────── MY SECTION-SUBJECT PAIRS (for assessment creation) ───────── */

export const getMySectionSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const teacher = await findTeacherByUserId(req.user.id);

    const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true })
      .populate('section', 'name grade stream academicYear')
      .populate('subject', 'name code shortName');

    const sectionMap: Record<string, any> = {};
    for (const a of assignments) {
      const sec = a.section as any;
      if (!sec?._id) continue;
      const key = sec._id.toString();
      if (!sectionMap[key]) {
        sectionMap[key] = {
          _id: sec._id,
          name: sec.name,
          grade: sec.grade,
          stream: sec.stream,
          academicYear: sec.academicYear,
          subjects: [],
        };
      }
      sectionMap[key].subjects.push({
        _id: a.subject?._id,
        name: a.subject?.name,
        code: a.subject?.code,
        periodsPerWeek: a.periodsPerWeek,
      });
    }

    res.json({
      success: true,
      data: { sections: Object.values(sectionMap) },
    });
  } catch (error) { next(error); }
};

/* ───────── MY SECTION ASSESSMENTS ───────── */

export const getMySectionAssessments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { sectionId } = req.params;
    const teacher = await findTeacherByUserId(req.user.id);

    const isAssigned = await TeacherAssignment.findOne({
      teacher: teacher._id, section: sectionId, isActive: true,
    });
    if (!isAssigned) {
      throw new ApiError(403, 'You are not assigned to this section');
    }

    const [assessments, section, assignments] = await Promise.all([
      Assessment.find({ teacher: teacher._id, section: sectionId })
        .populate('subject', 'name code shortName')
        .populate('section', 'name grade')
        .sort({ date: -1 }),
      Section.findById(sectionId),
      TeacherAssignment.find({ teacher: teacher._id, section: sectionId, isActive: true })
        .populate('subject', 'name code shortName'),
    ]);

    const enriched = await Promise.all(assessments.map(async (a) => {
      const markCount = await AssessmentMark.countDocuments({ assessment: a._id });
      return { ...a.toObject(), markCount };
    }));

    res.json({
      success: true,
      data: {
        section: { _id: section?._id, name: section?.name, grade: section?.grade, academicYear: section?.academicYear },
        subjects: assignments.map((a) => a.subject),
        assessments: enriched,
      },
    });
  } catch (error) { next(error); }
};
