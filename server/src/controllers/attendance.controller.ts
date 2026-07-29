import { Response, NextFunction } from 'express';
import { Attendance } from '../models/Attendance.model';
import { AttendanceCorrection } from '../models/AttendanceCorrection.model';
import { Section } from '../models/Section.model';
import { Student } from '../models/Student.model';
import { Guardian } from '../models/Guardian.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/errorHandler';
import { UserRole, AttendanceStatus } from '../types';

export const markAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sectionId, date, records } = req.body;
    if (!sectionId || !date || !records?.length) {
      res.status(400).json({ success: false, message: 'Section, date, and records are required' });
      return;
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      res.status(404).json({ success: false, message: 'Section not found' });
      return;
    }

    // Validate each student exists and belongs to this section
    const studentIds = records.map((r: any) => r.student);
    const students = await Student.find({ _id: { $in: studentIds } }).select('_id section');
    if (students.length !== studentIds.length) {
      res.status(400).json({ success: false, message: 'One or more students not found' });
      return;
    }
    const invalidStudents = students.filter(
      (s) => s.section?.toString() !== sectionId
    );
    if (invalidStudents.length > 0) {
      res.status(400).json({ success: false, message: 'Some students do not belong to this section' });
      return;
    }

    const attendanceDate = new Date(date);
    const ops = records.map((r: any) => ({
      updateOne: {
        filter: { student: r.student, date: attendanceDate },
        update: {
          $set: {
            student: r.student,
            section: sectionId,
            date: attendanceDate,
            status: r.status || 'Present',
            arrivalTime: r.arrivalTime ?? undefined,
            lateReason: r.lateReason ?? undefined,
            remarks: r.remarks ?? '',
            markedBy: req.user?.id,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);

    const saved = await Attendance.find({ section: sectionId, date: attendanceDate })
      .populate('student', 'firstName lastName studentId')
      .populate('section', 'name grade stream');

    res.status(200).json({ success: true, data: saved, message: 'Attendance saved successfully' });
  } catch (error) {
    next(error);
  }
};

export const listAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { section, date, startDate, endDate, student, status, limit = 50, page = 1 } = req.query;
    const query: any = {};

    if (section) query.section = section;
    if (student) query.student = student;
    if (status) query.status = status;

    if (date) {
      const d = new Date(date as string);
      query.date = { $gte: new Date(new Date(d).setHours(0, 0, 0, 0)), $lte: new Date(new Date(d).setHours(23, 59, 59, 999)) };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1, student: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('student', 'firstName lastName studentId'),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: { records, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionAttendanceSheet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, dateStr } = req.params;
    const query: any = { section: id };
    if (dateStr) {
      const d = new Date(dateStr);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(new Date(dateStr).setHours(23, 59, 59, 999));
      query.date = { $gte: start, $lte: end };
    }
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('student', 'firstName lastName studentId')
      .populate('section', 'name grade stream');
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

export const deleteAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await Attendance.findByIdAndDelete(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Attendance record not found' });
      return;
    }
    await AttendanceCorrection.deleteMany({ attendance: id });
    res.status(200).json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks, arrivalTime, lateReason } = req.body;
    const update: any = { markedBy: req.user?.id };
    if (status !== undefined) update.status = status;
    if (remarks !== undefined) update.remarks = remarks;
    if (arrivalTime !== undefined) update.arrivalTime = arrivalTime;
    if (lateReason !== undefined) update.lateReason = lateReason;

    const record = await Attendance.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate('student', 'firstName lastName studentId');
    if (!record) {
      res.status(404).json({ success: false, message: 'Attendance record not found' });
      return;
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await Student.findOne({ userId: req.user?.id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }
    const records = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .populate('section', 'name grade stream');

    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const excused = records.filter((r) => r.status === 'Excused').length;
    const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

    res.status(200).json({
      success: true,
      data: { records, summary: { total, present, absent, late, excused, rate } },
    });
  } catch (error) {
    next(error);
  }
};

export const getChildrenAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const guardian = await Guardian.findOne({ userId: req.user?.id }).populate('students');
    if (!guardian || !guardian.students?.length) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const studentIds = guardian.students.map((s: any) => s._id);
    const results = await Promise.all(
      studentIds.map(async (sid: any) => {
        const records = await Attendance.find({ student: sid })
          .sort({ date: -1 })
          .populate('student', 'firstName lastName studentId section')
.populate('section', 'name grade stream');

        const total = records.length;
        const present = records.filter((r) => r.status === 'Present').length;
        const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
        return { records, summary: { total, present, rate } };
      })
    );

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const records = await Attendance.find({ student: id })
      .sort({ date: -1 })
      .populate('section', 'name grade stream');

    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const excused = records.filter((r) => r.status === 'Excused').length;
    const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

    res.status(200).json({
      success: true,
      data: { records, summary: { total, present, absent, late, excused, rate } },
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionAttendanceSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id || req.query.section;
    const { startDate, endDate } = req.query;
    if (!id) {
      res.status(400).json({ success: false, message: 'Section ID is required' });
      return;
    }
    const match: any = { section: id };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate as string);
      if (endDate) match.date.$lte = new Date(endDate as string);
    }

    const summary = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const students = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$student',
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'Excused'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          attendanceRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { attendanceRate: 1 } },
      {
        $project: {
          _id: 0,
          studentId: '$studentInfo.studentId',
          firstName: '$studentInfo.firstName',
          lastName: '$studentInfo.lastName',
          present: 1,
          absent: 1,
          late: 1,
          excused: 1,
          total: 1,
          attendanceRate: 1,
        },
      },
    ]);

    const totalDays = (await Attendance.distinct('date', match)).length;
    const chronicAbsentees = students.filter((s: any) => s.attendanceRate < 75).length;
    const sectionRate =
      students.length > 0
        ? Math.round((students.reduce((sum: number, s: any) => sum + s.attendanceRate, 0) / students.length) * 10) / 10
        : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: { totalDays, sectionRate, chronicAbsentees, statusBreakdown: summary },
        students,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSchoolAttendanceSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const match: any = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate as string);
      if (endDate) match.date.$lte = new Date(endDate as string);
    }

    const totalRecords = await Attendance.countDocuments(match);
    const statusBreakdown = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const totalStudents = (await Attendance.distinct('student', match)).length;
    const totalDays = (await Attendance.distinct('date', match)).length;

    const gradeSummary = await Attendance.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'sections',
          localField: 'section',
          foreignField: '_id',
          as: 'sectionInfo',
        },
      },
      { $unwind: '$sectionInfo' },
      {
        $group: {
          _id: '$sectionInfo.grade',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
        },
      },
    ]);

    const chronicAbsentees = await Attendance.aggregate([
      { $match: { ...match, status: 'Absent' } },
      { $group: { _id: '$student', absentCount: { $sum: 1 } } },
      { $match: { absentCount: { $gte: 5 } } },
      { $count: 'count' },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        totalStudents,
        totalDays,
        statusBreakdown,
        gradeSummary,
        chronicAbsentees: chronicAbsentees[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChronicAbsentees = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const results = await Attendance.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        },
      },
      { $match: { $expr: { $gte: [{ $divide: ['$absent', '$total'] }, 0.25] } } },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 0,
          studentId: '$student.studentId',
          firstName: '$student.firstName',
          lastName: '$student.lastName',
          totalClasses: '$total',
          absentDays: '$absent',
          attendanceRate: { $round: [{ $multiply: [{ $subtract: [1, { $divide: ['$absent', '$total'] }] }, 100] }, 1] },
        },
      },
      { $sort: { attendanceRate: 1 } },
    ]);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const requestCorrection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { attendance: attendanceId, reason, requestedStatus } = req.body;
    if (!attendanceId || !reason || !requestedStatus) {
      res.status(400).json({ success: false, message: 'Attendance ID, reason, and requested status are required' });
      return;
    }

    const record = await Attendance.findById(attendanceId);
    if (!record) {
      res.status(404).json({ success: false, message: 'Attendance record not found' });
      return;
    }

    const existing = await AttendanceCorrection.findOne({ attendance: attendanceId, status: 'Pending' });
    if (existing) {
      res.status(400).json({ success: false, message: 'A pending correction request already exists for this record' });
      return;
    }

    const correction = await AttendanceCorrection.create({
      attendance: attendanceId,
      student: record.student,
      section: record.section,
      date: record.date,
      originalStatus: record.status,
      requestedStatus,
      reason,
      requestedBy: req.user?.id,
    });

    const populated = await AttendanceCorrection.findById(correction._id)
      .populate('requestedBy', 'firstName lastName')
      .populate({ path: 'attendance', populate: { path: 'student', select: 'firstName lastName studentId' } });

    res.status(201).json({ success: true, data: populated, message: 'Correction request submitted' });
  } catch (error) {
    next(error);
  }
};

