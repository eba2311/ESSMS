import { User } from '../models';
import { hashPassword } from './password.util';
import { UserRole } from '../types';
import { getNextSequence } from '../models/Counter.model';

const ROLE_PREFIXES: Record<string, string> = {
  [UserRole.SYSTEM_ADMIN]: 'E',
  [UserRole.SCHOOL_DIRECTOR]: 'E',
  [UserRole.ACADEMIC_HEAD]: 'E',
  [UserRole.REGISTRAR]: 'E',
  [UserRole.FINANCE_OFFICER]: 'E',
  [UserRole.TEACHER]: 'T',
  [UserRole.COUNSELOR]: 'E',
  [UserRole.LIBRARIAN]: 'E',
  [UserRole.STUDENT]: 'S',
  [UserRole.PARENT]: 'P',
};

export const getRolePrefix = (role: UserRole): string => ROLE_PREFIXES[role] || 'U';

export const generateUsername = async (role: UserRole): Promise<string> => {
  const prefix = getRolePrefix(role);
  return getNextSequence(prefix);
};

export const generateTempPassword = (username: string): string => {
  return `${username}@School`;
};

export interface GeneratedAccount {
  username: string;
  tempPassword: string;
  hashedPassword: string;
}

export const generateAccount = async (role: UserRole): Promise<GeneratedAccount> => {
  const username = await generateUsername(role);
  const tempPassword = generateTempPassword(username);
  const hashedPassword = await hashPassword(tempPassword);
  return { username, tempPassword, hashedPassword };
};
