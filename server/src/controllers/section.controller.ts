import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Section, Student, Teacher, Guardian, Classroom, AuditLog, TransferLog, StudentSubject, TeacherAssignment } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { Stream, GradeLevel, UserRole } from '../types';
import { logger } from '../utils/logger';
import { getSubjectsFromDatabase } from '../services/curriculum.service';

/**
 * Create a new section
 * Implements Req 3.1, 3.2, 3.6, 3.7
 */
export const createSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const {
      name,
      grade,
      stream,
      academicYear,
      capacity,
      classroomId,
    } = req.body;

    // Validate required fields
    if (!name || !grade || !academicYear) {
      throw new ApiError(400, 'Missing required fields: name, grade, academicYear');
    }

    // Validate grade
    if (![9, 10, 11, 12].includes(grade)) {
      throw new ApiError(400, 'Invalid grade. Must be 9, 10, 11, or 12');
    }

    // Validate stream value if provided
    if (stream && !Object.values(Stream).includes(stream)) {
      throw new ApiError(400, 'Invalid stream. Use: Common, Natural Science, or Social Science');
    }

    // Validate section name - at least 1 char, max 20 chars
    if (!name || name.trim().length < 1 || name.trim().length > 20) {
      throw new ApiError(400, 'Section name must be between 1 and 20 characters');
    }

    // Check if section already exists for this grade + academic year (name can repeat across grades)
    const existingSection = await Section.findOne({ name, grade, academicYear });
    if (existingSection) {
      throw new ApiError(400, `Section ${name} already exists for Grade ${grade} in ${academicYear}`);
    }

    // Validate classroom if provided
    if (classroomId) {
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        throw new ApiError(404, 'Classroom not found');
      }
    }

    // Create section
    const section = await Section.create({
      name: name.trim(),
      grade,
      stream: stream || Stream.COMMON,
      academicYear: academicYear.trim(),
      capacity: capacity || 50,
      classroom: classroomId,
      isActive: true,
    });

    // Log section creation
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_CREATE',
      description: `New section created: ${section.name}`,
      ipAddress: req.ip,
      metadata: {
        sectionId: section._id,
        sectionName: section.name,
        grade: section.grade,
        stream: section.stream,
        academicYear: section.academicYear,
        createdBy: req.user.userId,
      },
    });

    logger.info(`Section created`, {
      sectionId: section._id,
      name: section.name,
      grade: section.grade,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: section,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section by ID
 */
export const getSectionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id)
      .populate('classroom', 'roomNumber building capacity')
      .populate('assistantTeacher', 'firstName lastName email teacherId');

    if (!section) {
      throw new ApiError(404, 'Section not found');
    }

    // Get student count
    const studentCount = await Student.countDocuments({
      section: section._id,
      status: 'Active',
    });

    res.json({
      success: true,
      data: {
        ...section.toObject(),
        studentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update section
 * Implements Req 3.8 - Dynamic addition and removal
 */
export const updateSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const updates = req.body;

    const section = await Section.findById(id);

    if (!section) {
      throw new ApiError(404, 'Section not found');
    }

    // Prevent changing certain fields
    delete updates.academicYear; // Cannot change academic year
    delete updates.grade; // Cannot change grade after creation

    const allowedFields = [
      'name',
      'stream',
      'capacity',
      'classroom',
      'isActive',
      'assistantTeacher',
    ];

    const changes: any = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        changes[field] = {
          old: (section as any)[field],
          new: updates[field],
        };
        (section as any)[field] = updates[field];
      }
    });

    await section.save();

    // Log section update
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_UPDATE',
      description: `Section updated: ${section.name}`,
      ipAddress: req.ip,
      metadata: {
        sectionId: section._id,
        sectionName: section.name,
        changes,
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Section updated successfully',
      data: section,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List sections with filtering
 */
export const listSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const {
      grade,
      stream,
      academicYear,
      isActive,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter: any = {};

    // Filter by teacher's assigned sections for TEACHER role
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await Teacher.findOne({ userId: req.user.id }).select('_id');
      if (teacher) {
        const assignments = await TeacherAssignment.find({ teacher: teacher._id }).select('section');
        const sectionIds = [...new Set(assignments.map(a => a.section?.toString()).filter(Boolean))];
        filter._id = sectionIds.length ? { $in: sectionIds } : null;
      } else {
        filter._id = null;
      }
    }

    // Filter by enrolled section for STUDENT role
    if (req.user.role === UserRole.STUDENT) {
      const student = await Student.findOne({ userId: req.user.id }).select('section');
      if (student?.section) {
        filter._id = student.section;
      } else {
        filter._id = null; // no section assigned
      }
    }

    // Filter by children's sections for PARENT role
    if (req.user.role === UserRole.PARENT) {
      const guardian = await Guardian.findOne({ userId: req.user.id }).select('students');
      if (guardian?.students?.length) {
        const studentDocs = await Student.find({ _id: { $in: guardian.students } }).select('section');
        const sectionIds = [...new Set(studentDocs.map(s => s.section?.toString()).filter(Boolean))];
        if (sectionIds.length) {
          filter._id = { $in: sectionIds };
        } else {
          filter._id = null;
        }
      } else {
        filter._id = null;
      }
    }

    // Filter by grade
    if (grade) {
      filter.grade = Number(grade);
    }

    // Filter by stream
    if (stream && Object.values(Stream).includes(stream as Stream)) {
      filter.stream = stream;
    }

    // Filter by academic year
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sections = await Section.find(filter)
      .populate('classroom', 'roomNumber building')
      .skip(skip)
      .limit(Number(limit))
      .sort({ grade: 1, name: 1 });

    const total = await Section.countDocuments(filter);

    // Add student count for each section
    const sectionsWithCount = await Promise.all(
      sections.map(async (section) => {
        const studentCount = await Student.countDocuments({
          section: section._id,
          status: 'Active',
        });
        return {
          ...section.toObject(),
          studentCount,
        };
      })
    );

    res.json({
      success: true,
      data: sectionsWithCount,
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

/**
 * Get students in a section
 */
export const getSectionStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);

    if (!section) {
      throw new ApiError(404, 'Section not found');
    }

    const students = await Student.find({
      section: section._id,
      status: 'Active',
    })
      .select('studentId firstName lastName gender dateOfBirth')
      .sort({ lastName: 1, firstName: 1 });

    res.json({
      success: true,
      data: {
        section: {
          id: section._id,
          name: section.name,
          grade: section.grade,
          stream: section.stream,
          capacity: section.capacity,
        },
        students,
        count: students.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subjects for a section based on grade and stream
 * Implements Req 3.3, 3.4, 3.5 - Automatic curriculum assignment
 */
export const getSectionSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);

    if (!section) {
      throw new ApiError(404, 'Section not found');
    }

    // Get subjects from database based on grade and stream
    const subjects = await getSubjectsFromDatabase(section.grade, section.stream);

    res.json({
      success: true,
      data: {
        section: {
          id: section._id,
          name: section.name,
          grade: section.grade,
          stream: section.stream,
        },
        subjects,
        totalCreditHours: subjects.reduce((sum, s) => sum + s.creditHours, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete/Deactivate section
 * Implements Req 3.8
 */
export const deleteSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const section = await Section.findById(id);

    if (!section) {
      throw new ApiError(404, 'Section not found');
    }

    // Check if section has active students
    const studentCount = await Student.countDocuments({
      section: section._id,
      status: 'Active',
    });

    if (studentCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete section with ${studentCount} active students. Please reassign students first.`
      );
    }

    // Deactivate instead of delete
    section.isActive = false;
    await section.save();

    // Log section deletion
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_DELETE',
      description: `Section deactivated: ${section.name}`,
      ipAddress: req.ip,
      metadata: {
        sectionId: section._id,
        sectionName: section.name,
        grade: section.grade,
        academicYear: section.academicYear,
        deletedBy: req.user.userId,
      },
    });

    logger.info(`Section deactivated`, {
      sectionId: section._id,
      name: section.name,
      deletedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Section deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive section (Admin/Academic Head)
 */
export const archiveSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { reason } = req.body;

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');
    if (section.isArchived) throw new ApiError(400, 'Section is already archived');

    section.isArchived = true;
    section.isActive = false;
    section.archivedAt = new Date();
    section.archivedBy = new mongoose.Types.ObjectId(req.user.id);
    section.archiveReason = reason || 'Archived by administrator';
    section.statusHistory.push({
      status: 'Archived',
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: reason || 'Archived by administrator',
    });
    await section.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_ARCHIVE',
      description: `Section archived: ${section.name}`,
      ipAddress: req.ip,
      metadata: { sectionId: section._id, sectionName: section.name, reason, archivedBy: req.user.userId },
    });

    res.json({ success: true, message: 'Section archived successfully', data: section });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore archived section (Admin only)
 */
export const restoreSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');
    if (!section.isArchived) throw new ApiError(400, 'Section is not archived');

    section.isArchived = false;
    section.isActive = true;
    section.restoredAt = new Date();
    section.restoredBy = new mongoose.Types.ObjectId(req.user.id);
    section.statusHistory.push({
      status: 'Restored',
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: 'Restored by administrator',
    });
    await section.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_RESTORE',
      description: `Section restored: ${section.name}`,
      ipAddress: req.ip,
      metadata: { sectionId: section._id, sectionName: section.name, restoredBy: req.user.userId },
    });

    res.json({ success: true, message: 'Section restored successfully', data: section });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign student(s) to section (Registrar/Academic Head/Admin)
 */
export const assignStudentsToSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, 'studentIds array is required');
    }

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');
    if (!section.isActive || section.isArchived) throw new ApiError(400, 'Section is not active');

    // Check capacity
    const currentCount = await Student.countDocuments({ section: id, status: 'Active' });
    if (currentCount + studentIds.length > section.capacity) {
      throw new ApiError(400, `Cannot assign ${studentIds.length} students. Only ${section.capacity - currentCount} seats available`);
    }

    const results = { assigned: 0, failed: 0, errors: [] as any[] };
    const ay = section.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

    for (const studentId of studentIds) {
      try {
        const student = await Student.findById(studentId);
        if (!student) {
          results.failed++;
          results.errors.push({ studentId, error: 'Student not found' });
          continue;
        }
        if (student.status !== 'Active') {
          results.failed++;
          results.errors.push({ studentId, error: 'Student is not active' });
          continue;
        }

        const oldSectionId = student.section?.toString();
        const oldGrade = student.grade;

        // Update student record
        student.section = new mongoose.Types.ObjectId(id);
        student.grade = section.grade;
        if (section.stream && (!student.stream || student.grade >= 11)) {
          student.stream = section.stream;
        }
        if (!student.statusHistory) student.statusHistory = [];
        student.statusHistory.push({
          status: student.status,
          changedAt: new Date(),
          changedBy: new mongoose.Types.ObjectId(req.user.id),
          reason: `Assigned to section ${section.name}`,
        });
        await student.save();

        // Update section status history
        section.statusHistory.push({
          status: 'StudentAssigned',
          changedAt: new Date(),
          changedBy: new mongoose.Types.ObjectId(req.user.id),
          reason: `Student ${student.studentId} assigned to section`,
        });

        // Auto-enroll in section subjects
        const subjects = await getSubjectsFromDatabase(section.grade, section.stream || student.stream);
        for (const subject of subjects) {
          const existing = await StudentSubject.findOne({
            student: student._id,
            subject: subject._id,
            academicYear: ay,
          });
          if (!existing) {
            await StudentSubject.create({
              student: student._id,
              subject: subject._id,
              section: new mongoose.Types.ObjectId(id),
              academicYear: ay,
              grade: section.grade,
              stream: section.stream || student.stream,
              status: 'Active',
            });
          }
        }

        // Create TransferLog if previously in a different section
        if (oldSectionId && oldSectionId !== id) {
          await TransferLog.create({
            student: student._id,
            fromSection: new mongoose.Types.ObjectId(oldSectionId),
            toSection: new mongoose.Types.ObjectId(id),
            fromGrade: oldGrade,
            toGrade: section.grade,
            reason: 'Section reassignment',
            transferredBy: new mongoose.Types.ObjectId(req.user.id),
            transferredAt: new Date(),
            type: 'Section',
          });
        }

        results.assigned++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ studentId, error: err.message });
      }
    }

    await section.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_ASSIGN_STUDENTS',
      description: `${results.assigned} students assigned to section ${section.name}`,
      ipAddress: req.ip,
      metadata: {
        sectionId: section._id,
        sectionName: section.name,
        assigned: results.assigned,
        failed: results.failed,
        assignedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: `${results.assigned} assigned, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove student from section
 */
export const removeStudentFromSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id, studentId } = req.params;

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');

    const student = await Student.findById(studentId);
    if (!student) throw new ApiError(404, 'Student not found');
    if (student.section?.toString() !== id) throw new ApiError(400, 'Student is not in this section');

    student.section = undefined as any;
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({
      status: student.status,
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: `Removed from section ${section.name}`,
    });
    await student.save();

    // Drop active subject enrollments for this section
    await StudentSubject.updateMany(
      { student: student._id, section: new mongoose.Types.ObjectId(id), status: 'Active' },
      { status: 'Dropped', droppedAt: new Date() }
    );

    section.statusHistory.push({
      status: 'StudentRemoved',
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: `Student ${student.studentId} removed from section`,
    });
    await section.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_REMOVE_STUDENT',
      description: `Student ${student.studentId} removed from section ${section.name}`,
      ipAddress: req.ip,
      metadata: { sectionId: section._id, studentId: student.studentId, removedBy: req.user.userId },
    });

    res.json({ success: true, message: 'Student removed from section' });
  } catch (error) {
    next(error);
  }
};

/**
 * Transfer student between sections
 * Full workflow with history tracking
 */
export const transferStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { studentId } = req.params;
    const { targetSectionId, reason } = req.body;

    if (!targetSectionId) throw new ApiError(400, 'Target section ID is required');

    const student = await Student.findById(studentId);
    if (!student) throw new ApiError(404, 'Student not found');

    const sourceSection = student.section
      ? await Section.findById(student.section)
      : null;

    const targetSection = await Section.findById(targetSectionId);
    if (!targetSection) throw new ApiError(404, 'Target section not found');
    if (!targetSection.isActive || targetSection.isArchived) {
      throw new ApiError(400, 'Target section is not active');
    }

    // Check capacity
    const targetCount = await Student.countDocuments({ section: targetSectionId, status: 'Active' });
    if (targetCount >= targetSection.capacity) {
      throw new ApiError(400, 'Target section is at full capacity');
    }

    const oldSectionId = student.section?.toString();
    const oldGrade = student.grade;

    student.section = new mongoose.Types.ObjectId(targetSectionId);
    student.grade = targetSection.grade;
    await student.save();

    // Push transfer history to student
    if ((student as any).statusHistory) {
      (student as any).statusHistory.push({
        status: 'Transferred',
        changedAt: new Date(),
        changedBy: new mongoose.Types.ObjectId(req.user.id),
        reason: reason || `Transferred from ${sourceSection?.name || 'None'} to ${targetSection.name}`,
      });
    }

    const transferRecord = await TransferLog.create({
      student: student._id,
      fromSection: sourceSection?._id,
      toSection: targetSection._id,
      fromGrade: oldGrade,
      toGrade: targetSection.grade,
      reason: reason || 'Transfer',
      transferredBy: new mongoose.Types.ObjectId(req.user.id),
      transferredAt: new Date(),
      type: 'Section',
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_TRANSFER',
      description: `Student ${student.studentId} transferred from ${sourceSection?.name || 'None'} to ${targetSection.name}`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        fromSection: sourceSection?.name || 'None',
        toSection: targetSection.name,
        reason: reason || 'Transfer',
        transferredBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Student transferred successfully',
      data: transferRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section transfer history
 */
export const getSectionTransfers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');

    const transfers = await AuditLog.find({
      activityType: 'SECTION_TRANSFER',
      $or: [
        { 'metadata.fromSection': section.name },
        { 'metadata.toSection': section.name },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: transfers });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section performance KPIs
 */
export const getSectionPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) throw new ApiError(400, 'Academic year is required');

    const section = await Section.findById(id)
      .populate('assistantTeacher', 'firstName lastName teacherId');
    if (!section) throw new ApiError(404, 'Section not found');

    const students = await Student.find({ section: id, status: 'Active' }).select('_id');
    const studentIds = students.map((s) => s._id);
    const totalStudents = studentIds.length;

    // Get approved/published assessment marks for these students
    const AssessmentMark = mongoose.model('AssessmentMark');
    const Assessment = mongoose.model('Assessment');

    const assessments = await Assessment.find({
      section: id,
      academicYear,
      status: { $in: ['Approved', 'Published'] },
    }).select('_id totalMarks subject');

    const assessmentIds = assessments.map((a) => a._id);

    let sectionAverage = 0;
    let highestAverage = 0;
    let lowestAverage = 100;
    let totalMarksSum = 0;
    let totalMarksCount = 0;

    if (assessmentIds.length > 0 && studentIds.length > 0) {
      const marks = await AssessmentMark.find({
        assessment: { $in: assessmentIds },
        student: { $in: studentIds },
      });

      // Per-student average
      const studentAverages = new Map<string, number[]>();
      for (const mark of marks) {
        const sid = mark.student.toString();
        if (!studentAverages.has(sid)) studentAverages.set(sid, []);
        studentAverages.get(sid)!.push(mark.percentage);
      }

      const averages: number[] = [];
      for (const [, percentages] of studentAverages) {
        const avg = percentages.reduce((s, p) => s + p, 0) / percentages.length;
        averages.push(avg);
        if (avg > highestAverage) highestAverage = avg;
        if (avg < lowestAverage) lowestAverage = avg;
      }

      sectionAverage = averages.length > 0
        ? averages.reduce((s, a) => s + a, 0) / averages.length
        : 0;

      totalMarksSum = marks.reduce((s, m) => s + m.marksObtained, 0);
      totalMarksCount = marks.length;
    }

    // Section rank among same-grade sections
    const sameGradeSections = await Section.find({ grade: section.grade, academicYear, isActive: true }).select('_id');
    const sectionRanks: { sectionId: string; avg: number }[] = [];

    for (const sec of sameGradeSections) {
      const secStudents = await Student.find({ section: sec._id, status: 'Active' }).select('_id');
      const secStudentIds = secStudents.map((s) => s._id);
      const secAssessments = await Assessment.find({
        section: sec._id,
        academicYear,
        status: { $in: ['Approved', 'Published'] },
      }).select('_id');

      if (secAssessments.length > 0 && secStudentIds.length > 0) {
        const secMarks = await AssessmentMark.find({
          assessment: { $in: secAssessments.map((a) => a._id) },
          student: { $in: secStudentIds },
        });

        const studentAvgs = new Map<string, number[]>();
        for (const m of secMarks) {
          const sid = m.student.toString();
          if (!studentAvgs.has(sid)) studentAvgs.set(sid, []);
          studentAvgs.get(sid)!.push(m.percentage);
        }

        const avgs: number[] = [];
        for (const [, pcts] of studentAvgs) {
          avgs.push(pcts.reduce((s, p) => s + p, 0) / pcts.length);
        }
        const avg = avgs.length > 0 ? avgs.reduce((s, a) => s + a, 0) / avgs.length : 0;
        sectionRanks.push({ sectionId: sec._id.toString(), avg });
      }
    }

    sectionRanks.sort((a, b) => b.avg - a.avg);
    const rankPosition = sectionRanks.findIndex((r) => r.sectionId === id) + 1;

    res.json({
      success: true,
      data: {
        section: {
          _id: section._id,
          name: section.name,
          grade: section.grade,
          stream: section.stream,
          assistantTeacher: section.assistantTeacher,
        },
        metrics: {
          totalStudents,
          sectionAverage: Math.round(sectionAverage * 100) / 100,
          highestAverage: Math.round(highestAverage * 100) / 100,
          lowestAverage: Math.round(lowestAverage * 100) / 100,
          rankPosition: rankPosition || '—',
          totalSections: sameGradeSections.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section attendance KPIs
 */
export const getSectionAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { academicYear } = req.query;

    const Attendance = mongoose.model('Attendance');
    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');

    const students = await Student.find({ section: id, status: 'Active' }).select('_id');
    const studentIds = students.map((s) => s._id);

    // Build base attendance query — filter by academicYear if the records store it, else use all records
    const baseQuery: any = { student: { $in: studentIds } };
    if (academicYear) baseQuery.academicYear = academicYear;

    const totalRecords = await Attendance.countDocuments(baseQuery);
    const presentRecords = await Attendance.countDocuments({ ...baseQuery, status: 'Present' });
    const absentRecords = await Attendance.countDocuments({ ...baseQuery, status: 'Absent' });

    // Chronic absenteeism: students absent >20% of recorded days
    const chronicAbsentees: string[] = [];
    for (const studentId of studentIds) {
      const studentQuery: any = { student: studentId };
      if (academicYear) studentQuery.academicYear = academicYear;
      const total = await Attendance.countDocuments(studentQuery);
      if (total > 0) {
        const absent = await Attendance.countDocuments({ ...studentQuery, status: 'Absent' });
        if (absent / total > 0.2) {
          chronicAbsentees.push(studentId.toString());
        }
      }
    }

    const dailyRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

    res.json({
      success: true,
      data: {
        section: { _id: section._id, name: section.name },
        metrics: {
          dailyAttendanceRate: Math.round(dailyRate * 100) / 100,
          totalRecords,
          presentRecords,
          absentRecords,
          chronicAbsenteeCount: chronicAbsentees.length,
          totalStudents: studentIds.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section dashboard — executive metrics
 */
export const getSectionDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { academicYear } = req.query;
    const ay = (academicYear as string) || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

    const sections = await Section.find({ academicYear: ay })
      .populate('classroom', 'roomNumber building');

    const totalSections = sections.length;
    const activeSections = sections.filter((s) => s.isActive && !s.isArchived).length;
    const archivedSections = sections.filter((s) => s.isArchived).length;

    const sectionDetails = await Promise.all(
      sections.map(async (section) => {
        const studentCount = await Student.countDocuments({ section: section._id, status: 'Active' });
        const availableSeats = section.capacity - studentCount;
        return {
          _id: section._id,
          sectionCode: section.sectionCode,
          name: section.name,
          grade: section.grade,
          stream: section.stream,
          capacity: section.capacity,
          studentCount,
          availableSeats,
          isFull: studentCount >= section.capacity,
          isActive: section.isActive,
          isArchived: section.isArchived,
          classroom: section.classroom,
        };
      })
    );

    const totalStudents = sectionDetails.reduce((s, d) => s + d.studentCount, 0);
    const totalCapacity = sectionDetails.reduce((s, d) => s + d.capacity, 0);
    const fullSections = sectionDetails.filter((d) => d.isFull).length;
    const availableSeats = sectionDetails.reduce((s, d) => s + d.availableSeats, 0);

    res.json({
      success: true,
      data: {
        metrics: {
          totalSections,
          activeSections,
          archivedSections,
          totalStudents,
          totalCapacity,
          availableSeats,
          fullSections,
          capacityUtilization: totalCapacity > 0
            ? Math.round((totalStudents / totalCapacity) * 1000) / 10
            : 0,
        },
        sections: sectionDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Balance student distribution across sections in a grade
 */
export const balanceSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { grade, academicYear } = req.body;

    if (!grade || !academicYear) {
      throw new ApiError(400, 'Grade and academic year are required');
    }

    const sections = await Section.find({
      grade: Number(grade),
      academicYear,
      isActive: true,
      isArchived: false,
    }).sort({ name: 1 });

    if (sections.length < 2) {
      throw new ApiError(400, 'Need at least 2 sections to balance');
    }

    // Get all active students in this grade
    const students = await Student.find({
      grade: Number(grade),
      status: 'Active',
    }).sort({ lastName: 1 });

    if (students.length === 0) {
      throw new ApiError(400, 'No students found in this grade');
    }

    // Calculate target per section
    const totalCapacity = sections.reduce((s, sec) => s + sec.capacity, 0);
    const targetPerSection = Math.ceil(students.length / sections.length);

    // Redistribute
    const assignments: { studentId: string; fromSection: string; toSection: string }[] = [];
    let studentIdx = 0;

    for (const section of sections) {
      for (let i = 0; i < targetPerSection && studentIdx < students.length; i++) {
        const student = students[studentIdx];
        const oldSection = student.section?.toString() || 'None';

        if (oldSection !== 'None' && oldSection !== section._id.toString()) {
          // Student is moving sections
          student.section = section._id;
          student.grade = section.grade;
          if (!student.statusHistory) student.statusHistory = [];
          student.statusHistory.push({
            status: student.status,
            changedAt: new Date(),
            changedBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : undefined,
            reason: `Rebalanced to section ${section.name}`,
          });
          await student.save();

          // Drop old subject enrollments
          await StudentSubject.updateMany(
            { student: student._id, section: oldSection, status: 'Active' },
            { status: 'Dropped', droppedAt: new Date(), droppedReason: 'Section rebalance' }
          );

          // Enroll in new section subjects
          const subjects = await getSubjectsFromDatabase(section.grade, section.stream);
          for (const subject of subjects) {
            const existing = await StudentSubject.findOne({
              student: student._id,
              subject: subject._id,
              academicYear,
            });
            if (!existing) {
              await StudentSubject.create({
                student: student._id,
                subject: subject._id,
                section: section._id,
                academicYear,
                grade: section.grade,
                stream: section.stream,
                status: 'Active',
              });
            }
          }

          assignments.push({
            studentId: student.studentId,
            fromSection: oldSection,
            toSection: section.name,
          });
        } else if (oldSection === 'None') {
          // Unassigned student - just assign
          student.section = section._id;
          student.grade = section.grade;
          if (!student.statusHistory) student.statusHistory = [];
          student.statusHistory.push({
            status: student.status,
            changedAt: new Date(),
            changedBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : undefined,
            reason: `Assigned to section ${section.name} via rebalance`,
          });
          await student.save();

          const subjects = await getSubjectsFromDatabase(section.grade, section.stream);
          for (const subject of subjects) {
            const existing = await StudentSubject.findOne({
              student: student._id,
              subject: subject._id,
              academicYear,
            });
            if (!existing) {
              await StudentSubject.create({
                student: student._id,
                subject: subject._id,
                section: section._id,
                academicYear,
                grade: section.grade,
                stream: section.stream,
                status: 'Active',
              });
            }
          }

          assignments.push({
            studentId: student.studentId,
            fromSection: oldSection,
            toSection: section.name,
          });
        }

        studentIdx++;
      }
    }

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_BALANCE',
      description: `Sections balanced for grade ${grade}`,
      ipAddress: req.ip,
      metadata: {
        grade,
        academicYear,
        totalStudents: students.length,
        totalSections: sections.length,
        assignments: assignments.length,
        balancedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: `Sections balanced for grade ${grade}. ${assignments.length} students reassigned.`,
      data: { assignmentsCount: assignments.length, assignments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section status history
 */
export const getSectionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id).select('name statusHistory');
    if (!section) throw new ApiError(404, 'Section not found');

    res.json({ success: true, data: section.statusHistory });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create sections for a grade/stream combination
 */
export const bulkCreateSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { sections, grade, stream, academicYear } = req.body;

    if ((!sections || !Array.isArray(sections)) && (!grade || !academicYear)) {
      throw new ApiError(400, 'Provide either sections array or grade+academicYear for auto-generation');
    }

    const created: any[] = [];
    const errors: any[] = [];
    let sectionEntries: { name: string; capacity: number }[] = [];

    if (sections && Array.isArray(sections)) {
      sectionEntries = sections.map((s: any) => ({
        name: s.name,
        capacity: s.capacity || 50,
      }));
    } else {
      const count = req.body.count || 3;
      for (let i = 0; i < count; i++) {
        const letter = String.fromCharCode(65 + i);
        sectionEntries.push({ name: `${grade}${letter}`, capacity: 50 });
      }
    }

    for (const entry of sectionEntries) {
      const existing = await Section.findOne({ name: entry.name, academicYear });
      if (existing) {
        errors.push({ name: entry.name, error: `Section ${entry.name} already exists for ${academicYear}` });
        continue;
      }

      try {
        const section = await Section.create({
          name: entry.name,
          grade: grade || req.body.grade,
          stream: stream || req.body.stream || Stream.COMMON,
          academicYear: academicYear || req.body.academicYear,
          capacity: entry.capacity || 50,
          isActive: true,
        });

        await AuditLog.create({
          userId: req.user.id,
          activityType: 'SECTION_CREATE',
          description: `Bulk created section: ${section.name}`,
          ipAddress: req.ip,
          metadata: { sectionId: section._id, sectionName: section.name, grade: section.grade, academicYear: section.academicYear, createdBy: req.user.userId },
        });

        created.push(section);
      } catch (err: any) {
        errors.push({ name: entry.name, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `${created.length} sections created, ${errors.length} errors`,
      data: { created, errors },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rollover sections to new academic year
 */
export const rolloverSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { fromAcademicYear, toAcademicYear, gradeFilter } = req.body;

    if (!fromAcademicYear || !toAcademicYear) {
      throw new ApiError(400, 'fromAcademicYear and toAcademicYear are required');
    }

    const filter: any = { academicYear: fromAcademicYear, isArchived: false };
    if (gradeFilter) filter.grade = Number(gradeFilter);

    const sourceSections = await Section.find(filter);
    if (!sourceSections.length) {
      throw new ApiError(400, `No sections found for academic year ${fromAcademicYear}`);
    }

    const created: any[] = [];
    const skipped: any[] = [];

    for (const src of sourceSections) {
      const newGrade = Math.min(src.grade + 1, 12) as 9 | 10 | 11 | 12;
      const newName = `${newGrade}${src.name.replace(/^\d+/, '')}`;

      const existing = await Section.findOne({ name: newName, academicYear: toAcademicYear });
      if (existing) {
        skipped.push({ name: newName, reason: 'Already exists' });
        continue;
      }

      const section = await Section.create({
        name: newName,
        grade: newGrade,
        stream: src.stream,
        academicYear: toAcademicYear,
        capacity: src.capacity,
        classroom: src.classroom,
        building: src.building,
        floor: src.floor,
        roomNumber: src.roomNumber,
        isActive: true,
      });

      await AuditLog.create({
        userId: req.user.id,
        activityType: 'SECTION_ROLLOVER',
        description: `Rolled over section ${src.name} (${fromAcademicYear}) → ${section.name} (${toAcademicYear})`,
        ipAddress: req.ip,
        metadata: { fromSection: src.name, toSection: section.name, fromAY: fromAcademicYear, toAY: toAcademicYear, rolledOverBy: req.user.userId },
      });

      created.push(section);
    }

    res.json({
      success: true,
      message: `${created.length} sections rolled over, ${skipped.length} skipped`,
      data: { created, skipped },
    });
  } catch (error) {
    next(error);
  }
};



/**
 * Get section enrollment trend (history of student counts)
 */
export const getSectionEnrollmentTrend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');

    const terms = ['1', '2'];
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentYear = new Date().getFullYear();
    const trend: { term: string; month: string; count: number }[] = [];

    for (const term of terms) {
      for (const month of months) {
        const count = await Student.countDocuments({
          section: section._id,
          status: 'Active',
          createdAt: { $lte: new Date(currentYear, months.indexOf(month), 1) },
        });
        trend.push({ term: `Term ${term}`, month, count });
      }
    }

    res.json({ success: true, data: { sectionId: section._id, sectionName: section.name, trend } });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate section reports (roster, performance, attendance, teacher-assignment)
 */
export const generateSectionReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { type, academicYear } = req.query;

    if (!type) throw new ApiError(400, 'Report type is required: roster, performance, attendance, teacher-assignment');

    const section = await Section.findById(id)
      .populate('classroom', 'roomNumber building');
    if (!section) throw new ApiError(404, 'Section not found');

    const ay = (academicYear as string) || section.academicYear;

    let reportData: any = {};

    switch (type) {
      case 'roster': {
        const students = await Student.find({ section: id, status: 'Active' })
          .select('studentId firstName lastName gender dateOfBirth guardianName guardianPhone')
          .sort({ lastName: 1, firstName: 1 });
        reportData = {
          reportType: 'Student Roster',
          section: { name: section.name, grade: section.grade, stream: section.stream, academicYear: ay },
          totalStudents: students.length,
          capacity: section.capacity,
          classroom: section.classroom,
          students,
        };
        break;
      }
      case 'performance': {
        const Assessment = mongoose.model('Assessment');
        const AssessmentMark = mongoose.model('AssessmentMark');
        const students = await Student.find({ section: id, status: 'Active' }).select('_id studentId firstName lastName');
        const studentIds = students.map(s => s._id);

        const assessments = await Assessment.find({ section: id, academicYear: ay, status: { $in: ['Approved', 'Published'] } })
          .select('_id title subject totalMarks');
        const assessmentIds = assessments.map(a => a._id);

        const marks = assessmentIds.length > 0
          ? await AssessmentMark.find({ assessment: { $in: assessmentIds }, student: { $in: studentIds } })
          : [];

        const studentResults = students.map(student => {
          const studentMarks = marks.filter(m => m.student.toString() === student._id.toString());
          const totalObtained = studentMarks.reduce((s, m) => s + (m.marksObtained || 0), 0);
          const totalPossible = studentMarks.reduce((s, m) => {
            const assessment = assessments.find(a => a._id.toString() === m.assessment.toString());
            return s + (assessment?.totalMarks || 0);
          }, 0);
          const avg = studentMarks.length > 0
            ? studentMarks.reduce((s, m) => s + (m.percentage || 0), 0) / studentMarks.length
            : 0;
          return {
            student: { studentId: student.studentId, firstName: student.firstName, lastName: student.lastName },
            totalMarksObtained: totalObtained,
            totalMarksPossible: totalPossible,
            average: Math.round(avg * 100) / 100,
            assessmentsCount: studentMarks.length,
          };
        });

        studentResults.sort((a, b) => b.average - a.average);
        const sectionAvg = studentResults.length > 0
          ? studentResults.reduce((s, r) => s + r.average, 0) / studentResults.length
          : 0;

        reportData = {
          reportType: 'Performance Report',
          section: { name: section.name, grade: section.grade, stream: section.stream, academicYear: ay },
          totalStudents: students.length,
          sectionAverage: Math.round(sectionAvg * 100) / 100,
          highestAverage: studentResults[0]?.average || 0,
          lowestAverage: studentResults[studentResults.length - 1]?.average || 0,
          assessmentsCount: assessments.length,
          studentResults,
        };
        break;
      }
      case 'attendance': {
        const Attendance = mongoose.model('Attendance');
        const students = await Student.find({ section: id, status: 'Active' }).select('_id studentId firstName lastName');
        const studentIds = students.map(s => s._id);

        const totalRecords = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay });
        const presentRecords = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay, status: 'Present' });
        const absentRecords = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay, status: 'Absent' });
        const lateRecords = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay, status: 'Late' });

        const studentAttendance = await Promise.all(
          students.map(async (student) => {
            const total = await Attendance.countDocuments({ student: student._id, academicYear: ay });
            const present = await Attendance.countDocuments({ student: student._id, academicYear: ay, status: 'Present' });
            const absent = await Attendance.countDocuments({ student: student._id, academicYear: ay, status: 'Absent' });
            const late = await Attendance.countDocuments({ student: student._id, academicYear: ay, status: 'Late' });
            return {
              student: { studentId: student.studentId, firstName: student.firstName, lastName: student.lastName },
              total,
              present,
              absent,
              late,
              rate: total > 0 ? Math.round((present / total) * 10000) / 100 : 0,
            };
          })
        );

        reportData = {
          reportType: 'Attendance Report',
          section: { name: section.name, grade: section.grade, stream: section.stream, academicYear: ay },
          totalStudents: students.length,
          totalRecords,
          presentRecords,
          absentRecords,
          lateRecords,
          attendanceRate: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 10000) / 100 : 0,
          studentAttendance,
        };
        break;
      }
      case 'teacher-assignment': {
        const TeacherAssignment = mongoose.model('TeacherAssignment');
        const assignments = await TeacherAssignment.find({ section: id, academicYear: ay })
          .populate('teacher', 'firstName lastName teacherId')
          .populate('subject', 'name code');
        reportData = {
          reportType: 'Teacher Assignment Report',
          section: { name: section.name, grade: section.grade, stream: section.stream, academicYear: ay },
          totalAssignments: assignments.length,
          assignments,
        };
        break;
      }
      default:
        throw new ApiError(400, `Unknown report type: ${type}. Use: roster, performance, attendance, teacher-assignment`);
    }

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_REPORT',
      description: `${reportData.reportType} generated for section ${section.name}`,
      ipAddress: req.ip,
      metadata: { sectionId: section._id, sectionName: section.name, reportType: type, academicYear: ay, generatedBy: req.user.userId },
    });

    res.json({ success: true, message: `${reportData.reportType} generated`, data: reportData });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section subjects with teacher assignments detail
 */
export const getSectionSubjectsDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { academicYear } = req.query;

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');

    const ay = (academicYear as string) || section.academicYear;
    const curriculumSubjects = await getSubjectsFromDatabase(section.grade, section.stream);

    const TeacherAssignment = mongoose.model('TeacherAssignment');
    const assignments = await TeacherAssignment.find({ section: id, academicYear: ay })
      .populate('teacher', 'firstName lastName teacherId')
      .populate('subject', 'name code');

    const subjectTeacherMap = new Map<string, any>();
    for (const assignment of assignments) {
      const subjectId = assignment.subject?._id?.toString() || assignment.subject?.toString();
      if (subjectId) {
        if (!subjectTeacherMap.has(subjectId)) {
          subjectTeacherMap.set(subjectId, []);
        }
        subjectTeacherMap.get(subjectId)!.push(assignment);
      }
    }

    const subjects = curriculumSubjects.map((subj: any) => {
      const teachers = subjectTeacherMap.get(subj._id?.toString()) || [];
      return {
        ...subj,
        assignedTeachers: teachers.map((t: any) => ({
          assignmentId: t._id,
          teacher: t.teacher,
        })),
        teacherCount: teachers.length,
      };
    });

    res.json({
      success: true,
      data: {
        section: { _id: section._id, name: section.name, grade: section.grade, stream: section.stream },
        academicYear: ay,
        subjects,
        totalSubjects: subjects.length,
        totalAssignments: assignments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive section analytics with trend data
 */
export const getSectionAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { academicYear } = req.query;

    const section = await Section.findById(id)
      .populate('classroom', 'roomNumber building');
    if (!section) throw new ApiError(404, 'Section not found');

    const ay = (academicYear as string) || section.academicYear;
    const Assessment = mongoose.model('Assessment');
    const AssessmentMark = mongoose.model('AssessmentMark');
    const Attendance = mongoose.model('Attendance');
    const TeacherAssignment = mongoose.model('TeacherAssignment');

    // Student stats
    const totalStudents = await Student.countDocuments({ section: id, status: 'Active' });
    const maleStudents = await Student.countDocuments({ section: id, status: 'Active', gender: 'Male' });
    const femaleStudents = await Student.countDocuments({ section: id, status: 'Active', gender: 'Female' });

    // Performance stats
    const students = await Student.find({ section: id, status: 'Active' }).select('_id studentId firstName lastName gender');
    const studentIds = students.map(s => s._id);

    const assessments = await Assessment.find({ section: id, academicYear: ay, status: { $in: ['Approved', 'Published'] } })
      .select('_id title subject totalMarks type');
    const assessmentIds = assessments.map(a => a._id);

    const marks = assessmentIds.length > 0
      ? await AssessmentMark.find({ assessment: { $in: assessmentIds }, student: { $in: studentIds } })
      : [];

    // Per-subject averages
    const subjectPerformance: { subjectId: string; subjectName: string; average: number; totalMarks: number; studentCount: number }[] = [];
    const subjectMap = new Map<string, { name: string; marks: number[]; totalMarks: number }>();

    for (const assessment of assessments) {
      if (!subjectMap.has(assessment.subject.toString())) {
        const subjName = await getSubjectName(assessment.subject);
        subjectMap.set(assessment.subject.toString(), { name: subjName, marks: [], totalMarks: 0 });
      }
    }

    for (const mark of marks) {
      const assessment = assessments.find(a => a._id.toString() === mark.assessment.toString());
      if (assessment) {
        const entry = subjectMap.get(assessment.subject.toString());
        if (entry) {
          entry.marks.push(mark.percentage);
          entry.totalMarks += mark.marksObtained || 0;
        }
      }
    }

    for (const [subjectId, data] of subjectMap) {
      const avg = data.marks.length > 0 ? data.marks.reduce((s, m) => s + m, 0) / data.marks.length : 0;
      subjectPerformance.push({
        subjectId,
        subjectName: data.name,
        average: Math.round(avg * 100) / 100,
        totalMarks: data.totalMarks,
        studentCount: data.marks.length,
      });
    }

    // Student performance distribution
    const studentAverages: number[] = [];
    const studentMap = new Map<string, number[]>();
    for (const mark of marks) {
      const sid = mark.student.toString();
      if (!studentMap.has(sid)) studentMap.set(sid, []);
      studentMap.get(sid)!.push(mark.percentage);
    }
    for (const [, pcts] of studentMap) {
      studentAverages.push(pcts.reduce((s, p) => s + p, 0) / pcts.length);
    }

    const distribution = {
      excellent: studentAverages.filter(a => a >= 90).length,
      good: studentAverages.filter(a => a >= 75 && a < 90).length,
      satisfactory: studentAverages.filter(a => a >= 50 && a < 75).length,
      needsImprovement: studentAverages.filter(a => a >= 35 && a < 50).length,
      poor: studentAverages.filter(a => a < 35).length,
    };

    const sectionAvg = studentAverages.length > 0
      ? studentAverages.reduce((s, a) => s + a, 0) / studentAverages.length
      : 0;

    const topPerformers = students
      .map(s => {
        const sMarks = marks.filter(m => m.student.toString() === s._id.toString());
        const avg = sMarks.length > 0 ? sMarks.reduce((sum, m) => sum + m.percentage, 0) / sMarks.length : 0;
        return { studentId: s.studentId, firstName: s.firstName, lastName: s.lastName, gender: s.gender, average: Math.round(avg * 100) / 100 };
      })
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);

    // Attendance analytics
    const totalAttendanceRecords = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay });
    const presentCount = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay, status: 'Present' });
    const absentCount = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay, status: 'Absent' });
    const lateCount = await Attendance.countDocuments({ student: { $in: studentIds }, academicYear: ay, status: 'Late' });

    // Monthly attendance trend
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyAttendance = await Promise.all(
      months.map(async (month) => {
        const monthIndex = months.indexOf(month) + 9;
        const year = monthIndex <= 12 ? new Date().getFullYear() - 1 : new Date().getFullYear();
        const startOfMonth = new Date(year, monthIndex - 1, 1);
        const endOfMonth = new Date(year, monthIndex, 0);

        const monthRecords = await Attendance.countDocuments({
          student: { $in: studentIds },
          academicYear: ay,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        });
        const monthPresent = await Attendance.countDocuments({
          student: { $in: studentIds },
          academicYear: ay,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          status: 'Present',
        });

        return {
          month,
          total: monthRecords,
          present: monthPresent,
          rate: monthRecords > 0 ? Math.round((monthPresent / monthRecords) * 10000) / 100 : 0,
        };
      })
    );

    // Teacher assignments count
    const teacherAssignmentCount = await TeacherAssignment.countDocuments({ section: id, academicYear: ay });

    // Capacity utilization
    const capacityUtilization = section.capacity > 0
      ? Math.round((totalStudents / section.capacity) * 10000) / 100
      : 0;

    res.json({
      success: true,
      data: {
        section: { _id: section._id, name: section.name, grade: section.grade, stream: section.stream, academicYear: ay },
        overview: {
          totalStudents,
          maleStudents,
          femaleStudents,
          capacity: section.capacity,
          capacityUtilization,
          classroom: section.classroom,
        },
        performance: {
          sectionAverage: Math.round(sectionAvg * 100) / 100,
          subjectPerformance,
          distribution,
          topPerformers,
          totalAssessments: assessments.length,
        },
        attendance: {
          totalRecords: totalAttendanceRecords,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate: totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 10000) / 100 : 0,
          monthlyTrend: monthlyAttendance,
        },
        teachers: {
          totalAssignments: teacherAssignmentCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

async function getSubjectName(subjectId: mongoose.Types.ObjectId): Promise<string> {
  try {
    const Subject = mongoose.model('Subject');
    const subject = await Subject.findById(subjectId).select('name');
    return subject?.name || 'Unknown Subject';
  } catch {
    return 'Unknown Subject';
  }
}

/**
 * Archive multiple sections at once
 */
export const archiveMultipleSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { sectionIds, reason } = req.body;

    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      throw new ApiError(400, 'sectionIds array is required');
    }

    const results = { archived: 0, failed: 0, errors: [] as any[] };

    for (const sectionId of sectionIds) {
      const section = await Section.findById(sectionId);
      if (!section) {
        results.failed++;
        results.errors.push({ sectionId, error: 'Section not found' });
        continue;
      }
      if (section.isArchived) {
        results.failed++;
        results.errors.push({ sectionId, error: `Section ${section.name} is already archived` });
        continue;
      }

      section.isArchived = true;
      section.isActive = false;
      section.archivedAt = new Date();
      section.archivedBy = new mongoose.Types.ObjectId(req.user.id);
      section.archiveReason = reason || 'Batch archived by administrator';
      section.statusHistory.push({
        status: 'Archived',
        changedAt: new Date(),
        changedBy: new mongoose.Types.ObjectId(req.user.id),
        reason: reason || 'Batch archived by administrator',
      });
      await section.save();

      await AuditLog.create({
        userId: req.user.id,
        activityType: 'SECTION_ARCHIVE',
        description: `Section batch archived: ${section.name}`,
        ipAddress: req.ip,
        metadata: { sectionId: section._id, sectionName: section.name, reason: reason || 'Batch archive', archivedBy: req.user.userId },
      });

      results.archived++;
    }

    res.json({
      success: true,
      message: `${results.archived} sections archived, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign homeroom teacher to section
 */
export const assignHomeroomTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { teacherId } = req.body;

    const section = await Section.findById(id);
    if (!section) throw new ApiError(404, 'Section not found');

    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) throw new ApiError(404, 'Teacher not found');
      if (teacher.status !== 'Active') throw new ApiError(400, 'Teacher is not active');
    }

    const oldTeacher = section.assistantTeacher;
    section.assistantTeacher = teacherId ? new mongoose.Types.ObjectId(teacherId) : undefined;
    await section.save();

    const newTeacherName = teacherId
      ? (await Teacher.findById(teacherId))?.firstName + ' ' + (await Teacher.findById(teacherId))?.lastName
      : 'None';

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_UPDATE',
      description: `Homeroom teacher assigned to ${section.name}: ${newTeacherName}`,
      ipAddress: req.ip,
      metadata: {
        sectionId: section._id,
        sectionName: section.name,
        oldTeacher: oldTeacher?.toString() || 'None',
        newTeacher: teacherId || 'None',
        updatedBy: req.user.userId,
      },
    });

    const updated = await Section.findById(id).populate('assistantTeacher', 'firstName lastName teacherId employeeId');

    res.json({
      success: true,
      message: 'Homeroom teacher assigned successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Merge two sections - moves all students from source to target
 */
export const mergeSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { sourceSectionId, targetSectionId, reason } = req.body;

    if (!sourceSectionId || !targetSectionId) {
      throw new ApiError(400, 'sourceSectionId and targetSectionId are required');
    }
    if (sourceSectionId === targetSectionId) {
      throw new ApiError(400, 'Cannot merge a section with itself');
    }

    const [sourceSection, targetSection] = await Promise.all([
      Section.findById(sourceSectionId),
      Section.findById(targetSectionId),
    ]);

    if (!sourceSection) throw new ApiError(404, 'Source section not found');
    if (!targetSection) throw new ApiError(404, 'Target section not found');
    if (sourceSection.grade !== targetSection.grade) {
      throw new ApiError(400, 'Cannot merge sections from different grades');
    }
    if (!targetSection.isActive || targetSection.isArchived) {
      throw new ApiError(400, 'Target section is not active');
    }

    const sourceStudents = await Student.find({ section: sourceSectionId, status: 'Active' });
    const targetCount = await Student.countDocuments({ section: targetSectionId, status: 'Active' });

    if (targetCount + sourceStudents.length > targetSection.capacity) {
      throw new ApiError(400,
        `Target section capacity (${targetSection.capacity}) would be exceeded. Current: ${targetCount}, Adding: ${sourceStudents.length}`
      );
    }

    let moved = 0;
    const ay = targetSection.academicYear;

    for (const student of sourceStudents) {
      student.section = new mongoose.Types.ObjectId(targetSectionId);
      student.grade = targetSection.grade;
      if (!student.statusHistory) student.statusHistory = [];
      student.statusHistory.push({
        status: 'Transferred',
        changedAt: new Date(),
        changedBy: new mongoose.Types.ObjectId(req.user.id),
        reason: reason || `Section merged from ${sourceSection.name} to ${targetSection.name}`,
      });
      await student.save();

      await TransferLog.create({
        student: student._id,
        fromSection: sourceSection._id,
        toSection: targetSection._id,
        fromGrade: sourceSection.grade,
        toGrade: targetSection.grade,
        reason: reason || `Section merge: ${sourceSection.name} -> ${targetSection.name}`,
        transferredBy: new mongoose.Types.ObjectId(req.user.id),
        transferredAt: new Date(),
        type: 'Section',
      });

      moved++;
    }

    sourceSection.isArchived = true;
    sourceSection.isActive = false;
    sourceSection.archivedAt = new Date();
    sourceSection.archivedBy = new mongoose.Types.ObjectId(req.user.id);
    sourceSection.archiveReason = reason || `Merged into ${targetSection.name}`;
    sourceSection.statusHistory.push({
      status: 'Merged',
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: reason || `Merged into ${targetSection.name}`,
    });
    await sourceSection.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_UPDATE',
      description: `Sections merged: ${sourceSection.name} -> ${targetSection.name} (${moved} students moved)`,
      ipAddress: req.ip,
      metadata: {
        sourceSectionId: sourceSection._id,
        targetSectionId: targetSection._id,
        studentsMoved: moved,
        mergedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: `${sourceSection.name} merged into ${targetSection.name}. ${moved} students transferred.`,
      data: { moved, sourceSection: sourceSection.name, targetSection: targetSection.name },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk transfer students between sections
 */
export const bulkTransferStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { studentIds, targetSectionId, reason } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, 'studentIds array is required');
    }
    if (!targetSectionId) {
      throw new ApiError(400, 'targetSectionId is required');
    }

    const targetSection = await Section.findById(targetSectionId);
    if (!targetSection) throw new ApiError(404, 'Target section not found');
    if (!targetSection.isActive || targetSection.isArchived) {
      throw new ApiError(400, 'Target section is not active');
    }

    const targetCount = await Student.countDocuments({ section: targetSectionId, status: 'Active' });
    if (targetCount + studentIds.length > targetSection.capacity) {
      throw new ApiError(400,
        `Target section capacity (${targetSection.capacity}) would be exceeded. Current: ${targetCount}, Adding: ${studentIds.length}`
      );
    }

    const results = { transferred: 0, failed: 0, errors: [] as any[] };

    for (const studentId of studentIds) {
      try {
        const student = await Student.findById(studentId);
        if (!student) {
          results.failed++;
          results.errors.push({ studentId, error: 'Student not found' });
          continue;
        }
        if (student.status !== 'Active') {
          results.failed++;
          results.errors.push({ studentId, error: 'Student is not active' });
          continue;
        }

        const sourceSection = student.section ? await Section.findById(student.section) : null;

        student.section = new mongoose.Types.ObjectId(targetSectionId);
        student.grade = targetSection.grade;
        if (!student.statusHistory) student.statusHistory = [];
        student.statusHistory.push({
          status: 'Transferred',
          changedAt: new Date(),
          changedBy: new mongoose.Types.ObjectId(req.user.id),
          reason: reason || `Bulk transfer from ${sourceSection?.name || 'None'} to ${targetSection.name}`,
        });
        await student.save();

        await TransferLog.create({
          student: student._id,
          fromSection: sourceSection?._id,
          toSection: targetSection._id,
          fromGrade: sourceSection?.grade,
          toGrade: targetSection.grade,
          reason: reason || 'Bulk transfer',
          transferredBy: new mongoose.Types.ObjectId(req.user.id),
          transferredAt: new Date(),
          type: 'Section',
        });

        results.transferred++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ studentId, error: err.message });
      }
    }

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_TRANSFER',
      description: `Bulk transfer: ${results.transferred} students to ${targetSection.name}`,
      ipAddress: req.ip,
      metadata: {
        targetSectionId: targetSection._id,
        targetSectionName: targetSection.name,
        transferred: results.transferred,
        failed: results.failed,
        transferredBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: `${results.transferred} transferred, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get section class roster (student list with details for printable roster)
 */
export const getSectionClassRoster = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { academicYear } = req.query;

    const section = await Section.findById(id)
      .populate('assistantTeacher', 'firstName lastName teacherId employeeId')
      .populate('classroom', 'roomNumber building');

    if (!section) throw new ApiError(404, 'Section not found');

    const students = await Student.find({ section: id, status: 'Active' })
      .select('studentId firstName lastName gender dateOfBirth phone address guardianName guardianPhone admissionNumber')
      .sort({ firstName: 1, lastName: 1 });

    const teacherAssignments = await TeacherAssignment.find({ section: id, isActive: true })
      .populate('teacher', 'firstName lastName teacherId')
      .populate('subject', 'name code');

    const subjectTeachers = teacherAssignments.map((ta) => ({
      subject: (ta.subject as any)?.name,
      teacher: `${(ta.teacher as any)?.firstName} ${(ta.teacher as any)?.lastName}`,
      periodsPerWeek: ta.periodsPerWeek,
    }));

    const maleCount = students.filter((s) => s.gender === 'Male').length;
    const femaleCount = students.filter((s) => s.gender === 'Female').length;

    res.json({
      success: true,
      data: {
        section: {
          _id: section._id,
          name: section.name,
          sectionCode: section.sectionCode,
          grade: section.grade,
          stream: section.stream,
          academicYear: section.academicYear || academicYear,
          capacity: section.capacity,
          classroom: section.classroom,
          homeroomTeacher: section.assistantTeacher,
        },
        students: students.map((s, i) => ({
          no: i + 1,
          _id: s._id,
          studentId: s.studentId,
          admissionNumber: s.admissionNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          fullName: `${s.firstName} ${s.lastName}`,
          gender: s.gender,
          dateOfBirth: s.dateOfBirth,
          phone: s.phone,
          address: s.address,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
        })),
        subjectTeachers,
        summary: {
          totalStudents: students.length,
          maleCount,
          femaleCount,
          capacity: section.capacity,
          occupancyRate: section.capacity > 0 ? Math.round((students.length / section.capacity) * 100) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


