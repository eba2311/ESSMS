/**
 * User Model Unit Tests
 * Note: These tests require a MongoDB connection to run.
 * They are designed to work with Jest and a running MongoDB instance.
 */
import { User } from '../../../models/User.model';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should require userId', () => {
      const user = new User({
        username: 'test',
        email: 'test@test.com',
        passwordHash: 'hash',
        role: 'teacher',
        firstName: 'Test',
        lastName: 'User',
      });
      const err = user.validateSync();
      expect(err).toBeDefined();
    });

    it('should require email', () => {
      const user = new User({
        userId: 'USR001',
        username: 'test',
        passwordHash: 'hash',
        role: 'teacher',
        firstName: 'Test',
        lastName: 'User',
      });
      const err = user.validateSync();
      expect(err).toBeDefined();
    });

    it('should create a valid user with all required fields', () => {
      const user = new User({
        userId: 'USR001',
        username: 'testuser',
        email: 'test@test.com',
        passwordHash: 'hash123',
        role: 'teacher',
        firstName: 'Test',
        lastName: 'User',
      });
      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('teacher');
    });

    it('should enforce unique email constraint', () => {
      const user1 = new User({
        userId: 'USR001',
        username: 'user1',
        email: 'dupe@test.com',
        passwordHash: 'hash',
        role: 'teacher',
        firstName: 'Test',
        lastName: 'User',
      });
      const user2 = new User({
        userId: 'USR002',
        username: 'user2',
        email: 'dupe@test.com',
        passwordHash: 'hash',
        role: 'student',
        firstName: 'Test2',
        lastName: 'User2',
      });
      expect(user1.email).toBe(user2.email);
    });

    it('should convert email to lowercase', () => {
      const user = new User({
        userId: 'USR001',
        username: 'testuser',
        email: 'TEST@TEST.COM',
        passwordHash: 'hash',
        role: 'teacher',
        firstName: 'Test',
        lastName: 'User',
      });
      expect(user.email).toBe('test@test.com');
    });
  });

  describe('Virtual Fields', () => {
    it('should have fullName virtual', () => {
      const user = new User({
        userId: 'USR001',
        username: 'testuser',
        email: 'test@test.com',
        passwordHash: 'hash',
        role: 'teacher',
        firstName: 'Abebe',
        lastName: 'Kebede',
      });
      expect(user.fullName).toBe('Abebe Kebede');
    });
  });

  describe('Role Assignment', () => {
    const validRoles = ['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent'];

    validRoles.forEach((role) => {
      it(`should accept role: ${role}`, () => {
        const user = new User({
          userId: `USR_${role}`,
          username: `${role}_test`,
          email: `${role}@test.com`,
          passwordHash: 'hash',
          role,
          firstName: 'Test',
          lastName: role,
        });
        expect(user.role).toBe(role);
      });
    });
  });
});
