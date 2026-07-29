import mongoose from 'mongoose';
import { LetterGrade } from '../types';

/**
 * Default grade thresholds (used when no active GradeScale exists)
 */
const DEFAULT_THRESHOLDS = [
  { letter: 'A', minPercent: 90, gradePoint: 4.0 },
  { letter: 'B', minPercent: 80, gradePoint: 3.0 },
  { letter: 'C', minPercent: 70, gradePoint: 2.0 },
  { letter: 'D', minPercent: 60, gradePoint: 1.0 },
  { letter: 'F', minPercent: 0, gradePoint: 0.0 },
];

const LETTER_GRADE_MAP: Record<string, LetterGrade> = {
  'A': LetterGrade.A,
  'B': LetterGrade.B,
  'C': LetterGrade.C,
  'D': LetterGrade.D,
  'F': LetterGrade.F,
};

/**
 * Calculate letter grade and grade point from percentage using the provided thresholds.
 * Falls back to default thresholds if none provided.
 */
export function calculateGradeFromPercentage(
  percentage: number,
  thresholds?: { letter: string; minPercent: number; gradePoint: number }[]
): { letterGrade: LetterGrade; gradePoint: number } {
  const tiers = thresholds && thresholds.length > 0
    ? [...thresholds].sort((a, b) => b.minPercent - a.minPercent)
    : DEFAULT_THRESHOLDS;

  for (const tier of tiers) {
    if (percentage >= tier.minPercent) {
      return {
        letterGrade: LETTER_GRADE_MAP[tier.letter] || LetterGrade.F,
        gradePoint: tier.gradePoint,
      };
    }
  }

  return { letterGrade: LetterGrade.F, gradePoint: 0.0 };
}

/**
 * Fetch the active GradeScale for the given academic year.
 * Returns null if none found (callers should fall back to defaults).
 */
export async function getActiveGradeScale(academicYear?: string): Promise<{
  gradeThresholds: { letter: string; minPercent: number; gradePoint: number }[];
  typeWeights: { type: string; weight: number }[];
  passThreshold: number;
} | null> {
  try {
    const GradeScale = mongoose.model('GradeScale');
    const now = new Date();
    const ay = academicYear || (now.getMonth() + 1 >= 9
      ? `${now.getFullYear()}/${now.getFullYear() + 1}`
      : `${now.getFullYear() - 1}/${now.getFullYear()}`);

    let scale = await GradeScale.findOne({ academicYear: ay, isActive: true });
    if (!scale) scale = await GradeScale.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!scale) return null;
    return {
      gradeThresholds: scale.gradeThresholds,
      typeWeights: scale.typeWeights,
      passThreshold: scale.passThreshold,
    };
  } catch {
    return null;
  }
}

/**
 * Apply type weights to calculate a weighted average for a subject.
 * assessments: array of { percentage, type }
 * typeWeights: array of { type, weight }
 *
 * Returns the weighted percentage, or null if no weights are configured.
 */
export function calculateWeightedAverage(
  assessments: { percentage: number; type: string }[],
  typeWeights?: { type: string; weight: number }[]
): number | null {
  if (!assessments.length) return 0;
  if (!typeWeights || typeWeights.length === 0) return null;

  const weightMap = new Map<string, number>();
  for (const tw of typeWeights) {
    weightMap.set(tw.type, tw.weight);
  }

  // Group assessments by type and average within each type
  const typeAverages = new Map<string, { sum: number; count: number }>();
  for (const a of assessments) {
    const existing = typeAverages.get(a.type) || { sum: 0, count: 0 };
    existing.sum += a.percentage;
    existing.count++;
    typeAverages.set(a.type, existing);
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [type, data] of typeAverages) {
    const weight = weightMap.get(type);
    if (weight !== undefined) {
      const avg = data.sum / data.count;
      weightedSum += avg * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Calculate overall average for a list of subject averages.
 * Applies type weights if available for each subject's assessments.
 */
export function calculateOverallAverage(
  subjectAverages: number[]
): number {
  if (subjectAverages.length === 0) return 0;
  return Math.round(
    (subjectAverages.reduce((sum, avg) => sum + avg, 0) / subjectAverages.length) * 100
  ) / 100;
}
