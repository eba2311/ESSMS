import express from 'express';
import request from 'supertest';
import { User, Notification } from '../../models';
import { hashPassword } from '../../utils/password.util';
import { generateAccessToken } from '../../utils/jwt.util';
import { UserRole } from '../../types';
import { errorHandler } from '../../middleware/errorHandler';
import communicationRoutes from '../../routes/communication.routes';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', communicationRoutes);
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

describe('Communication API Integration', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createApp();
    await User.deleteMany({});
    await Notification.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
  });

  describe('GET /api/v1/notifications', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('should return empty list for user with no notifications', async () => {
      const user = await createTestUser(UserRole.TEACHER);
      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return user notifications', async () => {
      const user = await createTestUser(UserRole.TEACHER);
      await Notification.create({ recipient: user._id, title: 'Test', message: 'Hello', type: 'info' });
      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Test');
    });
  });

  describe('PUT /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const user = await createTestUser(UserRole.SYSTEM_ADMIN);
      await Notification.create({ recipient: user._id, title: 'N1', message: 'M1', type: 'info' });
      await Notification.create({ recipient: user._id, title: 'N2', message: 'M2', type: 'info' });
      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).put('/api/v1/notifications/read-all').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const unread = await Notification.countDocuments({ recipient: user._id, read: false });
      expect(unread).toBe(0);
    });
  });

  describe('PUT /api/v1/notifications/:id/read', () => {
    it('should mark a single notification as read', async () => {
      const user = await createTestUser(UserRole.TEACHER);
      const notif = await Notification.create({ recipient: user._id, title: 'Test', message: 'Hello', type: 'info' });
      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).put(`/api/v1/notifications/${notif._id}/read`).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const updated = await Notification.findById(notif._id);
      expect(updated?.read).toBe(true);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete a notification', async () => {
      const user = await createTestUser(UserRole.TEACHER);
      const notif = await Notification.create({ recipient: user._id, title: 'Test', message: 'Hello', type: 'info' });
      const token = generateAccessToken({ userId: user.userId, id: user._id.toString(), role: user.role });
      const res = await request(app).delete(`/api/v1/notifications/${notif._id}`).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const deleted = await Notification.findById(notif._id);
      expect(deleted).toBeNull();
    });
  });
});
