import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, requirePermission } from '../../../middleware/auth.middleware';
import { User } from '../../../models';
import { generateAccessToken } from '../../../utils/jwt.util';
import { UserRole } from '../../../types';
import { PermissionCategory } from '../../../config/permissions';
import { hashPassword } from '../../../utils/password.util';

const createTestUser = async () => {
  const hashedPwd = await hashPassword('Test123!');
  return User.create({
    userId: 'AUTH001',
    username: 'authuser',
    email: 'auth@test.com',
    passwordHash: hashedPwd,
    role: UserRole.SYSTEM_ADMIN,
    firstName: 'Auth',
    lastName: 'User',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    forcePasswordChange: false,
  });
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('authenticate middleware', () => {
  let testUser: any;

  beforeEach(async () => {
    await User.deleteMany({});
    testUser = await createTestUser();
  });

  it('should pass with valid token', async () => {
    const token = generateAccessToken({
      userId: testUser.userId,
      id: testUser._id.toString(),
      role: testUser.role,
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;

    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await authenticate(req as any, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe(testUser._id.toString());
  });

  it('should fail without auth header', async () => {
    const req = { headers: {} } as Request;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, message: 'No token provided' })
    );
  });

  it('should fail with invalid token', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as unknown as Request;

    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await authenticate(req as any, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should fail for inactive user', async () => {
    const inactiveUser = await createTestUser();
    inactiveUser.isActive = false;
    await inactiveUser.save();

    const token = generateAccessToken({
      userId: inactiveUser.userId,
      id: inactiveUser._id.toString(),
      role: inactiveUser.role,
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;

    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await authenticate(req as any, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });
});

describe('authorize middleware', () => {
  it('should allow user with correct role', async () => {
    const middleware = authorize(UserRole.SYSTEM_ADMIN, UserRole.ACADEMIC_HEAD);
    const req = { user: { id: '1', userId: 'U001', role: UserRole.SYSTEM_ADMIN } } as any;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should deny user without correct role', async () => {
    const middleware = authorize(UserRole.SYSTEM_ADMIN);
    const req = { user: { id: '1', userId: 'U001', role: UserRole.TEACHER } } as any;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('should deny unauthenticated user', async () => {
    const middleware = authorize(UserRole.SYSTEM_ADMIN);
    const req = { user: undefined } as any;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });
});

describe('requirePermission middleware', () => {
  it('should allow user with required permission', async () => {
    const middleware = requirePermission(PermissionCategory.USER_CREATE);
    const req = { user: { id: '1', userId: 'U001', role: UserRole.SYSTEM_ADMIN } } as any;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should deny user without required permission', async () => {
    const middleware = requirePermission(PermissionCategory.FINANCE_REPORT);
    const req = { user: { id: '1', userId: 'U001', role: UserRole.TEACHER } } as any;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('should allow if user has ANY of the required permissions', async () => {
    const middleware = requirePermission(
      PermissionCategory.FINANCE_REPORT,
      PermissionCategory.ASSESSMENT_CREATE
    );
    const req = { user: { id: '1', userId: 'U001', role: UserRole.TEACHER } } as any;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
