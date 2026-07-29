import { hashPassword, verifyPassword, validatePasswordStrength } from '../../../utils/password.util';

describe('hashPassword', () => {
  it('should hash a password', async () => {
    const hash = await hashPassword('Test123!');
    expect(hash).toBeDefined();
    expect(hash).toContain(':');
  });

  it('should produce different hashes for same password', async () => {
    const hash1 = await hashPassword('Test123!');
    const hash2 = await hashPassword('Test123!');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('should verify correct password', async () => {
    const password = 'Test123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await hashPassword('Test123!');
    const isValid = await verifyPassword('WrongPassword1!', hash);
    expect(isValid).toBe(false);
  });

  it('should reject malformed hash', async () => {
    const isValid = await verifyPassword('Test123!', 'invalid-hash');
    expect(isValid).toBe(false);
  });

  it('should reject empty string hash', async () => {
    const isValid = await verifyPassword('Test123!', '');
    expect(isValid).toBe(false);
  });
});

describe('validatePasswordStrength', () => {
  it('should accept strong password', () => {
    const result = validatePasswordStrength('StrongP@ss1');
    expect(result.valid).toBe(true);
  });

  it('should reject short password', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('at least 8 characters');
  });

  it('should reject password without uppercase', () => {
    const result = validatePasswordStrength('lowercase1!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('uppercase');
  });

  it('should reject password without lowercase', () => {
    const result = validatePasswordStrength('UPPERCASE1!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('lowercase');
  });

  it('should reject password without number', () => {
    const result = validatePasswordStrength('NoNumber!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('number');
  });

  it('should reject password without special character', () => {
    const result = validatePasswordStrength('NoSpecial1');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('special character');
  });
});
