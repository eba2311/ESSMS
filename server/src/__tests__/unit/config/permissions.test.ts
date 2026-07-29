import { UserRole } from '../../../types';
import {
  PermissionCategory,
  RolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  SeparationOfDutiesRules,
} from '../../../config/permissions';

describe('Permissions Configuration', () => {
  describe('Every role has permissions defined', () => {
    const roles = Object.values(UserRole);
    roles.forEach((role) => {
      it(`${role} should have permissions defined`, () => {
        const perms = RolePermissions[role];
        expect(perms).toBeDefined();
        expect(perms.length).toBeGreaterThan(0);
      });
    });
  });

  describe('No duplicate permissions within a role', () => {
    const roles = Object.values(UserRole);
    roles.forEach((role) => {
      it(`${role} should not have duplicate permissions`, () => {
        const perms = RolePermissions[role];
        const uniquePerms = new Set(perms);
        expect(uniquePerms.size).toBe(perms.length);
      });
    });
  });

  describe('Separation of Duties', () => {
    it('Teachers should be allowed to enter grades', () => {
      expect(
        hasPermission(UserRole.TEACHER, PermissionCategory.ASSESSMENT_ENTER_MARKS)
      ).toBe(true);
    });

    it('Teachers should NOT be allowed to publish grades', () => {
      expect(
        hasPermission(UserRole.TEACHER, PermissionCategory.ASSESSMENT_PUBLISH)
      ).toBe(false);
    });

    it('Academic head should be allowed to verify grades', () => {
      expect(
        hasPermission(UserRole.ACADEMIC_HEAD, PermissionCategory.ASSESSMENT_VERIFY)
      ).toBe(true);
    });

    it('Academic head should be allowed to approve grades', () => {
      expect(
        hasPermission(UserRole.ACADEMIC_HEAD, PermissionCategory.ASSESSMENT_APPROVE)
      ).toBe(true);
    });

    it('SeparationOfDutiesRules should be defined correctly', () => {
      expect(SeparationOfDutiesRules.gradeEntry).toContain(UserRole.TEACHER);
      expect(SeparationOfDutiesRules.gradeVerification).toContain(UserRole.ACADEMIC_HEAD);
      expect(SeparationOfDutiesRules.gradeApproval).toContain(UserRole.ACADEMIC_HEAD);
      expect(SeparationOfDutiesRules.gradeApproval).toContain(UserRole.SCHOOL_DIRECTOR);
    });
  });

  describe('Finance Officer', () => {
    it('should NOT have grade read all permission', () => {
      expect(
        hasPermission(UserRole.FINANCE_OFFICER, PermissionCategory.GRADE_READ_ALL)
      ).toBe(false);
    });

    it('should NOT have counseling read all permission', () => {
      expect(
        hasPermission(UserRole.FINANCE_OFFICER, PermissionCategory.COUNSELING_READ_ALL)
      ).toBe(false);
    });

    it('should have finance read permission', () => {
      expect(
        hasPermission(UserRole.FINANCE_OFFICER, PermissionCategory.FINANCE_READ)
      ).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return true for valid permission', () => {
      expect(
        hasPermission(UserRole.SYSTEM_ADMIN, PermissionCategory.USER_CREATE)
      ).toBe(true);
    });

    it('should return false for invalid permission', () => {
      expect(
        hasPermission(UserRole.STUDENT, PermissionCategory.USER_CREATE)
      ).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if role has any of the permissions', () => {
      const result = hasAnyPermission(UserRole.TEACHER, [
        PermissionCategory.ASSESSMENT_CREATE,
        PermissionCategory.USER_CREATE,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if role has none of the permissions', () => {
      const result = hasAnyPermission(UserRole.STUDENT, [
        PermissionCategory.USER_CREATE,
        PermissionCategory.FINANCE_REPORT,
      ]);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if role has all permissions', () => {
      const result = hasAllPermissions(UserRole.SYSTEM_ADMIN, [
        PermissionCategory.USER_CREATE,
        PermissionCategory.USER_UPDATE,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if role lacks any permission', () => {
      const result = hasAllPermissions(UserRole.TEACHER, [
        PermissionCategory.ASSESSMENT_CREATE,
        PermissionCategory.ASSESSMENT_PUBLISH,
      ]);
      expect(result).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for a role', () => {
      const perms = getRolePermissions(UserRole.SYSTEM_ADMIN);
      expect(perms).toContain(PermissionCategory.USER_CREATE);
      expect(perms).toContain(PermissionCategory.SYSTEM_CONFIG);
    });

    it('should return empty array for unknown role', () => {
      const perms = getRolePermissions('unknown' as UserRole);
      expect(perms).toEqual([]);
    });
  });

  describe('Student permissions', () => {
    it('should have read own grade permission', () => {
      expect(
        hasPermission(UserRole.STUDENT, PermissionCategory.GRADE_READ_OWN)
      ).toBe(true);
    });

    it('should NOT have read all grades permission', () => {
      expect(
        hasPermission(UserRole.STUDENT, PermissionCategory.GRADE_READ_ALL)
      ).toBe(false);
    });
  });

  describe('Parent permissions', () => {
    it('should have read own grade permission', () => {
      expect(
        hasPermission(UserRole.PARENT, PermissionCategory.GRADE_READ_OWN)
      ).toBe(true);
    });
  });
});
