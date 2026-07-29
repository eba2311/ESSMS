import { AcademicTerm } from '../models';

export async function getCurrentAcademicYear(): Promise<string> {
  const currentTerm = await AcademicTerm.findOne({ isCurrent: true })
    .select('academicYear')
    .lean();
  if (currentTerm?.academicYear) return currentTerm.academicYear;
  const now = new Date();
  const month = now.getMonth();
  if (month >= 8) {
    return `${now.getFullYear()}/${now.getFullYear() + 1}`;
  }
  return `${now.getFullYear() - 1}/${now.getFullYear()}`;
}

export async function getCurrentTerm(): Promise<'1' | '2'> {
  const currentTerm = await AcademicTerm.findOne({ isCurrent: true })
    .select('term')
    .lean();
  return (currentTerm?.term as '1' | '2') || '1';
}
