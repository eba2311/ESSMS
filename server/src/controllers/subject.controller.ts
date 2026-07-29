import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Subject, SubjectAssignment, SubjectResource, SubjectMaterial, SubjectSchedule, AuditLog, Section } from '../models';
import { TeacherAssignment } from '../models/TeacherAssignment.model';
import { Student } from '../models/Student.model';
import { AssessmentMark } from '../models/AssessmentMark.model';
import { ApiError } from '../middleware/errorHandler';

/* ───────── SUBJECT CRUD ───────── */

export const createSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { code, name, shortName, subjectType, department, grades, streams, isCore, description, academicYear, semester, weeklyPeriods } = req.body;
    if (!code || !name) throw new ApiError(400, 'Code and name are required');
    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) throw new ApiError(400, 'Subject code already exists');
    const subject = await Subject.create({
      code: code.toUpperCase(), name, shortName, subjectType, department, grades, streams,
      isCore: isCore ?? true, description, academicYear, semester, weeklyPeriods, status: 'Active',
    });
    await AuditLog.create({ userId: req.user.id, activityType: 'SUBJECT_CREATE', description: `Subject ${code} created`, ipAddress: req.ip });
    res.status(201).json({ success: true, data: subject });
  } catch (error) { next(error); }
};

export const listSubjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { grade, stream, status, search, type, department: dept, academicYear, semester, page = 1, limit = 100 } = req.query;
    const filter: any = {};
    if (grade) filter.grades = Number(grade);
    if (stream) filter.streams = stream;
    if (status) filter.status = status;
    if (type) filter.subjectType = type;
    if (dept) filter.department = dept;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = Number(semester);
    if (search) {
      const re = new RegExp(String(search), 'i');
      filter.$or = [{ code: re }, { name: re }, { shortName: re }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [subjects, total] = await Promise.all([
      Subject.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)),
      Subject.countDocuments(filter),
    ]);
    res.json({ success: true, data: { subjects, pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) } } });
  } catch (error) { next(error); }
};

export const getSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) throw new ApiError(404, 'Subject not found');
    const [assignments, resources, materials, teacherAssignments, schedule, studentCount] = await Promise.all([
      SubjectAssignment.find({ subject: subject._id }).populate('section', 'name grade').populate('teacher', 'firstName lastName'),
      SubjectResource.find({ subject: subject._id }),
      SubjectMaterial.find({ subject: subject._id }).populate('uploadedBy', 'firstName lastName'),
      TeacherAssignment.find({ subject: subject._id, isActive: true }).populate('teacher', 'firstName lastName').populate('section', 'name grade'),
      SubjectSchedule.find({ subject: subject._id, isActive: true }).populate('section', 'name grade').populate('teacher', 'firstName lastName').sort({ dayOfWeek: 1, startTime: 1 }),
      Student.countDocuments({ 'subjects': subject._id, status: 'Active' }),
    ]);
    res.json({ success: true, data: { ...subject.toObject(), assignments, resources, materials, teacherAssignments, schedule, studentCount } });
  } catch (error) { next(error); }
};

export const updateSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const allowed = ['name', 'shortName', 'subjectType', 'department', 'grades', 'streams', 'isCore', 'description', 'academicYear', 'semester', 'weeklyPeriods'];
    const updates: any = {};
    for (const k of allowed) { if (req.body[k] !== undefined) updates[k] = req.body[k]; }
    const subject = await Subject.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!subject) throw new ApiError(404, 'Subject not found');
    await AuditLog.create({ userId: req.user.id, activityType: 'SUBJECT_UPDATE', description: `Subject ${subject.code} updated`, ipAddress: req.ip });
    res.json({ success: true, data: subject });
  } catch (error) { next(error); }
};

export const deleteSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) throw new ApiError(404, 'Subject not found');
    await Promise.all([
      SubjectAssignment.deleteMany({ subject: subject._id }),
      SubjectResource.deleteMany({ subject: subject._id }),
      SubjectMaterial.deleteMany({ subject: subject._id }),
      TeacherAssignment.deleteMany({ subject: subject._id }),
    ]);
    await AuditLog.create({ userId: req.user.id, activityType: 'SUBJECT_DELETE', description: `Subject ${subject.code} deleted`, ipAddress: req.ip });
    res.json({ success: true, message: 'Subject and all related data deleted' });
  } catch (error) { next(error); }
};

export const toggleSubjectStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { status } = req.body;
    if (!['Active', 'Inactive', 'Archived'].includes(status)) throw new ApiError(400, 'Invalid status');
    const subject = await Subject.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!subject) throw new ApiError(404, 'Subject not found');
    res.json({ success: true, data: subject });
  } catch (error) { next(error); }
};

