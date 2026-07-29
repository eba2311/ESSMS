import mongoose from 'mongoose';
import { User } from '../../../models';
import { loginUser, logoutUser, changePassword, isPasswordExpired } from '../../../services/auth.service';
import { hashPassword } from '../../../utils/password.util';
import { UserRole } from '../../../types';

const createTestUser = async (overrides: Record<string, any> = {}) => {
  const hashedPwd = await hashPassword('Test123!');
  return User.create({
    userId: 'TST001',
    username: 'testuser',
    email: 'test@test.com',
    passwordHash: hashedPwd,
    role: UserRole.TEACHER,
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    forcePasswordChange: false,
    ...overrides,
  });
};

describe('loginUser', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should authenticate user with valid credentials', async () => {
    const user = await createTestUser();
    const result = await loginUser('testuser', 'Test123!');
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe('test@test.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should authenticate with email', async () => {
    await createTestUser();
    const result = await loginUser('test@test.com', 'Test123!');
    expect(result.success).toBe(true);
  });

  it('should reject invalid password', async () => {
    await createTestUser();
    const result = await loginUser('testuser', 'WrongPass1!');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
  });

  it('should reject non-existent user', async () => {
    const result = await loginUser('nonexistent', 'Test123!');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
  });

  it('should reject inactive account', async () => {
    await createTestUser({ isActive: false });
    const result = await loginUser('testuser', 'Test123!');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Account is inactive');
  });

  it('should handle locked account', async () => {
    const lockedUntil = new Date(Date.now() + 3600000);
    await createTestUser({ accountLockedUntil: lockedUntil });
    const result = await loginUser('testuser', 'Test123!');
    expect(result.success).toBe(false);
    expect(result.accountLocked).toBe(true);
  });

  it('should require MFA if enabled', async () => {
    await createTestUser({ mfaEnabled: true });
    const result = await loginUser('testuser', 'Test123!');
    expect(result.success).toBe(true);
    expect(result.requiresMFA).toBe(true);
  });

  it('should increment failed login attempts on wrong password', async () => {
    await createTestUser();
    await loginUser('testuser', 'WrongPass1!');
    const user = await User.findOne({ username: 'testuser' });
    expect(user!.failedLoginAttempts).toBe(1);
  });

  it('should reset failed attempts on successful login', async () => {
    const user = await createTestUser({ failedLoginAttempts: 3 });
    await loginUser('testuser', 'Test123!');
    const updated = await User.findById(user._id);
    expect(updated!.failedLoginAttempts).toBe(0);
  });

  it('should return passwordExpired flag when password is expired', async () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 1);
    await createTestUser({ passwordChangedAt: oldDate });
    const result = await loginUser('testuser', 'Test123!');
    expect(result.passwordExpired).toBe(true);
  });

  it('should return forcePasswordChange flag', async () => {
    await createTestUser({ forcePasswordChange: true });
    const result = await loginUser('testuser', 'Test123!');
    expect(result.passwordExpired).toBe(true);
  });
});

describe('logoutUser', () => {
  it('should not throw for valid user', async () => {
    const user = await createTestUser();
    await expect(logoutUser(user._id.toString())).resolves.not.toThrow();
  });

  it('should not throw for non-existent user', async () => {
    await expect(
      logoutUser(new mongoose.Types.ObjectId().toString())
    ).resolves.not.toThrow();
  });
});

describe('changePassword', () => {
  it('should change password successfully', async () => {
    const user = await createTestUser();
    await changePassword(user._id.toString(), 'Test123!', 'NewPass123!');
    const result = await loginUser('testuser', 'NewPass123!');
    expect(result.success).toBe(true);
  });

  it('should reject wrong current password', async () => {
    const user = await createTestUser();
    await expect(
      changePassword(user._id.toString(), 'WrongPass1!', 'NewPass123!')
    ).rejects.toThrow('Current password is incorrect');
  });

  it('should reject short new password', async () => {
    const user = await createTestUser();
    await expect(
      changePassword(user._id.toString(), 'Test123!', 'Ab1!')
    ).rejects.toThrow('at least 6 characters');
  });
});

describe('isPasswordExpired', () => {
  it('should return false if no passwordChangedAt', () => {
    expect(isPasswordExpired(undefined)).toBe(false);
  });

  it('should return false if password was changed recently', () => {
    expect(isPasswordExpired(new Date())).toBe(false);
  });

  it('should return true if password is very old', () => {
    const oldDate = new Date('2020-01-01');
    expect(isPasswordExpired(oldDate)).toBe(true);
  });
});
