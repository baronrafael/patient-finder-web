import { describe, expect, it } from 'vitest';

import { PatientRecord } from '../models/patient-record.model';
import {
  calcMatchPercent,
  classifyMatchConfidence,
  enrichPatientsWithMatchConfidence,
  resolveSearchMaxScoreFromItems,
} from './match-score.utils';

function createPatient(score: number | null): PatientRecord {
  return {
    id: '1',
    sourceRow: 1,
    fullName: 'Ana Pérez',
    age: null,
    identityDocument: null,
    phone: null,
    address: null,
    observations: null,
    hospitalId: 'hospital-a',
    hospitalName: 'Hospital A',
    sourceHospitalName: 'Hospital A',
    score,
    matchConfidence: null,
  };
}

describe('calcMatchPercent', () => {
  it('calculates percent from score and max score', () => {
    expect(calcMatchPercent(100, 100)).toBe(100);
    expect(calcMatchPercent(50, 100)).toBe(50);
    expect(calcMatchPercent(43, 100)).toBe(43);
  });
});

describe('classifyMatchConfidence', () => {
  it('maps 100 percent to high, not exact', () => {
    expect(classifyMatchConfidence(100, 100)).toBe('high');
  });

  it('classifies high, medium and low thresholds', () => {
    expect(classifyMatchConfidence(85, 100)).toBe('high');
    expect(classifyMatchConfidence(84, 100)).toBe('medium');
    expect(classifyMatchConfidence(55, 100)).toBe('medium');
    expect(classifyMatchConfidence(54, 100)).toBe('low');
  });
});

describe('resolveSearchMaxScoreFromItems', () => {
  it('uses the first item on page 1', () => {
    expect(resolveSearchMaxScoreFromItems([createPatient(92), createPatient(40)], 1, null)).toBe(92);
  });

  it('keeps cached max score on later pages', () => {
    expect(resolveSearchMaxScoreFromItems([createPatient(40)], 2, 92)).toBe(92);
  });
});

describe('enrichPatientsWithMatchConfidence', () => {
  it('adds match confidence using the cached max score', () => {
    const [patient] = enrichPatientsWithMatchConfidence([createPatient(60)], 100);

    expect(patient.matchConfidence).toBe('medium');
  });
});