/* ───────── ASSIGNMENTS ───────── */

export const createAssignment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, gradeLevel, section, teacher, academicYear } = req.body;
    if (!subject || !gradeLevel || !academicYear) throw new ApiError(400, 'Subject, gradeLevel, and academicYear are required');
    const existing = await SubjectAssignment.findOne({ subject, gradeLevel, section: section || null, academicYear });
    if (existing) throw new ApiError(400, 'Assignment already exists');
    const assignment = await SubjectAssignment.create({ subject, gradeLevel, section, teacher, academicYear, status: 'Active' });
    const populated = await SubjectAssignment.findById(assignment._id)
      .populate('subject', 'code name')
      .populate('section', 'name grade')
      .populate('teacher', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

export const listAssignments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, gradeLevel, section, teacher, academicYear, status } = req.query;
    const filter: any = {};
    if (subject) filter.subject = subject;
    if (gradeLevel) filter.gradeLevel = Number(gradeLevel);
    if (section) filter.section = section;
    if (teacher) filter.teacher = teacher;
    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;
    const assignments = await SubjectAssignment.find(filter)
      .populate('subject', 'code name shortName')
      .populate('section', 'name grade')
      .populate('teacher', 'firstName lastName')
      .sort({ gradeLevel: 1 });
    res.json({ success: true, data: assignments });
  } catch (error) { next(error); }
};

export const deleteAssignment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignment = await SubjectAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) throw new ApiError(404, 'Assignment not found');
    await TeacherAssignment.deleteMany({ subject: assignment.subject, section: assignment.section });
    res.json({ success: true, message: 'Assignment removed' });
  } catch (error) { next(error); }
};

export const copyAssignments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fromGrade, toGrade, academicYear } = req.body;
    if (!fromGrade || !toGrade || !academicYear) throw new ApiError(400, 'fromGrade, toGrade, and academicYear required');
    const source = await SubjectAssignment.find({ gradeLevel: fromGrade, academicYear, status: 'Active' });
    let copied = 0;
    for (const s of source) {
      const exists = await SubjectAssignment.findOne({ subject: s.subject, gradeLevel: toGrade, academicYear });
      if (!exists) {
        await SubjectAssignment.create({ subject: s.subject, gradeLevel: toGrade, academicYear, status: 'Active' });
        copied++;
      }
    }
    res.json({ success: true, data: { copied, total: source.length }, message: `Copied ${copied} subjects from Grade ${fromGrade} to Grade ${toGrade}` });
  } catch (error) { next(error); }
};

/* ───────── RESOURCES ───────── */

export const createResource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resource = await SubjectResource.create({ ...req.body, status: req.body.status || 'Available' });
    const populated = await SubjectResource.findById(resource._id).populate('subject', 'code name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

export const listResources = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, type: resType } = req.query;
    const filter: any = {};
    if (subject) filter.subject = subject;
    if (resType) filter.type = resType;
    const resources = await SubjectResource.find(filter).populate('subject', 'code name').sort({ name: 1 });
    res.json({ success: true, data: resources });
  } catch (error) { next(error); }
};

export const updateResource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resource = await SubjectResource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!resource) throw new ApiError(404, 'Resource not found');
    res.json({ success: true, data: resource });
  } catch (error) { next(error); }
};

export const deleteResource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resource = await SubjectResource.findByIdAndDelete(req.params.id);
    if (!resource) throw new ApiError(404, 'Resource not found');
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) { next(error); }
};

/* ───────── MATERIALS ───────── */

export const createMaterial = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const material = await SubjectMaterial.create({ ...req.body, uploadedBy: req.user.id });
    const populated = await SubjectMaterial.findById(material._id)
      .populate('subject', 'code name')
      .populate('uploadedBy', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

export const listMaterials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, section, type: matType } = req.query;
    const filter: any = {};
    if (subject) filter.subject = subject;
    if (section) filter.section = section;
    if (matType) filter.type = matType;
    const materials = await SubjectMaterial.find(filter)
      .populate('subject', 'code name')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: materials });
  } catch (error) { next(error); }
};

export const deleteMaterial = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const material = await SubjectMaterial.findByIdAndDelete(req.params.id);
    if (!material) throw new ApiError(404, 'Material not found');
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) { next(error); }
};

/* ───────── SCHEDULE ───────── */

