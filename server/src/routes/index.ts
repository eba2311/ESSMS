import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import studentRoutes from './student.routes';
import guardianRoutes from './guardian.routes';
import sectionRoutes from './section.routes';
import teacherRoutes from './teacher.routes';
import assessmentRoutes from './assessment.routes';
import attendanceRoutes from './attendance.routes';
import rankingRoutes from './ranking.routes';
import financeRoutes from './finance.routes';
import libraryRoutes from './library.routes';
import communicationRoutes from './communication.routes';
import dashboardRoutes from './dashboard.routes';
import messageRoutes from './message.routes';
import timetableRoutes from './timetable.routes';
import subjectRoutes from './subject.routes';
import classroomRoutes from './classroom.routes';
import counselingRoutes from './counseling.routes';
import behavioralRoutes from './behavioral.routes';
import healthRoutes from './health.routes';
import settingsRoutes from './settings.routes';
import eventRoutes from './event.routes';
import alumniRoutes from './alumni.routes';
import auditRoutes from './audit.routes';
import assignmentRoutes from './assignment.routes';
import sectionAssignRoutes from './sectionAssign.routes';
import announcementRoutes from './announcement.routes';
import transferLogRoutes from './transferLog.routes';
import transportRoutes from './transport.routes';
import academicTermRoutes from './academicTerm.routes';
import documentRoutes from './document.routes';
import inventoryRoutes from './inventory.routes';
import gradeScaleRoutes from './gradescale.routes';
import rosterRoutes from './roster.routes';
const router = Router();

// Health check (public)
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ESSMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// Core modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/students', studentRoutes);
router.use('/guardians', guardianRoutes);
router.use('/sections', sectionRoutes);
router.use('/teachers', teacherRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/rankings', rankingRoutes);
router.use('/finance', financeRoutes);
router.use('/library', libraryRoutes);
router.use('/communications', communicationRoutes);

// Extended modules
router.use('/messages', messageRoutes);
router.use('/timetables', timetableRoutes);
router.use('/subjects', subjectRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/counseling', counselingRoutes);
router.use('/behavioral', behavioralRoutes);
router.use('/health-check', healthRoutes);
router.use('/settings', settingsRoutes);
router.use('/events', eventRoutes);
router.use('/alumni', alumniRoutes);
router.use('/audit-logs', auditRoutes);

// Assignment management
router.use('/assignments', assignmentRoutes);

// Section Assignment (unified)
router.use('/section-assign', sectionAssignRoutes);

// Announcement management
router.use('/announcements', announcementRoutes);

// Transfer log management (admin)
router.use('/transfer-logs', transferLogRoutes);

// Transport management
router.use('/transport', transportRoutes);

// Academic term management
router.use('/academic-terms', academicTermRoutes);

// Document management
router.use('/documents', documentRoutes);

// Inventory management
router.use('/inventory', inventoryRoutes);

// Grade Scale configuration
router.use('/grade-scales', gradeScaleRoutes);

// Roster Management
router.use('/rosters', rosterRoutes);

export default router;
