import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Student, Guardian, User, AuditLog, Section, Notification, StudentSubject, TransferLog, AnnualResult } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { StudentStatus, UserRole, Stream, GradeLevel, NotificationType } from '../types';
import { logger } from '../utils/logger';
import { getCurrentAcademicYear } from '../utils/academicYear.util';
import { hashPassword } from '../utils/password.util';
import { generateTempPassword } from '../utils/account.util';
import { getNextSequence } from '../models';
import { getSubjectsFromDatabase } from '../services/curriculum.service';
import mongoose from 'mongoose';

/**
 * Register a new student (creates student record with PENDING_APPROVAL status)
 * Student ID is auto-generated in S00001+ sequential format.
 * No User account is created until admission is approved.
 */
export const registerStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const {
      firstName, lastName, dateOfBirth, gender, nationality,
      grade, sectionId, stream, address, emergencyContact,
      previousSchool, academicYear, medicalInfo,
      guardianName, guardianPhone, guardianEmail, guardianRelationship,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !gender || !grade) {
      throw new ApiError(400, 'Missing required fields: firstName, lastName, dateOfBirth, gender, grade');
    }

    // Validate grade
    if (![9, 10, 11, 12].includes(grade)) {
      throw new ApiError(400, 'Invalid grade. Must be 9, 10, 11, or 12');
    }

    // Validate stream for grades 11-12
    if ((grade === 11 || grade === 12) && !stream) {
      throw new ApiError(400, 'Stream is required for grades 11 and 12');
    }

    if (stream && !Object.values(Stream).includes(stream)) {
      throw new ApiError(400, 'Invalid stream');
    }

    // Validate section exists
    if (sectionId) {
      const section = await Section.findById(sectionId);
      if (!section) throw new ApiError(404, 'Section not found');
      if (section.grade !== grade) throw new ApiError(400, 'Section grade does not match student grade');
    }

    // Auto-create guardian record from form data if provided
    let guardianIds: mongoose.Types.ObjectId[] = [];
    let parentCredential: { name: string; username: string; tempPassword: string; relationship: string } | undefined;
    if (guardianName || guardianPhone) {
      const gRelation = guardianRelationship || 'Guardian';
      if (!['Father', 'Mother', 'Guardian', 'Other'].includes(gRelation)) {
        throw new ApiError(400, 'Invalid guardian relationship');
      }
      const nameParts = guardianName.split(' ');
      const gFirstName = nameParts[0] || guardianName;
      const gLastName = nameParts.slice(1).join(' ') || 'Unknown';
      const gEmail = guardianEmail || `${gFirstName.toLowerCase()}.${gLastName.toLowerCase()}@parent.essms.edu`;

      const existingGuardian = await Guardian.findOne({
        $or: [
          { phone: guardianPhone },
          guardianEmail ? { email: guardianEmail } : {},
        ].filter(Boolean),
      });

      let guardian: any;
      let gTempPassword: string | undefined;
      if (existingGuardian) {
        guardian = existingGuardian;
      } else {
        const guardianId = await getNextSequence('P');
        const gUsername = guardianId;
        gTempPassword = generateTempPassword(gUsername);
        const gHashedPassword = await hashPassword(gTempPassword);

        const gUser = await User.create({
          username: gUsername,
          email: guardianEmail || gEmail,
          passwordHash: gHashedPassword,
          role: UserRole.PARENT,
          firstName: gFirstName,
          lastName: gLastName,
          isActive: true,
          forcePasswordChange: true,
        });

        guardian = await Guardian.create({
          guardianId,
          userId: gUser._id,
          firstName: gFirstName,
          lastName: gLastName,
          relationship: gRelation,
          phone: guardianPhone || '',
          email: guardianEmail || gEmail,
          students: [],
        });
      }
      guardianIds = [guardian._id];
      parentCredential = gTempPassword ? {
        name: `${guardian.firstName} ${guardian.lastName}`,
        username: guardian.guardianId || guardian.firstName?.toLowerCase(),
        tempPassword: gTempPassword,
        relationship: guardian.relationship,
      } : undefined;
    }

    // Generate sequential student ID (e.g., S00001, S00002)
    const studentId = await getNextSequence('S');
    const ay = academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const admSeq = await getNextSequence('ADM');
    const admissionNumber = `ADM-${admSeq}`;

    // Create student record WITHOUT user account (pending approval)
    const student = await Student.create({
      studentId,
      admissionNumber,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      nationality: nationality || 'Ethiopian',
      grade,
      section: sectionId,
      stream: stream || undefined,
      academicYear: ay,
      enrollmentDate: new Date(),
      status: StudentStatus.PENDING_APPROVAL,
      guardians: guardianIds,
      address: address || {},
      emergencyContact: emergencyContact || {},
      previousSchool,
      medicalInfo: medicalInfo || undefined,
    });

    // If we auto-created a guardian, link it to the student
    if (guardianIds.length > 0) {
      await Guardian.updateOne(
        { _id: guardianIds[0] },
        { $addToSet: { students: student._id } }
      );
    }

    // Log student registration
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_REGISTRATION',
      description: `New student registered: ${student.fullName} (${studentId})`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        grade: student.grade,
        section: sectionId,
        status: StudentStatus.PENDING_APPROVAL,
        registeredBy: req.user.userId,
      },
    });

    logger.info(`Student registered (pending approval)`, {
      studentId: student.studentId,
      name: student.fullName,
      grade: student.grade,
      registeredBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully. Admission pending approval.',
      data: {
        studentId: student.studentId,
        _id: student._id,
        fullName: student.fullName,
        grade: student.grade,
        status: student.status,
        academicYear: ay,
        admissionNumber,
        parentCredentials: parentCredential ?? undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve student admission - creates User account and activates the student
 * Username = student ID (e.g., S00026)
 * Temp password = studentId@School (e.g., S00026@School)
 */
export const approveStudentAdmission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (student.status !== StudentStatus.PENDING_APPROVAL) {
      throw new ApiError(400, `Student status is "${student.status}". Only pending approval students can be admitted.`);
    }
    if (student.userId) {
      throw new ApiError(400, 'Student already has a user account');
    }

    // Generate user account with studentId as username
    const username = student.studentId;
    const tempPassword = generateTempPassword(username);
    const hashedPassword = await hashPassword(tempPassword);

    const email = req.body.email || `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@student.essms.edu`;

    const user = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      firstName: student.firstName,
      lastName: student.lastName,
      isActive: true,
      forcePasswordChange: true,
    });

    // Update student record
    student.userId = user._id;
    student.status = StudentStatus.ACTIVE;
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({
      status: StudentStatus.ACTIVE,
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: 'Admission approved',
    });
    await student.save();

    // Auto-enroll in section subjects if a section is assigned
    if (student.section) {
      const ay = student.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
      await enrollStudentInSectionSubjects(
        student._id as mongoose.Types.ObjectId,
        student.section as mongoose.Types.ObjectId,
        student.grade,
        student.stream,
        ay
      );
    }

    // Send notification to student's guardians (create parent accounts if needed)
    if (student.guardians && student.guardians.length > 0) {
      for (const gId of student.guardians) {
        const guardian = await Guardian.findById(gId);
        if (!guardian) continue;
        if (!guardian.userId) {
          const gUsername = guardian.guardianId;
          const gTempPassword = generateTempPassword(gUsername);
          const gHashedPassword = await hashPassword(gTempPassword);
          const gUser = await User.create({
            username: gUsername,
            email: guardian.email || `${guardian.firstName.toLowerCase()}.${guardian.lastName.toLowerCase()}@parent.essms.edu`,
            passwordHash: gHashedPassword,
            role: UserRole.PARENT,
            firstName: guardian.firstName,
            lastName: guardian.lastName,
            isActive: true,
            forcePasswordChange: true,
          });
          guardian.userId = gUser._id;
          await guardian.save();
        }
        if (guardian.userId) {
          await Notification.create({
            recipient: guardian.userId,
            type: NotificationType.ACADEMIC,
            title: 'Admission Approved',
            message: `${student.firstName} ${student.lastName}'s admission has been approved. Username: ${username}`,
          });
        }
      }
    }

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_ADMISSION_APPROVED',
      description: `Student admission approved: ${student.fullName} (${student.studentId})`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        userId: user._id,
        username,
        grade: student.grade,
        approvedBy: req.user.userId,
      },
    });

    logger.info(`Student admission approved`, {
      studentId: student.studentId,
      name: student.fullName,
      username,
      approvedBy: req.user.userId,
    });

    // Collect parent credentials for the response
    const parentCredentials: any[] = [];
    if (student.guardians && student.guardians.length > 0) {
      for (const gId of student.guardians) {
        const guardian = await Guardian.findById(gId);
        if (guardian?.userId) {
          const gUser = await User.findById(guardian.userId).select('username');
          if (gUser) {
            parentCredentials.push({
              name: `${guardian.firstName} ${guardian.lastName}`,
              username: gUser.username,
              relationship: guardian.relationship,
            });
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Admission approved. Student account created successfully.',
      data: {
        studentId: student.studentId,
        _id: student._id,
        fullName: student.fullName,
        grade: student.grade,
        status: StudentStatus.ACTIVE,
        credentials: {
          username,
          tempPassword,
        },
        parentCredentials: parentCredentials.length > 0 ? parentCredentials : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student profile by ID
 * Implements Req 4.2 with row-level security
 */
export const getStudentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate('userId', 'email userId username')
      .populate('section', 'name grade stream')
      .populate('guardians', 'firstName lastName phone email relationship');

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Row-level security: students can only view their own profile
    if (req.user?.role === UserRole.STUDENT) {
      const self = await Student.findOne({ userId: req.user.id }).select('_id');
      if (!self || self._id.toString() !== id) {
        throw new ApiError(403, 'You can only view your own profile');
      }
    }

    // Parents can only view their children's profiles
    if (req.user?.role === UserRole.PARENT) {
      const guardian = await Guardian.findOne({ userId: req.user.id }).select('students');
      const isChild = guardian?.students?.some((s: any) => s.toString() === id);
      if (!isChild) {
        throw new ApiError(403, 'You can only view your child\'s profile');
      }
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently logged-in student's own profile
 * Student self-service endpoint
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const student = await Student.findOne({ userId: req.user.id })
      .populate('userId', 'email userId username')
      .populate('section', 'name grade stream')
      .populate('guardians', 'firstName lastName phone email relationship');

    if (!student) {
      throw new ApiError(404, 'Student profile not found');
    }

    const { AssessmentMark, Attendance } = await import('../models');

    // Recent marks summary
    const marks = await AssessmentMark.find({ student: student._id })
      .populate({ path: 'assessment', select: 'type totalMarks subject term' })
      .sort({ createdAt: -1 }).limit(20);

    // Attendance summary
    const attendanceRecords = await Attendance.find({ student: student._id }).sort({ date: -1 }).limit(100);
    const presentCount = attendanceRecords.filter((a: any) => a.status === 'Present').length;
    const lateCount = attendanceRecords.filter((a: any) => a.status === 'Late').length;
    const absentCount = attendanceRecords.filter((a: any) => a.status === 'Absent').length;
    const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

    // Subject enrollments
    const enrollments = await StudentSubject.find({ student: student._id, status: 'Active' })
      .populate('subject', 'name code creditHours');

    const totalScore = marks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
    const average = marks.length > 0 ? Math.round(totalScore / marks.length) : 0;

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        marks,
        attendance: { present: presentCount, late: lateCount, absent: absentCount, total: attendanceRecords.length, rate: attendanceRate },
        subjects: enrollments,
        average,
        totalAssessments: marks.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update currently logged-in student's own profile
 * Limited to fields a student can change (phone, address, emergency contact, medical info, photo)
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) throw new ApiError(404, 'Student profile not found');

    const updates = req.body;

    // Only allow specific fields for student self-update
    const allowedSelfFields = [
      'phone',
      'address',
      'emergencyContact',
      'medicalInfo',
    ];

    const changes: any = {};
    allowedSelfFields.forEach((field) => {
      if (updates[field] !== undefined) {
        changes[field] = { old: (student as any)[field], new: updates[field] };
        (student as any)[field] = updates[field];
      }
    });

    if (req.file) {
      changes.photo = { old: student.photo, new: (req.file as any)?.path || `/uploads/students/${req.file.filename}` };
      student.photo = (req.file as any)?.path || `/uploads/students/${req.file.filename}`;
    }

    await student.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_UPDATE',
      description: `Student ${student.studentId} updated own profile`,
      ipAddress: req.ip,
      metadata: { studentId: student.studentId, changes, updatedBy: req.user.userId },
    });

    res.json({ success: true, message: 'Profile updated', data: student });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student profile
 * Implements Req 4.2, 4.3
 */
export const updateStudentProfile = async (
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

    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Prevent certain fields from being updated
    delete updates.studentId;
    delete updates.userId;
    delete updates.enrollmentDate;
    delete updates.status; // Use specific endpoints for status changes

    // Track changes for history
    const changes: any = {};
    const allowedFields = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'nationality',
      'phone',
      'address',
      'emergencyContact',
      'guardians',
      'previousSchool',
      'academicYear',
      'medicalInfo',
      'stream',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        changes[field] = {
          old: (student as any)[field],
          new: updates[field],
        };
        (student as any)[field] = updates[field];
      }
    });

    // Handle section change: enroll in subjects and create TransferLog
    if (updates.sectionId && updates.sectionId !== student.section?.toString()) {
      const section = await Section.findById(updates.sectionId);
      if (!section) throw new ApiError(404, 'Section not found');
      if (!section.isActive || section.isArchived) throw new ApiError(400, 'Section is not active');

      const oldSectionId = student.section?.toString();
      const oldGrade = student.grade;

      student.section = new mongoose.Types.ObjectId(updates.sectionId);
      student.grade = section.grade;
      if (section.stream && (section.grade >= 11)) {
        student.stream = section.stream;
      }
      if (!student.statusHistory) student.statusHistory = [];
      student.statusHistory.push({
        status: student.status,
        changedAt: new Date(),
        changedBy: new mongoose.Types.ObjectId(req.user.id),
        reason: `Section changed to ${section.name}`,
      });

      changes.section = { old: oldSectionId, new: updates.sectionId };
      changes.grade = { old: oldGrade, new: section.grade };

      // Auto-enroll in section subjects
      if (student.status === 'Active') {
        const ay = student.academicYear || section.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
        await enrollStudentInSectionSubjects(
          student._id as mongoose.Types.ObjectId,
          new mongoose.Types.ObjectId(updates.sectionId),
          section.grade,
          section.stream || student.stream,
          ay
        );
      }

      // Create TransferLog if coming from another section
      if (oldSectionId) {
        await TransferLog.create({
          student: student._id,
          fromSection: new mongoose.Types.ObjectId(oldSectionId),
          toSection: new mongoose.Types.ObjectId(updates.sectionId),
          fromGrade: oldGrade,
          toGrade: section.grade,
          reason: 'Section reassignment via profile update',
          transferredBy: new mongoose.Types.ObjectId(req.user.id),
          transferredAt: new Date(),
          type: 'Section',
        });
      }
    }

    await student.save();

    // Log profile update
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_PROFILE_UPDATE',
      description: `Student profile updated: ${student.fullName}`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        changes,
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Promote student to next grade
 * Implements Req 4.3, 4.4
 */
export const promoteStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { newGrade, newSectionId, stream, reason } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    if (student.status !== StudentStatus.ACTIVE) {
      throw new ApiError(400, 'Only active students can be promoted');
    }

    // Validate grade transition
    if (!newGrade || ![9, 10, 11, 12].includes(newGrade)) {
      throw new ApiError(400, 'Invalid grade');
    }

    // For grades 11-12, stream is required
    if ((newGrade === 11 || newGrade === 12) && !stream) {
      throw new ApiError(400, 'Stream selection required for grades 11-12');
    }

    // Validate new section
    if (newSectionId) {
      const section = await Section.findById(newSectionId);
      if (!section || section.grade !== newGrade) {
        throw new ApiError(400, 'Invalid section for the new grade');
      }
    }

    const oldGrade = student.grade;
    const oldSection = student.section;

    // Update student
    student.grade = newGrade;
    if (newSectionId) {
      student.section = newSectionId;
    }
    if (stream) {
      student.stream = stream;
    }
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({ status: StudentStatus.ACTIVE, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason: `Promoted from Grade ${oldGrade} to ${newGrade}` });

    await student.save();

    // Archive old subject enrollments for the previous grade
    const ay = student.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    await StudentSubject.updateMany(
      { student: student._id, academicYear: ay, status: 'Active' },
      { status: 'Completed', completedAt: new Date() }
    );

    // Auto-enroll in new grade subjects
    if (newSectionId) {
      await enrollStudentInSectionSubjects(
        student._id as mongoose.Types.ObjectId,
        new mongoose.Types.ObjectId(newSectionId),
        newGrade,
        stream || student.stream,
        ay
      );
    }

    // Log promotion
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_PROMOTION',
      description: `Student promoted from grade ${oldGrade} to ${newGrade}`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        oldGrade,
        newGrade,
        oldSection,
        newSection: newSectionId,
        stream,
        reason: reason || 'Successful completion of grade',
        promotedBy: req.user.userId,
      },
    });

    logger.info(`Student promoted`, {
      studentId: student.studentId,
      name: student.fullName,
      oldGrade,
      newGrade,
      promotedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Student promoted successfully',
      data: {
        studentId: student.studentId,
        fullName: student.fullName,
        oldGrade,
        newGrade,
        stream: student.stream,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk promote students to the next grade
 */
export const bulkPromoteStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { studentIds, newGrade, newSectionId, stream, reason, sendNotification } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, 'studentIds array is required');
    }
    if (!newGrade || ![9, 10, 11, 12].includes(newGrade)) {
      throw new ApiError(400, 'Invalid target grade');
    }
    if ((newGrade === 11 || newGrade === 12) && !stream) {
      throw new ApiError(400, 'Stream selection required for grades 11-12');
    }

    let targetSection: any = null;
    if (newSectionId) {
      targetSection = await Section.findById(newSectionId);
      if (!targetSection || targetSection.grade !== newGrade) {
        throw new ApiError(400, 'Invalid section for the target grade');
      }
    }

    const results: { studentId: string; fullName: string; success: boolean; error?: string }[] = [];

    for (const id of studentIds) {
      try {
        const student = await Student.findById(id);
        if (!student) { results.push({ studentId: id, fullName: 'Unknown', success: false, error: 'Student not found' }); continue; }
        if (student.status !== 'Active') { results.push({ studentId: student.studentId, fullName: student.fullName, success: false, error: 'Not active' }); continue; }

        const oldGrade = student.grade;
        student.grade = newGrade;
        if (targetSection) student.section = targetSection._id;
        if (stream) student.stream = stream;
        if (!student.statusHistory) student.statusHistory = [];
        student.statusHistory.push({ status: 'Active', changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason: `Bulk promoted from Grade ${oldGrade} to ${newGrade}` });
        await student.save();

        // Archive old subject enrollments
        const ay = student.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
        await StudentSubject.updateMany(
          { student: student._id, academicYear: ay, status: 'Active' },
          { status: 'Completed', completedAt: new Date() }
        );

        // Auto-enroll in new grade subjects
        if (targetSection) {
          await enrollStudentInSectionSubjects(
            student._id as mongoose.Types.ObjectId,
            targetSection._id as mongoose.Types.ObjectId,
            newGrade,
            stream || student.stream,
            ay
          );
        }

        await AuditLog.create({
          userId: req.user.id, activityType: 'STUDENT_PROMOTION',
          description: `Bulk promoted from Grade ${oldGrade} to ${newGrade}`,
          ipAddress: req.ip, metadata: { studentId: student.studentId, oldGrade, newGrade, promotedBy: req.user.userId },
        });

        if (sendNotification) {
          await Notification.create({
            recipient: student.userId,
            type: NotificationType.ACADEMIC,
            title: 'Grade Promotion',
            message: `Congratulations! You have been promoted to Grade ${newGrade}.`,
          });
          
          if (student.guardians && student.guardians.length > 0) {
            for (const gId of student.guardians) {
              const guardian = await Guardian.findById(gId);
              if (guardian && guardian.userId) {
                await Notification.create({
                  recipient: guardian.userId,
                  type: NotificationType.ACADEMIC,
                  title: 'Student Promotion',
                  message: `${student.firstName} has been successfully promoted to Grade ${newGrade}.`,
                });
              }
            }
          }
        }

        results.push({ studentId: student.studentId, fullName: student.fullName, success: true });
      } catch (err: any) {
        results.push({ studentId: id, fullName: 'Unknown', success: false, error: err.message });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await AuditLog.create({
      userId: req.user.id, activityType: 'BULK_PROMOTION',
      description: `Bulk promotion: ${succeeded} succeeded, ${failed} failed (to Grade ${newGrade})`,
      ipAddress: req.ip, metadata: { total: studentIds.length, succeeded, failed, newGrade, promotedBy: req.user.userId },
    });

    res.json({
      success: true,
      message: `${succeeded} student(s) promoted to Grade ${newGrade}${failed ? `, ${failed} failed` : ''}`,
      data: { succeeded, failed, results, targetGrade: newGrade },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Transfer student to another school
 * Implements Req 4.5, 4.6
 */
export const transferStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { transferSchool, transferReason, transferDate } = req.body;

    if (!transferSchool || !transferReason) {
      throw new ApiError(400, 'Transfer school and reason are required');
    }

    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    if (student.status !== StudentStatus.ACTIVE) {
      throw new ApiError(400, 'Only active students can be transferred');
    }

    const oldStatus = student.status;

    // Update student status
    student.status = StudentStatus.TRANSFERRED;
    student.transferDate = transferDate ? new Date(transferDate) : new Date();
    student.transferSchool = transferSchool;
    student.transferReason = transferReason;
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({ status: StudentStatus.TRANSFERRED, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason: transferReason });
    await student.save();

    // Log transfer
    await TransferLog.create({
      student: student._id,
      fromGrade: student.grade,
      toGrade: student.grade,
      reason: transferReason,
      transferredBy: new mongoose.Types.ObjectId(req.user.id),
      transferredAt: student.transferDate || new Date(),
      type: 'School',
      schoolName: transferSchool,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_TRANSFER',
      description: `Student transferred to ${transferSchool}`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        oldStatus,
        newStatus: StudentStatus.TRANSFERRED,
        transferSchool,
        transferReason,
        transferDate: student.transferDate,
        processedBy: req.user.userId,
      },
    });

    logger.info(`Student transferred`, {
      studentId: student.studentId,
      name: student.fullName,
      transferSchool,
      processedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Student transferred successfully',
      data: {
        studentId: student.studentId,
        fullName: student.fullName,
        status: student.status,
        transferDate: student.transferDate,
        transferSchool,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw student
 * Implements Req 4.6
 */
export const withdrawStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { withdrawalReason, withdrawalDate } = req.body;

    if (!withdrawalReason) {
      throw new ApiError(400, 'Withdrawal reason is required');
    }

    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    if (student.status !== StudentStatus.ACTIVE) {
      throw new ApiError(400, 'Only active students can be withdrawn');
    }

    const oldStatus = student.status;

    // Update student status
    student.status = StudentStatus.WITHDRAWN;
    student.withdrawalDate = withdrawalDate ? new Date(withdrawalDate) : new Date();
    student.withdrawalReason = withdrawalReason;
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({ status: StudentStatus.WITHDRAWN, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason: withdrawalReason });
    await student.save();

    await TransferLog.create({
      student: student._id,
      fromGrade: student.grade,
      toGrade: student.grade,
      reason: withdrawalReason,
      transferredBy: new mongoose.Types.ObjectId(req.user.id),
      transferredAt: student.withdrawalDate || new Date(),
      type: 'Withdrawal',
    });

    // Log withdrawal
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_WITHDRAWAL',
      description: `Student withdrawn: ${withdrawalReason}`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        oldStatus,
        newStatus: StudentStatus.WITHDRAWN,
        withdrawalReason,
        withdrawalDate: student.withdrawalDate,
        processedBy: req.user.userId,
      },
    });

    logger.info(`Student withdrawn`, {
      studentId: student.studentId,
      name: student.fullName,
      reason: withdrawalReason,
      processedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Student withdrawn successfully',
      data: {
        studentId: student.studentId,
        fullName: student.fullName,
        status: student.status,
        withdrawalDate: student.withdrawalDate,
        withdrawalReason: student.withdrawalReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark student as graduated
 * Implements Req 4.7
 */
export const graduateStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { graduationDate } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    if (student.status !== StudentStatus.ACTIVE) {
      throw new ApiError(400, 'Only active students can be graduated');
    }

    if (student.grade !== 12) {
      throw new ApiError(400, 'Only grade 12 students can be graduated');
    }

    const oldStatus = student.status;

    // Update student status
    student.status = StudentStatus.GRADUATED;
    student.graduationDate = graduationDate ? new Date(graduationDate) : new Date();
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({ status: StudentStatus.GRADUATED, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason: `Completed Grade ${student.grade}` });
    await student.save();

    // Log graduation
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'STUDENT_GRADUATION',
      description: `Student graduated`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        oldStatus,
        newStatus: StudentStatus.GRADUATED,
        graduationDate: student.graduationDate,
        grade: student.grade,
        stream: student.stream,
        processedBy: req.user.userId,
      },
    });

    logger.info(`Student graduated`, {
      studentId: student.studentId,
      name: student.fullName,
      stream: student.stream,
      processedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Student graduated successfully',
      data: {
        studentId: student.studentId,
        fullName: student.fullName,
        status: student.status,
        graduationDate: student.graduationDate,
        stream: student.stream,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List students with filtering
 * Implements Req 4.2 + row-level security
 */
export const listStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      grade,
      section,
      stream,
      status,
      search,
      academicYear,
      page = 1,
      limit = 50,
    } = req.query;

    const filter: any = {};

    // Row-level security: students can only see themselves
    if (req.user?.role === UserRole.STUDENT) {
      const self = await Student.findOne({ userId: req.user.id }).select('_id');
      if (self) {
        filter._id = self._id;
      } else {
        filter._id = null; // no results
      }
    }

    // Parent sees only their children
    if (req.user?.role === UserRole.PARENT) {
      const guardian = await Guardian.findOne({ userId: req.user.id }).select('students');
      if (guardian?.students?.length) {
        filter._id = { $in: guardian.students };
      } else {
        filter._id = null;
      }
    }

    // Filter by grade
    if (grade) {
      filter.grade = Number(grade);
    }

    // Filter by section
    if (section) {
      filter.section = section;
    }

    // Filter by stream
    if (stream && Object.values(Stream).includes(stream as Stream)) {
      filter.stream = stream;
    }

    // Filter by academic year
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    // Filter by status
    if (status && Object.values(StudentStatus).includes(status as StudentStatus)) {
      filter.status = status;
    }
    // Don't default to active - show all unless specified

    // Search by name, student ID, admission number, or phone
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
        { 'emergencyContact.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const students = await Student.find(filter)
      .populate('section', 'name grade stream')
      .populate('userId', 'email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ grade: 1, lastName: 1, firstName: 1 });

    const total = await Student.countDocuments(filter);

    // Enrich with academic average from AnnualResult
    const studentIds = students.map(s => s._id);
    const yearForAvg = (academicYear as string) || await getCurrentAcademicYear();
    const annualResults = await AnnualResult.find(
      { student: { $in: studentIds }, academicYear: yearForAvg },
      'student annualAverage semester1Average semester2Average'
    ).lean();
    const avgMap = new Map<string, number>();
    annualResults.forEach((r: any) => {
      avgMap.set(r.student.toString(), r.annualAverage ?? r.semester1Average ?? r.semester2Average ?? 0);
    });
    const studentsWithAvg = students.map(s => ({
      ...(s as any).toObject(),
      average: avgMap.get(s._id.toString()) ?? 0,
    }));

    res.json({
      success: true,
      data: {
        students: studentsWithAvg,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's transfer history (section changes, school transfers)
 */
export const getStudentTransfers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).select('_id studentId firstName lastName grade section');
    if (!student) throw new ApiError(404, 'Student not found');

    const transfers = await TransferLog.find({ student: id })
      .populate('fromSection', 'name grade stream')
      .populate('toSection', 'name grade stream')
      .populate('transferredBy', 'firstName lastName username')
      .sort({ transferredAt: -1 });

    res.json({
      success: true,
      data: {
        student,
        transfers,
        totalTransfers: transfers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's complete history
 * Implements Req 4.9
 */
export const getStudentHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Get audit logs for this student
    const history = await AuditLog.find({
      'metadata.studentId': student.studentId,
    }).sort({ timestamp: -1 });

    res.json({
      success: true,
      data: {
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
          currentGrade: student.grade,
          status: student.status,
        },
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentTranscript = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id).populate('section');
    if (!student) throw new ApiError(404, 'Student not found');
    const { AssessmentMark, Assessment } = await import('../models');
    const marks = await AssessmentMark.find({ student: student._id })
      .populate({ path: 'assessment', populate: { path: 'subject' } })
      .sort({ createdAt: -1 });
    const grouped: Record<string, any> = {};
    for (const mark of marks) {
      const ass = mark.assessment as any;
      if (!ass) continue;
      const term = ass.term || '1';
      if (!grouped[term]) grouped[term] = { term, assessments: [], totalMarks: 0, marksObtained: 0 };
      grouped[term].assessments.push({ subject: ass.subject?.name || 'N/A', type: ass.type, totalMarks: ass.totalMarks, marksObtained: mark.marksObtained, percentage: ass.totalMarks ? Math.round((mark.marksObtained / ass.totalMarks) * 100) : 0 });
      grouped[term].totalMarks += ass.totalMarks;
      grouped[term].marksObtained += mark.marksObtained;
    }
    res.json({ success: true, data: { student: { firstName: student.firstName, lastName: student.lastName, grade: student.grade, section: student.section }, terms: Object.values(grouped) } });
  } catch (error) { next(error); }
};

/**
 * Suspend a student
 */
export const suspendStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ApiError(400, 'Suspension reason is required');
    const student = await Student.findById(id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (student.status !== StudentStatus.ACTIVE && student.status !== StudentStatus.PENDING_APPROVAL) {
      throw new ApiError(400, 'Only active or pending students can be suspended');
    }
    const oldStatus = student.status;
    student.status = StudentStatus.SUSPENDED;
    student.suspensionDate = new Date();
    student.suspensionReason = reason;
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({ status: StudentStatus.SUSPENDED, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason });
    await student.save();
    await AuditLog.create({
      userId: req.user.id, activityType: 'STUDENT_SUSPENSION',
      description: `Student suspended: ${student.fullName} - ${reason}`,
      ipAddress: req.ip, metadata: { studentId: student.studentId, oldStatus, newStatus: StudentStatus.SUSPENDED, reason, suspendedBy: req.user.userId },
    });
    res.json({ success: true, message: 'Student suspended successfully', data: { studentId: student.studentId, fullName: student.fullName, status: student.status } });
  } catch (error) { next(error); }
};

/**
 * Archive a student
 */
export const archiveStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const { reason } = req.body;
    const student = await Student.findById(id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (student.status === StudentStatus.ARCHIVED) throw new ApiError(400, 'Student is already archived');
    const oldStatus = student.status;
    student.status = StudentStatus.ARCHIVED;
    student.archivedDate = new Date();
    student.archivedReason = reason || 'Archived by administrator';
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({ status: StudentStatus.ARCHIVED, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason: reason || 'Archived by administrator' });
    await student.save();
    await AuditLog.create({
      userId: req.user.id, activityType: 'STUDENT_ARCHIVE',
      description: `Student archived: ${student.fullName}`,
      ipAddress: req.ip, metadata: { studentId: student.studentId, oldStatus, newStatus: StudentStatus.ARCHIVED, reason, archivedBy: req.user.userId },
    });
    res.json({ success: true, message: 'Student archived successfully', data: { studentId: student.studentId, fullName: student.fullName, status: student.status } });
  } catch (error) { next(error); }
};

/**
 * Restore a student from suspended/archived status
 */
export const restoreStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const { reason } = req.body;
    const student = await Student.findById(id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (student.status !== StudentStatus.SUSPENDED && student.status !== StudentStatus.ARCHIVED && student.status !== StudentStatus.WITHDRAWN) {
      throw new ApiError(400, 'Only suspended, withdrawn, or archived students can be restored');
    }
    const oldStatus = student.status;
    student.status = StudentStatus.ACTIVE;
    student.suspensionDate = undefined;
    student.suspensionReason = undefined;
    student.archivedDate = undefined;
    student.archivedReason = undefined;
    student.withdrawalDate = undefined;
    student.withdrawalReason = undefined;
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({ status: StudentStatus.ACTIVE, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user.id), reason: reason || 'Restored by administrator' });
    await student.save();
    await AuditLog.create({
      userId: req.user.id, activityType: 'STUDENT_RESTORE',
      description: `Student restored: ${student.fullName}`,
      ipAddress: req.ip, metadata: { studentId: student.studentId, oldStatus, newStatus: StudentStatus.ACTIVE, reason, restoredBy: req.user.userId },
    });
    res.json({ success: true, message: 'Student restored successfully', data: { studentId: student.studentId, fullName: student.fullName, status: student.status } });
  } catch (error) { next(error); }
};

/**
 * Get student with full details including related records
 */
export const getStudentFullDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'email userId username')
      .populate('section', 'name grade stream')
      .populate('guardians', 'firstName lastName phone email relationship');

    if (!student) throw new ApiError(404, 'Student not found');

    const { AssessmentMark, Attendance } = await import('../models');
    const marks = await AssessmentMark.find({ student: student._id }).populate({ path: 'assessment', select: 'type totalMarks subject term' }).sort({ createdAt: -1 });
    const attendanceRecords = await Attendance.find({ student: student._id }).sort({ date: -1 }).limit(100);

    const presentCount = attendanceRecords.filter((a: any) => a.status === 'Present').length;
    const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;
    const totalScore = marks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
    const average = marks.length > 0 ? Math.round(totalScore / marks.length) : 0;

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        marks,
        attendance: attendanceRecords,
        attendanceRate,
        average,
        totalAssessments: marks.length,
      },
    });
  } catch (error) { next(error); }
};

/**
 * Advanced search students with multiple criteria
 */
export const advancedSearchStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, admissionNumber, name, grade, sectionId, status, stream, academicYear, guardianName, guardianPhone, phone, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (studentId) filter.studentId = { $regex: studentId, $options: 'i' };
    if (admissionNumber) filter.admissionNumber = { $regex: admissionNumber, $options: 'i' };
    if (grade) filter.grade = Number(grade);
    if (sectionId) filter.section = sectionId;
    if (status) filter.status = status;
    if (stream) filter.stream = stream;
    if (academicYear) filter.academicYear = academicYear;
    if (phone) {
      filter.$or = [
        { 'emergencyContact.phone': { $regex: phone, $options: 'i' } },
        { 'phone': { $regex: phone, $options: 'i' } },
      ];
    }
    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
      ];
    }

    // Search by guardian name - find guardians first
    if (guardianName) {
      const guardians = await Guardian.find({
        $or: [
          { firstName: { $regex: guardianName, $options: 'i' } },
          { lastName: { $regex: guardianName, $options: 'i' } },
        ],
      }).select('_id');
      filter.guardians = { $in: guardians.map((g: any) => g._id) };
    }

    if (guardianPhone) {
      const guardians = await Guardian.find({ phone: { $regex: guardianPhone, $options: 'i' } }).select('_id');
      if (guardians.length > 0) {
        filter.guardians = { $in: guardians.map((g: any) => g._id) };
      } else {
        filter._id = null; // No results
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const students = await Student.find(filter)
      .populate('section', 'name grade stream')
      .populate('guardians', 'firstName lastName phone email relationship')
      .skip(skip).limit(Number(limit))
      .sort({ grade: 1, lastName: 1, firstName: 1 });
    const total = await Student.countDocuments(filter);

    res.json({
      success: true,
      data: students,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) { next(error); }
};

/**
 * Bulk update student status
 */
export const bulkUpdateStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { studentIds, status, reason } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, 'studentIds array is required');
    }
    if (!status || !Object.values(StudentStatus).includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    const now = new Date();

    for (const student of students) {
      student.status = status;
      student.updatedAt = now;

      if (status === StudentStatus.ARCHIVED) { 
        student.archivedDate = now; 
        student.archivedReason = reason || 'Bulk archive'; 
      }
      if (status === StudentStatus.SUSPENDED) { 
        student.suspensionDate = now; 
        student.suspensionReason = reason || 'Bulk suspension'; 
      }
      if (status === StudentStatus.ACTIVE) { 
        student.suspensionDate = undefined; 
        student.suspensionReason = undefined; 
        student.archivedDate = undefined; 
        student.archivedReason = undefined; 
      }

      if (!student.statusHistory) student.statusHistory = [];
      (student.statusHistory as any[]).push({ 
        status, 
        changedAt: now, 
        changedBy: new mongoose.Types.ObjectId(req.user.id), 
        reason: reason || `Bulk ${status.toLowerCase()}` 
      });
      
      await student.save();
    }

    await AuditLog.create({
      userId: req.user.id, activityType: 'STUDENT_BULK_STATUS',
      description: `Bulk status update: ${studentIds.length} students -> ${status}`,
      ipAddress: req.ip, metadata: { count: studentIds.length, status, reason, processedBy: req.user.userId },
    });

    res.json({ success: true, message: `Updated ${students.length} students to ${status}` });
  } catch (error) { next(error); }
};

