import { Assessment, AssessmentMark, Student, Subject, Section } from '../models';

/**
 * Generate CSV content for marks export
 */
export const exportMarksToCSV = async (assessmentId: string): Promise<string> => {
  const assessment = await Assessment.findById(assessmentId)
    .populate('subject', 'name code')
    .populate('section', 'name grade stream');

  if (!assessment) throw new Error('Assessment not found');

  const marks = await AssessmentMark.find({ assessment: assessmentId })
    .populate('student', 'studentId firstName lastName');

  const subjectName = (assessment as any).subject?.name || 'Unknown';
  const sectionName = (assessment as any).section?.name || 'Unknown';
  const title = assessment.title;

  // CSV Header
  const header = `Assessment,${title}\nSubject,${subjectName}\nSection,${sectionName}\nTotal Marks,${assessment.totalMarks}\n\n`;
  const columns = 'Student ID,First Name,Last Name,Marks Obtained,Percentage,Letter Grade,GPA,Remarks\n';
  const rows = marks
    .map((m: any) => {
      const student = m.student;
      return `${student?.studentId || ''},${student?.firstName || ''},${student?.lastName || ''},${m.marksObtained},${m.percentage.toFixed(1)},${m.letterGrade},${m.gradePoint.toFixed(1)},${m.remarks || ''}`;
    })
    .join('\n');

  return header + columns + rows;
};

/**
 * Generate CSV for report card
 */
export const exportReportCardToCSV = async (
  studentId: string,
  academicYear: string
): Promise<string> => {
  const student = await Student.findById(studentId)
    .populate('section', 'name grade stream');

  if (!student) throw new Error('Student not found');

  const marks = await AssessmentMark.find({ student: studentId })
    .populate({
      path: 'assessment',
      match: { academicYear, status: 'Published' },
      populate: { path: 'subject', select: 'name code' },
    });

  const validMarks = marks.filter((m: any) => m.assessment);
  const sectionInfo = (student as any).section;

  let csv = `Report Card\n`;
  csv += `Student,${student.firstName} ${student.lastName}\n`;
  csv += `Student ID,${student.studentId}\n`;
  csv += `Section,${sectionInfo?.name || ''}\n`;
  csv += `Grade,${sectionInfo?.grade || ''}\n`;
  csv += `Academic Year,${academicYear}\n\n`;
  csv += 'Subject,Assessment,Type,Total Marks,Obtained,Percentage,Grade,Remarks\n';

  for (const mark of validMarks) {
    const ass: any = mark.assessment;
    csv += `${ass.subject?.name || 'Unknown'},${ass.title},${ass.type},${ass.totalMarks},${mark.marksObtained},${mark.percentage.toFixed(1)},${mark.letterGrade},${mark.remarks || ''}\n`;
  }

  return csv;
};

/**
 * Parse CSV marks data into structured format
 * Expected format: studentId, marksObtained, remarks (optional)
 */
export const parseMarksCSV = (csvContent: string): Array<{ studentId: string; marksObtained: number; remarks?: string }> => {
  const lines = csvContent.trim().split('\n');
  const results: Array<{ studentId: string; marksObtained: number; remarks?: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(',');
    if (parts.length < 2) continue;

    const studentId = parts[0].trim();
    const marksObtained = parseFloat(parts[1].trim());

    if (!studentId || isNaN(marksObtained)) continue;

    results.push({
      studentId,
      marksObtained,
      remarks: parts[2]?.trim(),
    });
  }

  return results;
};