export const createSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { subject, section, teacher, dayOfWeek, startTime, endTime, academicYear, semester } = req.body;
    if (!subject || !section || !dayOfWeek || !startTime || !endTime || !academicYear) {
      throw new ApiError(400, 'Missing required fields: subject, section, dayOfWeek, startTime, endTime, academicYear');
    }

    // Conflict check: same section + day + time overlap
    const conflict = await SubjectSchedule.findOne({
      section,
      dayOfWeek,
      academicYear,
      semester: semester || 1,
      isActive: true,
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
    }).populate('subject', 'code name');
    if (conflict) {
      throw new ApiError(409, `Schedule conflict with subject "${(conflict as any).subject?.code}" on ${dayOfWeek} at ${conflict.startTime}-${conflict.endTime}`);
    }

    // Conflict check: same teacher + day + time overlap
    if (teacher) {
      const teacherConflict = await SubjectSchedule.findOne({
        teacher,
        dayOfWeek,
        academicYear,
        semester: semester || 1,
        isActive: true,
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
        ],
      }).populate('subject', 'code name');
      if (teacherConflict) {
        throw new ApiError(409, `Teacher already assigned to subject "${(teacherConflict as any).subject?.code}" on ${dayOfWeek} at ${teacherConflict.startTime}-${teacherConflict.endTime}`);
      }
    }

    const schedule = await SubjectSchedule.create({ subject, section, teacher, dayOfWeek, startTime, endTime, academicYear, semester: semester || 1 });
    const populated = await SubjectSchedule.findById(schedule._id)
      .populate('subject', 'code name shortName')
      .populate('section', 'name grade')
      .populate('teacher', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

export const listSchedules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, section, teacher, dayOfWeek, academicYear, semester } = req.query;
    const filter: any = { isActive: true };
    if (subject) filter.subject = subject;
    if (section) filter.section = section;
    if (teacher) filter.teacher = teacher;
    if (dayOfWeek) filter.dayOfWeek = dayOfWeek;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = Number(semester);
    const schedules = await SubjectSchedule.find(filter)
      .populate('subject', 'code name shortName')
      .populate('section', 'name grade')
      .populate('teacher', 'firstName lastName')
      .sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ success: true, data: schedules });
  } catch (error) { next(error); }
};

export const updateSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const schedule = await SubjectSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('subject', 'code name shortName')
      .populate('section', 'name grade')
      .populate('teacher', 'firstName lastName');
    if (!schedule) throw new ApiError(404, 'Schedule entry not found');
    res.json({ success: true, data: schedule });
  } catch (error) { next(error); }
};

export const deleteSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schedule = await SubjectSchedule.findByIdAndDelete(req.params.id);
    if (!schedule) throw new ApiError(404, 'Schedule entry not found');
    res.json({ success: true, message: 'Schedule entry deleted' });
  } catch (error) { next(error); }
};

/* ───────── DASHBOARD ───────── */

export const getSubjectDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalSubjects = await Subject.countDocuments();
    const activeSubjects = await Subject.countDocuments({ status: 'Active' });
    const totalTeachers = await TeacherAssignment.distinct('teacher', { isActive: true });
    const totalSections = await SubjectAssignment.distinct('section', { status: 'Active', section: { $ne: null } });

    const typeBreakdown = await Subject.aggregate([
      { $group: { _id: '$subjectType', count: { $sum: 1 } } },
    ]);

    const gradeBreakdown = await SubjectAssignment.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$gradeLevel', subjectCount: { $addToSet: '$subject' } } },
      { $project: { grade: '$_id', count: { $size: '$subjectCount' } } },
      { $sort: { grade: 1 } },
    ]);

    const avgWeeklyPeriods = await Subject.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, avg: { $avg: '$weeklyPeriods' } } },
    ]);

    const sectionTeacherCount = await Section.countDocuments({ status: 'Active' });

    res.json({
      success: true,
      data: {
        totalSubjects,
        activeSubjects,
        assignedTeachers: totalTeachers.length,
        assignedSections: totalSections.length,
        totalSections: sectionTeacherCount,
        avgWeeklyPeriods: Math.round((avgWeeklyPeriods[0]?.avg || 0) * 10) / 10,
        typeBreakdown,
        gradeBreakdown,
      },
    });
  } catch (error) { next(error); }
};

/* ───────── REPORTS ───────── */

