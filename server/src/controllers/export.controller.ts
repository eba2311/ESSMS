import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/errorHandler';
import { exportMarksToCSV, exportReportCardToCSV, parseMarksCSV } from '../services/excel.service';
import { enterMarks } from './assessment.controller';
import {
  Student,
  AssessmentMark,
  Ranking,
} from '../models';
import { AssessmentStatus, AttendanceStatus } from '../types';
import PDFDocument from 'pdfkit';

/**
 * Export assessment marks as CSV
 */
export const exportAssessmentMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const csv = await exportMarksToCSV(id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=marks-${id}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * Export report card as CSV
 */
export const exportStudentReportCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const csv = await exportReportCardToCSV(studentId, academicYear as string);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-card-${studentId}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * Import marks from CSV
 */
export const importMarksFromCSV = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { csvContent } = req.body;

    if (!csvContent) throw new ApiError(400, 'CSV content is required');

    const parsedMarks = parseMarksCSV(csvContent);
    if (parsedMarks.length === 0) {
      throw new ApiError(400, 'No valid marks found in CSV');
    }

    // Reuse enterMarks logic by constructing the marks array
    const marks = parsedMarks.map((m) => ({
      studentId: m.studentId,
      marksObtained: m.marksObtained,
      remarks: m.remarks,
    }));

    // Attach marks to request body and call enterMarks
    req.body = { marks };
    return enterMarks(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate comprehensive report card JSON
 * Includes student info, all subjects with marks, totals, averages, rank, attendance summary, teacher comments
 */
export const generateComprehensiveReportCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const student = await Student.findById(studentId)
      .populate('section', 'name grade stream');
    if (!student) throw new ApiError(404, 'Student not found');

    const marks = await AssessmentMark.find({ student: studentId })
      .populate({
        path: 'assessment',
        match: {
          academicYear,
          ...(term && { term }),
          status: AssessmentStatus.PUBLISHED,
        },
        populate: { path: 'subject', select: 'name code' },
      })
      .sort({ createdAt: -1 });

    const validMarks = marks.filter((m: any) => m.assessment);

    const subjectMap = new Map<string, {
      subject: any;
      assessments: any[];
      totalObtained: number;
      totalPossible: number;
      count: number;
    }>();

    for (const mark of validMarks) {
      const assessment: any = mark.assessment;
      const subjectId = assessment.subject?._id?.toString() || 'unknown';
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: assessment.subject,
          assessments: [],
          totalObtained: 0,
          totalPossible: 0,
          count: 0,
        });
      }
      const entry = subjectMap.get(subjectId)!;
      entry.assessments.push({
        title: assessment.title,
        type: assessment.type,
        totalMarks: assessment.totalMarks,
        marksObtained: mark.marksObtained,
        percentage: mark.percentage,
        letterGrade: mark.letterGrade,
        gradePoint: mark.gradePoint,
        remarks: mark.remarks,
      });
      entry.totalObtained += mark.marksObtained;
      entry.totalPossible += assessment.totalMarks;
      entry.count++;
    }

    const subjects = Array.from(subjectMap.values()).map((entry) => ({
      subject: entry.subject,
      assessments: entry.assessments,
      totalObtained: entry.totalObtained,
      totalPossible: entry.totalPossible,
      average: entry.totalPossible > 0
        ? Math.round((entry.totalObtained / entry.totalPossible) * 1000) / 10
        : 0,
      assessmentCount: entry.count,
    }));

    const totalObtained = subjects.reduce((s: number, x: any) => s + x.totalObtained, 0);
    const totalPossible = subjects.reduce((s: number, x: any) => s + x.totalPossible, 0);
    const overallAverage = totalPossible > 0
      ? Math.round((totalObtained / totalPossible) * 1000) / 10
      : 0;

    // Compute term-specific averages when no term filter
    let term1Data: any = null;
    let term2Data: any = null;
    let yearAverage: number | null = null;

    if (!term) {
      const getGradeInfo = (avg: number) => {
        if (avg >= 90) return { letterGrade: 'A', gpa: 4.0 };
        if (avg >= 80) return { letterGrade: 'B', gpa: 3.0 };
        if (avg >= 70) return { letterGrade: 'C', gpa: 2.0 };
        if (avg >= 60) return { letterGrade: 'D', gpa: 1.0 };
        return { letterGrade: 'F', gpa: 0.0 };
      };

      const computeTermData = (termMarks: any[]) => {
        const smap: Record<string, { percentages: number[]; subject: any; totalObtained: number; totalPossible: number }> = {};
        for (const mark of termMarks) {
          const assessment: any = mark.assessment;
          const subjectId = assessment.subject?._id?.toString() || 'unknown';
          if (!smap[subjectId]) smap[subjectId] = { percentages: [], subject: assessment.subject, totalObtained: 0, totalPossible: 0 };
          smap[subjectId].percentages.push(mark.percentage);
          smap[subjectId].totalObtained += mark.marksObtained;
          smap[subjectId].totalPossible += assessment.totalMarks;
        }
        const subs = Object.values(smap).map((e) => {
          const avg = e.percentages.length > 0 ? Math.round((e.percentages.reduce((s, p) => s + p, 0) / e.percentages.length) * 100) / 10 : 0;
          return { subject: e.subject, average: avg, totalObtained: e.totalObtained, totalPossible: e.totalPossible, ...getGradeInfo(avg) };
        });
        const oAvg = subs.length > 0 ? Math.round((subs.reduce((s, sa) => s + sa.average, 0) / subs.length) * 100) / 10 : 0;
        const gpa = subs.length > 0 ? Math.round((subs.reduce((s, sa) => s + sa.gpa, 0) / subs.length) * 100) / 100 : 0;
        return { ...getGradeInfo(oAvg), overallAverage: oAvg, gpa, subjectCount: subs.length, subjects: subs };
      };

      const t1Marks = validMarks.filter((m: any) => m.assessment?.term === '1');
      const t2Marks = validMarks.filter((m: any) => m.assessment?.term === '2');
      term1Data = t1Marks.length > 0 ? computeTermData(t1Marks) : null;
      term2Data = t2Marks.length > 0 ? computeTermData(t2Marks) : null;
      if (term1Data && term2Data) yearAverage = Math.round(((term1Data.overallAverage + term2Data.overallAverage) / 2) * 10) / 10;
      else if (term1Data) yearAverage = term1Data.overallAverage;
      else if (term2Data) yearAverage = term2Data.overallAverage;
    }

    const ranking = await Ranking.findOne({
      student: studentId,
      academicYear,
      ...(term && { term }),
    }).select('sectionRank gradeRank schoolRank meritCategory');

    const Attendance = mongoose.model('Attendance');
    const attendanceRecords = await Attendance.find({
      student: studentId,
      ...(academicYear && { academicYear }),
    });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a: any) => a.status === AttendanceStatus.PRESENT).length;
    const absentDays = attendanceRecords.filter((a: any) => a.status === AttendanceStatus.ABSENT).length;
    const lateDays = attendanceRecords.filter((a: any) => a.status === AttendanceStatus.LATE).length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const teacherComments = validMarks
      .filter((m: any) => m.assessment?.teacherRemarks || m.remarks)
      .map((m: any) => ({
        subject: m.assessment?.subject?.name || 'Unknown',
        assessmentTitle: m.assessment?.title || '',
        teacherRemarks: m.assessment?.teacherRemarks || null,
        markRemarks: m.remarks || null,
      }));

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          section: student.section,
        },
        academicYear,
        term: term || 'All',
        subjects,
        totals: {
          totalObtained,
          totalPossible,
          overallAverage,
          subjectCount: subjects.length,
        },
        term1: term1Data,
        term2: term2Data,
        yearAverage,
        ranking: ranking || null,
        attendance: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate,
        },
        teacherComments,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate PDF report card for a student
 * Streams a PDF document with student info, subject marks, attendance, and ranking
 */