export const listCorrections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, section, limit = 50, page = 1 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (section) query.section = section;

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      AttendanceCorrection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('requestedBy', 'firstName lastName')
        .populate('reviewedBy', 'firstName lastName')
        .populate({ path: 'attendance', populate: { path: 'student', select: 'firstName lastName studentId' } }),
      AttendanceCorrection.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: { records, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const reviewCorrection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be Approved or Rejected' });
      return;
    }

    const correction = await AttendanceCorrection.findById(id);
    if (!correction) {
      res.status(404).json({ success: false, message: 'Correction request not found' });
      return;
    }
    if (correction.status !== 'Pending') {
      res.status(400).json({ success: false, message: 'Correction request has already been reviewed' });
      return;
    }

    correction.status = status;
    correction.reviewedBy = req.user?.id as any;
    if (reviewNotes) correction.reviewNotes = reviewNotes;
    await correction.save();

    if (status === 'Approved') {
      await Attendance.findByIdAndUpdate(correction.attendance, {
        status: correction.requestedStatus,
        markedBy: req.user?.id as any,
      });
    }

    const populated = await AttendanceCorrection.findById(correction._id)
      .populate('requestedBy', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName')
      .populate({ path: 'attendance', populate: { path: 'student', select: 'firstName lastName studentId' } });

    res.status(200).json({ success: true, data: populated, message: `Correction ${status.toLowerCase()}` });
  } catch (error) {
    next(error);
  }
};

export const getTodayDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const todayRecords = await Attendance.find({ date: { $gte: start, $lte: end } });
    const totalMarked = todayRecords.length;
    const presentCount = todayRecords.filter((r) => r.status === 'Present').length;
    const absentCount = todayRecords.filter((r) => r.status === 'Absent').length;
    const lateCount = todayRecords.filter((r) => r.status === 'Late').length;
    const excusedCount = todayRecords.filter((r) => r.status === 'Excused').length;

    res.status(200).json({
      success: true,
      data: {
        totalMarked,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        presentRate: totalMarked > 0 ? Math.round((presentCount / totalMarked) * 1000) / 10 : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
