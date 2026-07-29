import express from 'express';
import request from 'supertest';
import { User } from '../../models';
import { hashPassword } from '../../utils/password.util';
import { generateAccessToken } from '../../utils/jwt.util';
import { UserRole } from '../../types';
import { errorHandler } from '../../middleware/errorHandler';
import studentRoutes from '../../routes/student.routes';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/students', studentRoutes);
  app.use(errorHandler);
  return app;
};

const createTestUser = async (role: UserRole = UserRole.SYSTEM_ADMIN) => {
  const hashedPwd = await hashPassword('Admin123!');
  return User.create({
    userId: `ADM_${Date.now()}`,
    username: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@test.com`,
    passwordHash: hashedPwd,
    role,
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    forcePasswordChange: false,
  });
};

describe('Student API', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createApp();
    await User.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/v1/students', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/students');
      expect(res.status).toBe(401);
    });

    it('should return 403 without proper permissions', async () => {
      const user = await createTestUser(UserRole.STUDENT);
      const token = generateAccessToken({
        userId: user.userId,
        id: user._id.toString(),
        role: user.role,
      });

      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return students list for authorized user', async () => {
      const user = await createTestUser(UserRole.SYSTEM_ADMIN);
      const token = generateAccessToken({
        userId: user.userId,
        id: user._id.toString(),
        role: user.role,
      });

      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/students', () => {
    it('should reject registration without token', async () => {
      const res = await request(app)
        .post('/api/v1/students')
        .send({ firstName: 'Test', lastName: 'Student' });

      expect(res.status).toBe(401);
    });

    it('should reject registration without student permission', async () => {
      const user = await createTestUser(UserRole.STUDENT);
      const token = generateAccessToken({
        userId: user.userId,
        id: user._id.toString(),
        role: user.role,
      });

      const res = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Test', lastName: 'Student' });

      expect(res.status).toBe(403);
    });
  });
});
