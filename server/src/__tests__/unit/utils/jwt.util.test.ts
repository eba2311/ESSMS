import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, decodeToken } from '../../../utils/jwt.util';
import { UserRole } from '../../../types';

const mockPayload = {
  userId: 'USR001',
  id: '507f1f77bcf86cd799439011',
  role: UserRole.SYSTEM_ADMIN as UserRole,
};

describe('generateAccessToken', () => {
  it('should generate a valid JWT access token', () => {
    const token = generateAccessToken(mockPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});

describe('generateRefreshToken', () => {
  it('should generate a valid JWT refresh token', () => {
    const token = generateRefreshToken(mockPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});

describe('verifyAccessToken', () => {
  it('should verify a valid access token', () => {
    const token = generateAccessToken(mockPayload);
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(mockPayload.id);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.role).toBe(mockPayload.role);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('should throw on invalid access token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid token');
  });

  it('should throw on expired access token', () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImV4cCI6MTUwMDAwMDAwMH0.invalid';
    expect(() => verifyAccessToken(expiredToken)).toThrow();
  });
});

describe('verifyRefreshToken', () => {
  it('should verify a valid refresh token', () => {
    const token = generateRefreshToken(mockPayload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe(mockPayload.id);
    expect(decoded.userId).toBe(mockPayload.userId);
  });
});

describe('decodeToken', () => {
  it('should decode token without verification', () => {
    const token = generateAccessToken(mockPayload);
    const decoded = decodeToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe(mockPayload.id);
  });

  it('should return null for invalid token string', () => {
    const decoded = decodeToken('not-a-jwt');
    expect(decoded).toBeNull();
  });
});
