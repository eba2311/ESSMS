import { describe, it, expect } from 'vitest';
import { hasPermission, canViewStudents, canCreateStudents, canEditStudents, canDeleteStudents, canPromoteStudents, getRoleLabel, ROLES } from '../permissions';

describe('permissions utility', () => {
  describe('ROLES constants', () => {
    it('should export all role constants', () => {
      expect(ROLES.SYSTEM_ADMIN).toBe('system_admin');
      expect(ROLES.TEACHER).toBe('teacher');
      expect(ROLES.STUDENT).toBe('student');
      expect(ROLES.PARENT).toBe('parent');
      expect(ROLES.SCHOOL_DIRECTOR).toBe('school_director');
      expect(ROLES.ACADEMIC_HEAD).toBe('academic_head');
    });
  });

  describe('hasPermission', () => {
    it('should return true for allowed role', () => {
      expect(hasPermission('student', 'view', 'system_admin')).toBe(true);
    });

    it('should return false for disallowed role', () => {
      expect(hasPermission('student', 'delete', 'teacher')).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(hasPermission('student', 'view', undefined)).toBe(false);
    });

    it('should return false for unknown action', () => {
      expect(hasPermission('student', 'unknown', 'system_admin')).toBe(false);
    });
  });

  describe('canViewStudents', () => {
    it('should allow admin', () => {
      expect(canViewStudents('system_admin')).toBe(true);
    });

    it('should allow teacher', () => {
      expect(canViewStudents('teacher')).toBe(true);
    });

    it('should deny student', () => {
      expect(canViewStudents('student')).toBe(false);
    });
  });

  describe('canCreateStudents', () => {
    it('should allow admin', () => {
      expect(canCreateStudents('system_admin')).toBe(true);
    });

    it('should allow registrar', () => {
      expect(canCreateStudents('registrar')).toBe(true);
    });

    it('should deny teacher', () => {
      expect(canCreateStudents('teacher')).toBe(false);
    });
  });

  describe('canEditStudents', () => {
    it('should allow admin', () => {
      expect(canEditStudents('system_admin')).toBe(true);
    });
  });

  describe('canDeleteStudents', () => {
    it('should allow admin', () => {
      expect(canDeleteStudents('system_admin')).toBe(true);
    });

    it('should deny teacher', () => {
      expect(canDeleteStudents('teacher')).toBe(false);
    });
  });

  describe('canPromoteStudents', () => {
    it('should allow admin', () => {
      expect(canPromoteStudents('system_admin')).toBe(true);
    });
  });

  describe('getRoleLabel', () => {
    it('should return formatted label for known roles', () => {
      expect(getRoleLabel('system_admin')).toBe('System Admin');
      expect(getRoleLabel('teacher')).toBe('Teacher');

    });

    it('should return input for unknown role', () => {
      expect(getRoleLabel('unknown')).toBe('unknown');
    });

    it('should return empty string for undefined', () => {
      expect(getRoleLabel(undefined)).toBe('');
    });
  });
});
