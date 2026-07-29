import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { User } from '../../models';
import { hashPassword } from '../../utils/password.util';
import { UserRole } from '../../types';
import { errorHandler } from '../../middleware/errorHandler';
import authRoutes from '../../routes/auth.routes';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

const createUser = async (overrides: Record<string, any> = {}) => {
  const hashedPwd = await hashPassword('Test123!');
  return User.create({
    userId: 'API001',
    username: 'apiuser',
    email: 'api@test.com',
    passwordHash: hashedPwd,
    role: UserRole.TEACHER,
    firstName: 'API',
    lastName: 'User',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    forcePasswordChange: false,
    ...overrides,
  });
};

describe('Auth API Integration', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createApp();
    User.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createUser();
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ usernameOrEmail: 'apiuser', password: 'Test123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ usernameOrEmail: 'nonexistent', password: 'WrongPass1!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 423 for locked account', async () => {
      const lockedUntil = new Date(Date.now() + 3600000);
      await createUser({ accountLockedUntil: lockedUntil });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ usernameOrEmail: 'apiuser', password: 'Test123!' });

      expect(res.status).toBe(423);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createUser();
      const refreshToken = generateRefreshToken({
        userId: user.userId,
        id: user._id.toString(),
        role: user.role,
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const user = await createUser();
      const token = generateAccessToken({
        userId: user.userId,
        id: user._id.toString(),
        role: user.role,
      });

      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('api@test.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const user = await createUser();
      const token = generateAccessToken({
        userId: user.userId,
        id: user._id.toString(),
        role: user.role,
      });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
