import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GradeScale } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const listGradeScales = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { academicYear } = req.query;
    const filter: any = {};
    if (academicYear) filter.academicYear = academicYear;
    const scales = await GradeScale.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: scales });
  } catch (err) { next(err); }
};

export const getActiveGradeScale = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const ay = now.getMonth() + 1 >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
    let scale = await GradeScale.findOne({ academicYear: ay, isActive: true });
    if (!scale) scale = await GradeScale.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: scale });
  } catch (err) { next(err); }
};

export const createGradeScale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { name, typeWeights, gradeThresholds, passThreshold, academicYear } = req.body;
    if (!name || !academicYear) throw new ApiError(400, 'Name and academic year are required');

    if (req.body.isActive) {
      await GradeScale.updateMany({ academicYear, isActive: true }, { $set: { isActive: false } });
    }

    const scale = await GradeScale.create({
      name, typeWeights, gradeThresholds, passThreshold, academicYear,
      isActive: req.body.isActive || false,
      createdBy: req.user.id,
    });

    logger.info(`Grade scale created: ${scale.name} (${academicYear})`);
    res.status(201).json({ success: true, data: scale });
  } catch (err) { next(err); }
};

export const updateGradeScale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const scale = await GradeScale.findById(req.params.id);
    if (!scale) throw new ApiError(404, 'Grade scale not found');

    const { name, typeWeights, gradeThresholds, passThreshold, isActive } = req.body;

    if (isActive && !scale.isActive) {
      await GradeScale.updateMany({ academicYear: scale.academicYear, isActive: true }, { $set: { isActive: false } });
    }

    if (name) scale.name = name;
    if (typeWeights) scale.typeWeights = typeWeights;
    if (gradeThresholds) scale.gradeThresholds = gradeThresholds;
    if (passThreshold !== undefined) scale.passThreshold = passThreshold;
    if (isActive !== undefined) scale.isActive = isActive;

    await scale.save();
    logger.info(`Grade scale updated: ${scale.name}`);
    res.json({ success: true, data: scale });
  } catch (err) { next(err); }
};

export const deleteGradeScale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scale = await GradeScale.findByIdAndDelete(req.params.id);
    if (!scale) throw new ApiError(404, 'Grade scale not found');
    logger.info(`Grade scale deleted: ${scale.name}`);
    res.json({ success: true, message: 'Grade scale deleted' });
  } catch (err) { next(err); }
};

export const getGradeBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { sectionId, academicYear, term } = req.query;
    if (!sectionId) throw new ApiError(400, 'Section is required');

    const now = new Date();
    const ay = academicYear || (now.getMonth() + 1 >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`);
    const termVal = term || '1';

    const { Assessment, AssessmentMark, Student, SubjectAssignment } = await import('../models');

    const [assessments, assignments] = await Promise.all([
      Assessment.find({ section: sectionId, academicYear: ay, term: termVal }).populate('subject', 'name code').sort({ date: 1 }).lean(),
      SubjectAssignment.find({ section: sectionId }).populate('subject', 'name code').lean(),
    ]);

    const subjectIds = [...new Set(assessments.map((a: any) => a.subject?._id?.toString()).filter(Boolean))];
    const allStudents = await Student.find({ section: sectionId, status: 'Active' })
      .select('firstName lastName studentId')
      .sort({ firstName: 1 })
      .lean();

    const marks = await AssessmentMark.find({
      assessment: { $in: assessments.map((a: any) => a._id) },
    }).populate('student', 'firstName lastName studentId').lean();

    const marksByStudent: Record<string, any> = {};
    for (const m of marks) {
      const sid = (m.student as any)?._id?.toString();
      if (!sid) continue;
      if (!marksByStudent[sid]) marksByStudent[sid] = {};
      marksByStudent[sid][(m.assessment as any)?.toString()] = m;
    }

    const gradeBook = allStudents.map((s: any) => {
      const sid = s._id.toString();
      const subjectMarks: Record<string, { total: number; count: number; pcts: number[] }> = {};

      const assessmentRows = assessments.map((a: any) => {
        const m = marksByStudent[sid]?.[a._id.toString()];
        const subId = a.subject?._id?.toString();
        if (subId && m && m.percentage !== undefined) {
          if (!subjectMarks[subId]) subjectMarks[subId] = { total: 0, count: 0, pcts: [] };
          subjectMarks[subId].total += m.marksObtained;
          subjectMarks[subId].count++;
          subjectMarks[subId].pcts.push(m.percentage);
        }
        return m ? {
          marksObtained: m.marksObtained,
          percentage: m.percentage,
          letterGrade: m.letterGrade,
          gradePoint: m.gradePoint,
        } : null;
      });

      const subjects = assignments
        .map((ass: any) => {
          const sub = ass.subject as any;
          if (!sub) return null;
          const sid2 = sub._id.toString();
          const sm = subjectMarks[sid2];
          return {
            subjectId: sid2,
            name: sub.name,
            code: sub.code,
            totalMarks: sm?.total || 0,
            assessmentCount: sm?.count || 0,
            average: sm?.pcts.length ? Math.round((sm.pcts.reduce((a: number, b: number) => a + b, 0) / sm.pcts.length) * 100) / 100 : null,
          };
        })
        .filter(Boolean);

      const allPcts = Object.values(subjectMarks).flatMap((sm: any) => sm.pcts);
      const overallAverage = allPcts.length ? Math.round((allPcts.reduce((a: number, b: number) => a + b, 0) / allPcts.length) * 100) / 100 : null;

      return {
        studentId: s.studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        _id: s._id,
        assessments: assessmentRows,
        subjects,
        overallAverage,
        totalMarks: Object.values(subjectMarks).reduce((sum: number, sm: any) => sum + sm.total, 0),
      };
    });

    res.json({
      success: true,
      data: {
        assessments: assessments.map((a: any) => ({
          _id: a._id,
          title: a.title,
          type: a.type,
          totalMarks: a.totalMarks,
          date: a.date,
          subject: a.subject,
        })),
        students: gradeBook,
      },
    });
  } catch (err) { next(err); }
};
