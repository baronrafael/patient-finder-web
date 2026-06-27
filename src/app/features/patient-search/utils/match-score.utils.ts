import { MatchConfidenceLevel, PatientRecord } from '../models/patient-record.model';
import {
  MATCH_CONFIDENCE_LABELS,
  MATCH_SCORE_HIGH_THRESHOLD,
  MATCH_SCORE_MEDIUM_THRESHOLD,
} from './match-score.constants';

export function calcMatchPercent(score: number, maxScore: number): number {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}

export function classifyMatchConfidence(score: number, maxScore: number): MatchConfidenceLevel {
  const percent = calcMatchPercent(score, maxScore);

  if (percent >= MATCH_SCORE_HIGH_THRESHOLD) {
    return 'high';
  }

  if (percent >= MATCH_SCORE_MEDIUM_THRESHOLD) {
    return 'medium';
  }

  return 'low';
}

export function matchConfidenceLabel(level: MatchConfidenceLevel): string {
  return MATCH_CONFIDENCE_LABELS[level];
}

export function resolveSearchMaxScoreFromItems(
  items: readonly PatientRecord[],
  page: number,
  cachedMaxScore: number | null,
): number | null {
  if (page <= 1) {
    const score = items[0]?.score;
    return score != null ? score : null;
  }

  return cachedMaxScore;
}

export function withMatchConfidence(
  patient: PatientRecord,
  maxScore: number | null,
): PatientRecord {
  if (maxScore == null || maxScore <= 0 || patient.score == null) {
    return { ...patient, matchConfidence: null };
  }

  return {
    ...patient,
    matchConfidence: classifyMatchConfidence(patient.score, maxScore),
  };
}

export function enrichPatientsWithMatchConfidence(
  items: readonly PatientRecord[],
  maxScore: number | null,
): PatientRecord[] {
  return items.map((patient) => withMatchConfidence(patient, maxScore));
}