export const generatePDFReportCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const student = await Student.findById(studentId)
      .populate('section', 'name grade stream');
    if (!student) throw new ApiError(404, 'Student not found');

    const marks = await AssessmentMark.find({ student: studentId })
      .populate({
        path: 'assessment',
        match: {
          academicYear,
          ...(term && { term }),
          status: AssessmentStatus.PUBLISHED,
        },
        populate: { path: 'subject', select: 'name code' },
      })
      .sort({ createdAt: -1 });

    const validMarks = marks.filter((m: any) => m.assessment);
    const subjectMap = new Map<string, any>();

    for (const mark of validMarks) {
      const assessment: any = mark.assessment;
      const subjectId = assessment.subject?._id?.toString() || 'unknown';
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: assessment.subject,
          assessments: [],
          totalObtained: 0,
          totalPossible: 0,
        });
      }
      const entry = subjectMap.get(subjectId)!;
      entry.assessments.push(mark);
      entry.totalObtained += mark.marksObtained;
      entry.totalPossible += assessment.totalMarks;
    }

    const subjects = Array.from(subjectMap.values());

    const totalObtained = subjects.reduce((s: number, x: any) => s + x.totalObtained, 0);
    const totalPossible = subjects.reduce((s: number, x: any) => s + x.totalPossible, 0);
    const overallAverage = totalPossible > 0
      ? Math.round((totalObtained / totalPossible) * 1000) / 10
      : 0;

    const ranking = await Ranking.findOne({
      student: studentId,
      academicYear,
      ...(term && { term }),
    });

    const Attendance = mongoose.model('Attendance');
    const attendanceRecords = await Attendance.find({
      student: studentId,
      ...(academicYear && { academicYear }),
    });
    const presentDays = attendanceRecords.filter((a: any) => a.status === AttendanceStatus.PRESENT).length;
    const totalDays = attendanceRecords.length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const sectionInfo: any = (student as any).section;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=report-card-${student.studentId}.pdf`);
    doc.pipe(res);

    const colPositions = [50, 220, 310, 380, 450, 510];
    const headers = ['Subject', 'Obtained', 'Possible', 'Avg %', 'Grade', 'Assessments'];

    doc.fontSize(18).font('Helvetica-Bold').text('REPORT CARD', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('Ethiopian Secondary School Management System', { align: 'center' });
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text('Student Information');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    const lineHeight = 16;
    let infoY = doc.y;

    doc.text('Student Name:', 50, infoY, { continued: true });
    doc.font('Helvetica-Bold').text(` ${student.firstName} ${student.lastName}`);
    doc.font('Helvetica');
    infoY += lineHeight;

    doc.text('Student ID:', 50, infoY, { continued: true });
    doc.font('Helvetica-Bold').text(` ${student.studentId}`);
    doc.font('Helvetica');
    infoY += lineHeight;

    doc.text('Section:', 50, infoY, { continued: true });
    doc.font('Helvetica-Bold').text(` ${sectionInfo?.name || 'N/A'}`);
    doc.font('Helvetica');
    infoY += lineHeight;

    doc.text('Grade:', 50, infoY, { continued: true });
    doc.font('Helvetica-Bold').text(` ${sectionInfo?.grade || 'N/A'}`);
    doc.font('Helvetica');
    infoY += lineHeight;

    doc.text('Academic Year:', 50, infoY, { continued: true });
    doc.font('Helvetica-Bold').text(` ${academicYear}`);
    doc.font('Helvetica');
    infoY += lineHeight;

    doc.text('Term:', 50, infoY, { continued: true });
    doc.font('Helvetica-Bold').text(` ${term || 'All'}`);
    doc.y = infoY + lineHeight;

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text('Subject Performance');
    doc.moveDown(0.3);

    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], colPositions[i], tableTop);
    }

    doc.moveTo(50, tableTop + 14).lineTo(doc.page.width - 50, tableTop + 14).stroke();
    doc.fontSize(9).font('Helvetica');

    let rowY = tableTop + 18;
    for (const entry of subjects) {
      const avg = entry.totalPossible > 0
        ? Math.round((entry.totalObtained / entry.totalPossible) * 1000) / 10
        : 0;
      const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';

      if (rowY > doc.page.height - 80) {
        doc.addPage();
        rowY = 50;
      }

      doc.text(entry.subject?.name || 'Unknown', colPositions[0], rowY);
      doc.text(`${entry.totalObtained}`, colPositions[1], rowY);
      doc.text(`${entry.totalPossible}`, colPositions[2], rowY);
      doc.text(`${avg}%`, colPositions[3], rowY);
      doc.text(grade, colPositions[4], rowY);
      doc.text(`${entry.assessments.length}`, colPositions[5], rowY);
      rowY += 16;
    }

    rowY += 4;
    doc.moveTo(50, rowY - 4).lineTo(doc.page.width - 50, rowY - 4).stroke();
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Total:', colPositions[0], rowY);
    doc.text(`${totalObtained}`, colPositions[1], rowY);
    doc.text(`${totalPossible}`, colPositions[2], rowY);
    doc.text(`${overallAverage}%`, colPositions[3], rowY);
    doc.y = rowY + 24;

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    doc.text(`Overall Average: ${overallAverage}%`);
    doc.text(`Subjects Taken: ${subjects.length}`);

    // Add term averages to PDF summary
    if (!term) {
      const term1Marks = validMarks.filter((m: any) => m.assessment?.term === '1');
      const term2Marks = validMarks.filter((m: any) => m.assessment?.term === '2');

      const calcTermAvg = (tMarks: any[]): number => {
        if (tMarks.length === 0) return 0;
        const sMap: Record<string, { pcts: number[] }> = {};
        tMarks.forEach((m: any) => {
          const sid = m.assessment?.subject?._id?.toString() || 'x';
          if (!sMap[sid]) sMap[sid] = { pcts: [] };
          sMap[sid].pcts.push(m.percentage);
        });
        const avgs = Object.values(sMap).map((e) => e.pcts.reduce((s, p) => s + p, 0) / e.pcts.length);
        return avgs.length > 0 ? Math.round((avgs.reduce((s, a) => s + a, 0) / avgs.length) * 10) / 10 : 0;
      };

      const t1Avg = calcTermAvg(term1Marks);
      const t2Avg = calcTermAvg(term2Marks);
      const yAvg = (term1Marks.length > 0 && term2Marks.length > 0)
        ? Math.round(((t1Avg + t2Avg) / 2) * 10) / 10
        : term1Marks.length > 0 ? t1Avg : t2Avg;

      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').text('Term Averages');
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica');
      if (term1Marks.length > 0) doc.text(`Term 1 Average: ${t1Avg}%`);
      if (term2Marks.length > 0) doc.text(`Term 2 Average: ${t2Avg}%`);
      if (term1Marks.length > 0 || term2Marks.length > 0) {
        doc.font('Helvetica-Bold').text(`Year Average (T1+T2): ${yAvg}%`);
        doc.font('Helvetica');
      }
    }

    if (ranking) {
      const r = ranking as any;
      doc.text(`Section Rank: ${r.sectionRank || 'N/A'}`);
      doc.text(`Grade Rank: ${r.gradeRank || 'N/A'}`);
      doc.text(`Merit: ${r.meritCategory || 'N/A'}`);
    }

    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Attendance Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Attendance Rate: ${attendanceRate}%`);
    doc.text(`Present: ${presentDays} / ${totalDays} days`);

    doc.moveDown(1.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
