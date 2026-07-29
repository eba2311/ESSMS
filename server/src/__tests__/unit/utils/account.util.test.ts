import { getRolePrefix, generateTempPassword } from '../../../utils/account.util';
import { UserRole } from '../../../types';

describe('getRolePrefix', () => {
  it('should return E for system_admin', () => {
    expect(getRolePrefix(UserRole.SYSTEM_ADMIN)).toBe('E');
  });

  it('should return T for teacher', () => {
    expect(getRolePrefix(UserRole.TEACHER)).toBe('T');
  });

  it('should return S for student', () => {
    expect(getRolePrefix(UserRole.STUDENT)).toBe('S');
  });

  it('should return P for parent', () => {
    expect(getRolePrefix(UserRole.PARENT)).toBe('P');
  });

  it('should return U for unknown role', () => {
    expect(getRolePrefix('unknown' as UserRole)).toBe('U');
  });
});

describe('generateTempPassword', () => {
  it('should generate password with @School suffix', () => {
    const pwd = generateTempPassword('user123');
    expect(pwd).toBe('user123@School');
  });
});
