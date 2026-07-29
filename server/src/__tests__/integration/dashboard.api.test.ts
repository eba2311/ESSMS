import express from 'express';
import request from 'supertest';
import { User, Student, Section, Subject, Assessment, AssessmentMark, Ranking } from '../../models';
import { hashPassword } from '../../utils/password.util';
import { generateAccessToken } from '../../utils/jwt.util';
import { UserRole, AssessmentStatus, AssessmentType } from '../../types';
import { errorHandler } from '../../middleware/errorHandler';
import dashboardRoutes from '../../routes/dashboard.routes';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use(errorHandler);
  return app;
};

const createTestUser = async (role: UserRole = UserRole.SYSTEM_ADMIN, overrides: Record<string, any> = {}) => {
  const hashedPwd = await hashPassword('Admin123!');
  return User.create({
    userId: `USR_${Date.now()}`,
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@test.com`,
    passwordHash: hashedPwd,
    role,
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    forcePasswordChange: false,
    ...overrides,
  });
};

const createStudent = async (user: any) => {
  const section = await Section.create({ name: 'A', grade: 9, academicYear: '2024/2025' });
  const student = await Student.create({
    userId: user._id,
    firstName: 'Student',
    lastName: 'Test',
    studentId: `STU${Date.now()}`,
    section: section._id,
    grade: 9,
    academicYear: '2024/2025',
    status: 'Active',
  });
  return { student, section };
};

const createSubjectAssessment = async (student: any, section: any, subjectName: string, term: string, marksObtained: number, totalMarks: number) => {
  const subject = await Subject.create({ name: subjectName, code: subjectName.substring(0, 3).toUpperCase(), grades: [9] });
  const assessment = await Assessment.create({
    title: `${subjectName} Exam`,
    type: AssessmentType.MID_EXAM,
    subject: subject._id,
    section: section._id,
    totalMarks,
    academicYear: '2024/2025',
    term,
    date: new Date(),
    status: AssessmentStatus.PUBLISHED,
    teacher: student._id,
  });
  await AssessmentMark.create({
    assessment: assessment._id,
    student: student._id,
    marksObtained,
    percentage: (marksObtained / totalMarks) * 100,
    letterGrade: marksObtained / totalMarks >= 0.9 ? 'A' : marksObtained / totalMarks >= 0.8 ? 'B' : 'C',
    gradePoint: marksObtained / totalMarks >= 0.9 ? 4.0 : marksObtained / totalMarks >= 0.8 ? 3.0 : 2.0,
  });
  return assessment;
};

describe('Dashboard API Integration', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createApp();
    await User.deleteMany({});
    await Student.deleteMany({});
    await Section.deleteMany({});
    await Subject.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentMark.deleteMany({});
    await Ranking.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Student.deleteMany({});
    await Section.deleteMany({});
    await Subject.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentMark.deleteMany({});
    await Ranking.deleteMany({});
  });

  describe('GET /api/v1/dashboard/student', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/dashboard/student');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-student role', async () => {
      const user = await createTestUser(UserRole.TEACHER);
      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).get('/api/v1/dashboard/student').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return student dashboard with term data and rankings', async () => {
      const user = await createTestUser(UserRole.STUDENT);
      const { student, section } = await createStudent(user);
      await createSubjectAssessment(student, section, 'Mathematics', '1', 85, 100);
      await createSubjectAssessment(student, section, 'English', '1', 78, 100);

      await Ranking.create({
        student: student._id,
        section: section._id,
        academicYear: '2024/2025',
        term: '1',
        sectionRank: 1,
        gradeRank: 2,
        streamRank: 3,
        schoolRank: 5,
        totalMarks: 163,
        average: 81.5,
        meritCategory: 'Distinction',
      });

      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).get('/api/v1/dashboard/student').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('terms');
      expect(res.body.data.terms).toHaveProperty('1');
      expect(res.body.data.terms['1']).toHaveProperty('subjects');
      expect(res.body.data.terms['1'].subjects.length).toBe(2);
      expect(res.body.data.terms['1']).toHaveProperty('ranking');
    });
  });

  describe('GET /api/v1/dashboard/teacher', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/dashboard/teacher');
      expect(res.status).toBe(401);
    });

    it('should return teacher dashboard for teacher role', async () => {
      const user = await createTestUser(UserRole.TEACHER);
      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).get('/api/v1/dashboard/teacher').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