/**
 * Enroll a student in all subjects prescribed for their grade/stream
 */
export const enrollStudentInSectionSubjects = async (
  studentId: mongoose.Types.ObjectId,
  sectionId: mongoose.Types.ObjectId,
  grade: number,
  stream: string | undefined,
  academicYear: string
): Promise<{ enrolled: number; skipped: number }> => {
  const subjects = await getSubjectsFromDatabase(grade, stream as Stream | undefined);
  let enrolled = 0;
  let skipped = 0;

  for (const subject of subjects) {
    const existing = await StudentSubject.findOne({
      student: studentId,
      subject: subject._id,
      academicYear,
    });
    if (existing) {
      skipped++;
      continue;
    }
    await StudentSubject.create({
      student: studentId,
      subject: subject._id,
      section: sectionId,
      academicYear,
      grade,
      stream,
      status: 'Active',
    });
    enrolled++;
  }

  return { enrolled, skipped };
};

/**
 * Get subjects a student is enrolled in
 */
export const getStudentSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) throw new ApiError(404, 'Student not found');

    // Row-level security
    if (req.user?.role === UserRole.STUDENT) {
      const self = await Student.findOne({ userId: req.user.id }).select('_id');
      if (!self || self._id.toString() !== id) {
        throw new ApiError(403, 'You can only view your own subjects');
      }
    }

    const enrollments = await StudentSubject.find({
      student: id,
      academicYear: student.academicYear,
      status: 'Active',
    }).populate('subject', 'name code creditHours');

    // Also get curriculum subjects for the grade/stream for reference
    const curriculum = await getSubjectsFromDatabase(student.grade, student.stream);

    res.json({
      success: true,
      data: {
        student: { _id: student._id, studentId: student.studentId, grade: student.grade, stream: student.stream },
        academicYear: student.academicYear,
        enrolledSubjects: enrollments,
        totalEnrolled: enrollments.length,
        curriculumSubjects: curriculum,
        totalCurriculum: curriculum.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently logged-in student's subject enrollments
 */
export const getMySubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) throw new ApiError(404, 'Student profile not found');

    const enrollments = await StudentSubject.find({
      student: student._id,
      academicYear: student.academicYear,
      status: 'Active',
    }).populate('subject', 'name code creditHours');

    const curriculum = await getSubjectsFromDatabase(student.grade, student.stream);

    res.json({
      success: true,
      data: {
        student: { _id: student._id, studentId: student.studentId, grade: student.grade, stream: student.stream },
        academicYear: student.academicYear,
        enrolledSubjects: enrollments,
        totalEnrolled: enrollments.length,
        curriculumSubjects: curriculum,
        totalCurriculum: curriculum.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a section to a student (individual assignment from student profile)
 * Implements Method 1: Individual Student Assignment workflow
 */
export const assignStudentSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const { id } = req.params;
    const { sectionId } = req.body;

    if (!sectionId) throw new ApiError(400, 'sectionId is required');

    const student = await Student.findById(id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (student.status !== 'Active') throw new ApiError(400, 'Only active students can be assigned a section');

    const section = await Section.findById(sectionId);
    if (!section) throw new ApiError(404, 'Section not found');
    if (!section.isActive || section.isArchived) throw new ApiError(400, 'Section is not active');
    if (section.grade !== student.grade) throw new ApiError(400, `Student grade (${student.grade}) does not match section grade (${section.grade})`);

    // Check capacity
    const currentCount = await Student.countDocuments({ section: sectionId, status: 'Active' });
    if (currentCount >= section.capacity) {
      throw new ApiError(400, `Section "${section.name}" is full (${section.capacity}/${section.capacity})`);
    }

    const oldSectionId = student.section?.toString();
    student.section = new mongoose.Types.ObjectId(sectionId);
    student.grade = section.grade;
    if (!student.statusHistory) student.statusHistory = [];
    student.statusHistory.push({
      status: student.status,
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: `Assigned to section "${section.name}"`,
    });
    await student.save();

    // Update section status history
    section.statusHistory.push({
      status: 'StudentAssigned',
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(req.user.id),
      reason: `Student ${student.studentId} (${student.firstName} ${student.lastName}) assigned`,
    });
    await section.save();

    // Auto-enroll in section subjects
    const ay = student.academicYear || section.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const { enrolled, skipped } = await enrollStudentInSectionSubjects(
      student._id as mongoose.Types.ObjectId,
      new mongoose.Types.ObjectId(sectionId),
      section.grade,
      section.stream,
      ay
    );

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'SECTION_ASSIGN_STUDENTS',
      description: `Student ${student.studentId} assigned to section "${section.name}" with ${enrolled} subjects enrolled`,
      ipAddress: req.ip,
      metadata: {
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        oldSectionId,
        newSectionId: sectionId,
        sectionName: section.name,
        subjectsEnrolled: enrolled,
        subjectsSkipped: skipped,
        assignedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: `Student assigned to "${section.name}" with ${enrolled} subjects enrolled`,
      data: {
        student: { _id: student._id, section: student.section, grade: student.grade },
        section: { _id: section._id, name: section.name, currentCount: currentCount + 1 },
        subjectsEnrolled: enrolled,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const seedMoreStudents = async (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction): Promise<void> => {
  try {
    const crypto = require('crypto');
    const hashPassword = (password: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err: any, derivedKey: any) => {
          if (err) reject(err);
          else resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
      });
    };

    const pwdStudent = await hashPassword('Student123!');
    const sections = await Section.find();
    if (sections.length === 0) { res.status(400).json({ error: 'No sections' }); return; }

    const firstNames = ['Yonas', 'Fikirte', 'Zelalem', 'Mekdes', 'Ephrem', 'Lidia', 'Dawit', 'Mahlet', 'Robel', 'Senait', 'Natnael', 'Saron', 'Elias', 'Hanna', 'Yonatan'];
    const lastNames = ['Getachew', 'Tadesse', 'Bekele', 'Girma', 'Kassahun', 'Yilma', 'Tesfaye', 'Asrat', 'Tsegaye', 'Mulugeta', 'Ayalew', 'Worku', 'Tilahun', 'Desta', 'Belay'];
    
    const ay = await getCurrentAcademicYear();
    const generatedUsers = [];
    const generatedStudents = [];

    const startIndex = Math.floor(Math.random() * 1000);

    for (let i = 0; i < 15; i++) {
      const studentId = `STU00${startIndex + i}`;
      const username = `student${startIndex + i}`;
      
      generatedUsers.push({
        userId: studentId,
        username,
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: `${username}@school.edu.et`,
        passwordHash: pwdStudent,
        role: 'student',
        isActive: true,
        mfaEnabled: false,
        failedLoginAttempts: 0,
        forcePasswordChange: false
      });
    }

    const { User } = await import('../models');
    const users = await User.insertMany(generatedUsers);

    const addressLocations = [
      { city: 'Addis Ababa', subcity: 'Bole', woreda: '01', houseNumber: '112A' },
      { city: 'Addis Ababa', subcity: 'Yeka', woreda: '05', houseNumber: '34B' },
      { city: 'Addis Ababa', subcity: 'Kirkos', woreda: '02', houseNumber: '89C' },
      { city: 'Addis Ababa', subcity: 'Lideta', woreda: '08', houseNumber: '210' },
      { city: 'Addis Ababa', subcity: 'Arada', woreda: '03', houseNumber: '405' },
    ];

    for (let i = 0; i < 15; i++) {
      const section = sections[Math.floor(Math.random() * sections.length)];
      const isNatural = section.stream === 'NATURAL_SCIENCE' || section.stream === 'Natural Science';
      const stream = section.grade >= 11 ? (isNatural ? 'Natural Science' : 'Social Science') : 'Common';
      
      generatedStudents.push({
        studentId: `STU00${startIndex + i}`,
        admissionNumber: `ADM-${ay.split('/')[0].slice(-2)}-${startIndex + i}`,
        userId: users[i]._id,
        firstName: firstNames[i],
        lastName: lastNames[i],
        dateOfBirth: new Date(2005 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        nationality: 'Ethiopian',
        grade: section.grade,
        section: section._id,
        stream: stream,
        academicYear: ay,
        enrollmentDate: new Date(`${ay.split('/')[0]}-09-01`),
        status: 'Active',
        address: addressLocations[Math.floor(Math.random() * addressLocations.length)],
        emergencyContact: {
          name: `${lastNames[i]} Contact`,
          relationship: i % 2 === 0 ? 'Father' : 'Mother',
          phone: `+251911${Math.floor(100000 + Math.random() * 900000)}`
        },
        medicalInfo: {
          bloodType: ['A+', 'O+', 'B+', 'AB+'][Math.floor(Math.random() * 4)],
          allergies: i % 5 === 0 ? ['Dust', 'Peanuts'] : [],
          chronicConditions: i % 7 === 0 ? ['Asthma'] : [],
          medications: []
        },
        previousSchool: i % 3 === 0 ? 'St. Joseph School' : 'Public School No. 4',
      });
    }

    const students = await Student.insertMany(generatedStudents);
    res.json({ success: true, message: `Seeded ${students.length} students` });
  } catch (error) {
    next(error);
  }
};
