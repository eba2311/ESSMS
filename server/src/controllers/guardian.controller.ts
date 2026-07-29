import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Guardian, Student, User, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from '../types';
import { logger } from '../utils/logger';
import { hashPassword } from '../utils/password.util';
import { generateAccount } from '../utils/account.util';

/**
 * Register a new guardian
 * Implements Req 12.1
 */
export const registerGuardian = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const {
      firstName,
      lastName,
      relationship,
      phone,
      email,
      occupation,
      address,
      students,
      password,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !relationship || !phone) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Validate relationship
    const validRelationships = ['Father', 'Mother', 'Guardian', 'Other'];
    if (!validRelationships.includes(relationship)) {
      throw new ApiError(400, 'Invalid relationship type');
    }

    // Validate students exist
    if (students && students.length > 0) {
      const studentDocs = await Student.find({ _id: { $in: students } });
      if (studentDocs.length !== students.length) {
        throw new ApiError(404, 'One or more students not found');
      }
    }

    // Create user account for guardian (optional)
    let userId;
    let createdUser;
    let account;
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'User with this email already exists');
      }

      account = await generateAccount(UserRole.PARENT);
      createdUser = await User.create({
        username: account.username,
        email,
        passwordHash: account.hashedPassword,
        role: UserRole.PARENT,
        firstName,
        lastName,
        phoneNumber: phone,
        forcePasswordChange: true,
      });
      userId = createdUser._id;
    }

    // Create guardian record
    const guardian = await Guardian.create({
      userId,
      firstName,
      lastName,
      relationship,
      phone,
      email,
      occupation,
      address: address || {},
      students: students || [],
    });

    // Update student records to include this guardian
    if (students && students.length > 0) {
      await Student.updateMany(
        { _id: { $in: students } },
        { $addToSet: { guardians: guardian._id } }
      );
    }

    // Log guardian registration
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'GUARDIAN_REGISTRATION',
      description: `New guardian registered: ${guardian.fullName}`,
      ipAddress: req.ip,
      metadata: {
        guardianId: guardian.guardianId,
        relationship: guardian.relationship,
        linkedStudents: students || [],
        registeredBy: req.user.userId,
      },
    });

    logger.info(`Guardian registered`, {
      guardianId: guardian.guardianId,
      name: guardian.fullName,
      relationship: guardian.relationship,
      registeredBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Guardian registered successfully',
      data: {
        guardianId: guardian.guardianId,
        fullName: guardian.fullName,
        relationship: guardian.relationship,
        linkedStudents: students ? students.length : 0,
        credentials: createdUser ? {
          username: createdUser.username,
          tempPassword: account.tempPassword,
        } : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get guardian by ID
 */
export const getGuardianById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const guardian = await Guardian.findById(id)
      .populate('userId', 'email userId')
      .populate({
        path: 'students',
        select: 'studentId firstName lastName grade section status',
        populate: {
          path: 'section',
          select: 'name',
        },
      });

    if (!guardian) {
      throw new ApiError(404, 'Guardian not found');
    }

    res.json({
      success: true,
      data: guardian,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update guardian profile
 */
export const updateGuardianProfile = async (
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

    const guardian = await Guardian.findById(id);

    if (!guardian) {
      throw new ApiError(404, 'Guardian not found');
    }

    // Prevent certain fields from being updated
    delete updates.guardianId;
    delete updates.userId;
    delete updates.students; // Use separate endpoint to link/unlink students

    const allowedFields = [
      'firstName',
      'lastName',
      'relationship',
      'phone',
      'email',
      'occupation',
      'address',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        (guardian as any)[field] = updates[field];
      }
    });

    await guardian.save();

    // Log profile update
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'GUARDIAN_PROFILE_UPDATE',
      description: `Guardian profile updated: ${guardian.fullName}`,
      ipAddress: req.ip,
      metadata: {
        guardianId: guardian.guardianId,
        updatedFields: Object.keys(updates),
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Guardian profile updated successfully',
      data: guardian,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link guardian to student
 * Implements Req 4.10
 */
export const linkGuardianToStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      throw new ApiError(400, 'Student ID is required');
    }

    const guardian = await Guardian.findById(id);
    const student = await Student.findById(studentId);

    if (!guardian) {
      throw new ApiError(404, 'Guardian not found');
    }

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Check if already linked
    if (guardian.students.includes(student._id)) {
      throw new ApiError(400, 'Guardian is already linked to this student');
    }

    // Add student to guardian
    guardian.students.push(student._id);
    await guardian.save();

    // Add guardian to student
    if (!student.guardians.includes(guardian._id)) {
      student.guardians.push(guardian._id);
      await student.save();
    }

    // Log linking
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'GUARDIAN_STUDENT_LINK',
      description: `Guardian ${guardian.fullName} linked to student ${student.fullName}`,
      ipAddress: req.ip,
      metadata: {
        guardianId: guardian.guardianId,
        studentId: student.studentId,
        linkedBy: req.user.userId,
      },
    });

    logger.info(`Guardian linked to student`, {
      guardianId: guardian.guardianId,
      studentId: student.studentId,
      linkedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Guardian linked to student successfully',
      data: {
        guardian: {
          guardianId: guardian.guardianId,
          fullName: guardian.fullName,
        },
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlink guardian from student
 */
export const unlinkGuardianFromStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      throw new ApiError(400, 'Student ID is required');
    }

    const guardian = await Guardian.findById(id);
    const student = await Student.findById(studentId);

    if (!guardian) {
      throw new ApiError(404, 'Guardian not found');
    }

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Remove student from guardian
    guardian.students = guardian.students.filter(
      (sid) => sid.toString() !== student._id.toString()
    );
    await guardian.save();

    // Remove guardian from student
    student.guardians = student.guardians.filter(
      (gid) => gid.toString() !== guardian._id.toString()
    );
    await student.save();

    // Log unlinking
    await AuditLog.create({
      userId: req.user.id,
      activityType: 'GUARDIAN_STUDENT_UNLINK',
      description: `Guardian ${guardian.fullName} unlinked from student ${student.fullName}`,
      ipAddress: req.ip,
      metadata: {
        guardianId: guardian.guardianId,
        studentId: student.studentId,
        unlinkedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Guardian unlinked from student successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List guardians with filtering
 */
export const listGuardians = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { relationship, search, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    // Filter by relationship
    if (relationship) {
      filter.relationship = relationship;
    }

    // Search by name, phone, or email
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { guardianId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const guardians = await Guardian.find(filter)
      .populate('students', 'studentId firstName lastName grade status')
      .skip(skip)
      .limit(Number(limit))
      .sort({ lastName: 1, firstName: 1 });

    const total = await Guardian.countDocuments(filter);

    res.json({
      success: true,
      data: guardians,
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

export const getMyGuardianProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const guardian = await Guardian.findOne({ userId: req.user.id })
      .populate({
        path: 'students',
        select: 'studentId firstName lastName grade section academicYear status photo',
        populate: { path: 'section', select: 'name grade stream' },
      });

    if (!guardian) {
      throw new ApiError(404, 'Guardian profile not found. Ensure your account is linked to a guardian record.');
    }

    res.json({
      success: true,
      data: guardian,
    });
  } catch (error) {
    next(error);
  }
};
