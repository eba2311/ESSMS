import { Subject } from '../models';
import { Stream, GradeLevel } from '../types';
import { logger } from '../utils/logger';

/**
 * Ethiopian Secondary School Curriculum Service
 * Implements Req 3.3, 3.4, 3.5 - Curriculum assignment based on grade and stream
 */

export interface CurriculumSubject {
  code: string;
  name: string;
  creditHours: number;
  isCore: boolean;
}

/**
 * Grade 9-10 Common Curriculum
 * Req 3.3: English, Mathematics, Physics, Chemistry, Biology, Geography, History, Economics, Civics, IT, and Physical Education
 */
const GRADE_9_10_SUBJECTS: CurriculumSubject[] = [
  { code: 'ENG', name: 'English', creditHours: 4, isCore: true },
  { code: 'MATH', name: 'Mathematics', creditHours: 5, isCore: true },
  { code: 'PHY', name: 'Physics', creditHours: 3, isCore: true },
  { code: 'CHEM', name: 'Chemistry', creditHours: 3, isCore: true },
  { code: 'BIO', name: 'Biology', creditHours: 3, isCore: true },
  { code: 'GEO', name: 'Geography', creditHours: 2, isCore: true },
  { code: 'HIST', name: 'History', creditHours: 2, isCore: true },
  { code: 'ECON', name: 'Economics', creditHours: 2, isCore: true },
  { code: 'CIV', name: 'Civics', creditHours: 2, isCore: true },
  { code: 'IT', name: 'Information Technology', creditHours: 2, isCore: true },
  { code: 'PE', name: 'Physical Education', creditHours: 2, isCore: false },
];

/**
 * Grade 11-12 Natural Science Stream
 * Req 3.4: English, Advanced Math, Physics, Chemistry, Biology, and IT
 */
const GRADE_11_12_NATURAL_SCIENCE_SUBJECTS: CurriculumSubject[] = [
  { code: 'ENG', name: 'English', creditHours: 4, isCore: true },
  { code: 'ADV-MATH', name: 'Advanced Mathematics', creditHours: 6, isCore: true },
  { code: 'PHY', name: 'Physics', creditHours: 5, isCore: true },
  { code: 'CHEM', name: 'Chemistry', creditHours: 5, isCore: true },
  { code: 'BIO', name: 'Biology', creditHours: 5, isCore: true },
  { code: 'IT', name: 'Information Technology', creditHours: 3, isCore: true },
];

/**
 * Grade 11-12 Social Science Stream
 * Req 3.5: English, Geography, History, Economics, Civics, Mathematics, and IT
 */
const GRADE_11_12_SOCIAL_SCIENCE_SUBJECTS: CurriculumSubject[] = [
  { code: 'ENG', name: 'English', creditHours: 4, isCore: true },
  { code: 'GEO', name: 'Geography', creditHours: 4, isCore: true },
  { code: 'HIST', name: 'History', creditHours: 4, isCore: true },
  { code: 'ECON', name: 'Economics', creditHours: 4, isCore: true },
  { code: 'CIV', name: 'Civics', creditHours: 4, isCore: true },
  { code: 'MATH', name: 'Mathematics', creditHours: 4, isCore: true },
  { code: 'IT', name: 'Information Technology', creditHours: 3, isCore: true },
];

/**
 * Get subjects for a specific grade and stream
 */
export const getSubjectsForGradeAndStream = async (
  grade: GradeLevel,
  stream: Stream
): Promise<CurriculumSubject[]> => {
  // Grade 9-10: Common curriculum
  if (grade === 9 || grade === 10) {
    return GRADE_9_10_SUBJECTS;
  }

  // Grade 11-12: Stream-specific curriculum
  if (grade === 11 || grade === 12) {
    if (stream === Stream.NATURAL_SCIENCE) {
      return GRADE_11_12_NATURAL_SCIENCE_SUBJECTS;
    } else if (stream === Stream.SOCIAL_SCIENCE) {
      return GRADE_11_12_SOCIAL_SCIENCE_SUBJECTS;
    }
  }

  return [];
};

/**
 * Initialize curriculum in database
 * Creates all subject records if they don't exist
 */
export const initializeCurriculum = async (): Promise<void> => {
  try {
    // Create grade 9-10 subjects
    for (const subjectData of GRADE_9_10_SUBJECTS) {
      await Subject.findOneAndUpdate(
        { code: subjectData.code },
        {
          ...subjectData,
          grades: [9, 10],
          streams: [Stream.COMMON],
        },
        { upsert: true, new: true }
      );
    }

    // Create Natural Science subjects
    for (const subjectData of GRADE_11_12_NATURAL_SCIENCE_SUBJECTS) {
      const existing = await Subject.findOne({ code: subjectData.code });
      if (existing) {
        // Update existing subject to include new grades/streams
        if (!existing.grades.includes(11)) existing.grades.push(11);
        if (!existing.grades.includes(12)) existing.grades.push(12);
        if (!existing.streams.includes(Stream.NATURAL_SCIENCE)) {
          existing.streams.push(Stream.NATURAL_SCIENCE);
        }
        await existing.save();
      } else {
        await Subject.create({
          ...subjectData,
          grades: [11, 12],
          streams: [Stream.NATURAL_SCIENCE],
        });
      }
    }

    // Create Social Science subjects
    for (const subjectData of GRADE_11_12_SOCIAL_SCIENCE_SUBJECTS) {
      const existing = await Subject.findOne({ code: subjectData.code });
      if (existing) {
        // Update existing subject to include new grades/streams
        if (!existing.grades.includes(11)) existing.grades.push(11);
        if (!existing.grades.includes(12)) existing.grades.push(12);
        if (!existing.streams.includes(Stream.SOCIAL_SCIENCE)) {
          existing.streams.push(Stream.SOCIAL_SCIENCE);
        }
        await existing.save();
      } else {
        await Subject.create({
          ...subjectData,
          grades: [11, 12],
          streams: [Stream.SOCIAL_SCIENCE],
        });
      }
    }

    logger.info('Curriculum initialized successfully');
  } catch (error) {
    logger.error('Error initializing curriculum', { error });
    throw error;
  }
};

/**
 * Get all subjects for a grade and stream from database
 */
export const getSubjectsFromDatabase = async (
  grade: GradeLevel,
  stream: Stream
): Promise<any[]> => {
  const query: any = {
    grades: grade,
  };

  // For grades 9-10, get common subjects
  if (grade === 9 || grade === 10) {
    query.streams = Stream.COMMON;
  }
  // For grades 11-12, get stream-specific subjects
  else if (grade === 11 || grade === 12) {
    query.streams = stream;
  }

  return await Subject.find(query).sort({ isCore: -1, name: 1 });
};

/**
 * Validate if a subject is valid for a grade and stream
 */
export const validateSubjectForGradeStream = async (
  subjectId: string,
  grade: GradeLevel,
  stream: Stream
): Promise<boolean> => {
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    return false;
  }

  // Check if grade is valid for subject
  if (!subject.grades.includes(grade)) {
    return false;
  }

  // Check if stream is valid for subject
  if (grade >= 11 && !subject.streams.includes(stream)) {
    return false;
  }

  return true;
};

/**
 * Get total credit hours for a grade and stream
 */
export const getTotalCreditHours = async (
  grade: GradeLevel,
  stream: Stream
): Promise<number> => {
  const subjects = await getSubjectsFromDatabase(grade, stream);
  return subjects.reduce((total, subject) => total + subject.creditHours, 0);
};