export const getSubjectReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) throw new ApiError(404, 'Subject not found');

    const [assignments, teacherAssignments, studentCount, resourceCount, materialCount] = await Promise.all([
      SubjectAssignment.find({ subject: subject._id, status: 'Active' }).populate('section', 'name grade'),
      TeacherAssignment.find({ subject: subject._id, isActive: true }).populate('teacher', 'firstName lastName').populate('section', 'name grade'),
      Student.countDocuments({ subjects: subject._id, status: 'Active' }),
      SubjectResource.countDocuments({ subject: subject._id }),
      SubjectMaterial.countDocuments({ subject: subject._id }),
    ]);

    const sectionsCovered = assignments.filter(a => a.section).length;
    const teachersCount = teacherAssignments.length;

    res.json({
      success: true,
      data: {
        subject: { code: subject.code, name: subject.name, subjectType: subject.subjectType, status: subject.status },
        assignments: assignments.length, sectionsCovered, teachersCount, studentCount, resourceCount, materialCount,
        gradeLevels: [...new Set(assignments.map(a => a.gradeLevel))],
      },
    });
  } catch (error) { next(error); }
};

export const getSubjectPerformanceReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, semester, gradeLevel } = req.query;
    const match: any = {};
    if (academicYear) match.academicYear = academicYear;
    if (semester) match.semester = Number(semester);
    if (gradeLevel) match['student.grade'] = Number(gradeLevel);

    const results = await AssessmentMark.aggregate([
      { $lookup: { from: 'assessments', localField: 'assessment', foreignField: '_id', as: 'assessment' } },
      { $unwind: '$assessment' },
      { $lookup: { from: 'subjects', localField: 'assessment.subject', foreignField: '_id', as: 'subject' } },
      { $unwind: '$subject' },
      { $match: { 'subject.status': 'Active' } },
      {
        $group: {
          _id: '$assessment.subject',
          code: { $first: '$subject.code' },
          name: { $first: '$subject.name' },
          totalMarks: { $sum: '$marksObtained' },
          count: { $sum: 1 },
          students: { $addToSet: '$student' },
        },
      },
      {
        $project: {
          code: 1, name: 1,
          average: { $round: [{ $divide: ['$totalMarks', '$count'] }, 1] },
          totalStudents: { $size: '$students' },
        },
      },
      { $sort: { average: -1 } },
    ]);

    const ranked = results.map((r, i) => ({ rank: i + 1, ...r }));
    res.json({ success: true, data: ranked });
  } catch (error) { next(error); }
};

export const getSubjectRankingReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, semester } = req.query;
    const results = await AssessmentMark.aggregate([
      { $lookup: { from: 'assessments', localField: 'assessment', foreignField: '_id', as: 'assessment' } },
      { $unwind: '$assessment' },
      { $lookup: { from: 'subjects', localField: 'assessment.subject', foreignField: '_id', as: 'subject' } },
      { $unwind: '$subject' },
      { $match: { 'subject.status': 'Active' } },
      {
        $group: {
          _id: '$assessment.subject',
          code: { $first: '$subject.code' },
          name: { $first: '$subject.name' },
          avgMark: { $avg: '$marksObtained' },
          totalStudents: { $addToSet: '$student' },
        },
      },
      {
        $project: {
          code: 1, name: 1,
          avgMark: { $round: ['$avgMark', 1] },
          totalStudents: { $size: '$totalStudents' },
        },
      },
      { $sort: { avgMark: -1 } },
    ]);

    const ranked = results.map((r, i) => ({ rank: i + 1, ...r }));
    res.json({ success: true, data: ranked });
  } catch (error) { next(error); }
};

export const getSectionPerformanceReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sectionId, academicYear, semester } = req.query;
    if (!sectionId) throw new ApiError(400, 'sectionId is required');

    const sectionObjectId = typeof sectionId === 'string' ? new mongoose.Types.ObjectId(sectionId) : sectionId;

    const results = await AssessmentMark.aggregate([
      { $match: { section: sectionObjectId } },
      { $lookup: { from: 'assessments', localField: 'assessment', foreignField: '_id', as: 'assessment' } },
      { $unwind: '$assessment' },
      { $lookup: { from: 'subjects', localField: 'assessment.subject', foreignField: '_id', as: 'subject' } },
      { $unwind: '$subject' },
      {
        $group: {
          _id: '$assessment.subject',
          code: { $first: '$subject.code' },
          name: { $first: '$subject.name' },
          avgMark: { $avg: '$marksObtained' },
          studentCount: { $addToSet: '$student' },
        },
      },
      {
        $project: {
          code: 1, name: 1,
          avgMark: { $round: ['$avgMark', 1] },
          studentCount: { $size: '$studentCount' },
        },
      },
      { $sort: { avgMark: -1 } },
    ]);

    res.json({ success: true, data: results });
  } catch (error) { next(error); }
};
