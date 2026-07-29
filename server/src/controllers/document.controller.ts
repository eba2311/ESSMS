import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth.middleware';
import { Document, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const uploadDir = path.join(__dirname, '../../uploads');

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    const { title, documentType, student, teacher, notes } = req.body;

    if (!title || !documentType) {
      throw new ApiError(400, 'Missing required fields: title, documentType');
    }

    const validTypes = ['Birth Certificate', 'ID Card', 'Transcript', 'Medical Record', 'Transfer Letter', 'Photo', 'Other'];
    if (!validTypes.includes(documentType)) {
      throw new ApiError(400, `Invalid documentType. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!student && !teacher) {
      throw new ApiError(400, 'Either student or teacher must be provided');
    }

    if (student) {
      const studentExists = await mongoose.model('Student').exists({ _id: student });
      if (!studentExists) {
        throw new ApiError(404, 'Student not found');
      }
    }

    if (teacher) {
      const teacherExists = await mongoose.model('Teacher').exists({ _id: teacher });
      if (!teacherExists) {
        throw new ApiError(404, 'Teacher not found');
      }
    }

    const file = req.file;

    const document = await Document.create({
      title: title.trim(),
      documentType,
      student: student || undefined,
      teacher: teacher || undefined,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user.id,
      notes: notes?.trim(),
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'DOCUMENT_UPLOAD',
      description: `Document "${title}" uploaded`,
      ipAddress: req.ip,
      metadata: {
        documentId: document.documentId,
        title: document.title,
        documentType: document.documentType,
        fileSize: document.fileSize,
        uploadedBy: req.user.userId,
      },
    });

    logger.info(`Document uploaded`, {
      documentId: document.documentId,
      title: document.title,
      uploadedBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const listDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { student, teacher, documentType, isVerified, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (student) filter.student = new mongoose.Types.ObjectId(student as string);
    if (teacher) filter.teacher = new mongoose.Types.ObjectId(teacher as string);
    if (documentType) filter.documentType = documentType;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate('uploadedBy', 'firstName lastName')
        .populate('verifiedBy', 'firstName lastName')
        .populate('student', 'studentId firstName lastName')
        .populate('teacher', 'teacherId firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Document.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .populate('student', 'studentId firstName lastName')
      .populate('teacher', 'teacherId firstName lastName');

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    if (!fs.existsSync(document.filePath)) {
      throw new ApiError(404, 'File not found on disk');
    }

    await AuditLog.create({
      userId: req.user!.id,
      activityType: 'DOCUMENT_DOWNLOAD',
      description: `Document "${document.title}" downloaded`,
      ipAddress: req.ip,
      metadata: {
        documentId: document.documentId,
        title: document.title,
        downloadedBy: req.user!.userId,
      },
    });

    res.download(document.filePath, document.fileName);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    if (document.isVerified) {
      throw new ApiError(400, 'Cannot delete a verified document');
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await Document.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'DOCUMENT_DELETE',
      description: `Document "${document.title}" deleted`,
      ipAddress: req.ip,
      metadata: {
        documentId: document.documentId,
        title: document.title,
        deletedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    document.isVerified = true;
    document.verifiedBy = new mongoose.Types.ObjectId(req.user.id);
    document.verifiedAt = new Date();
    await document.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'DOCUMENT_VERIFY',
      description: `Document "${document.title}" verified`,
      ipAddress: req.ip,
      metadata: {
        documentId: document.documentId,
        title: document.title,
        verifiedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Document verified successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};
