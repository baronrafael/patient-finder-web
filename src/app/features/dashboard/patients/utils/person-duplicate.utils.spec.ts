import { describe, expect, it } from 'vitest';

import { PatientRecord } from '../../../patient-search/models/patient-record.model';
import { PersonFormValue } from '../models/person-form.model';
import { EMPTY_PERSON_FORM } from '../models/person-form.model';
import {
  buildDuplicateSearchQuery,
  classifyDuplicateMatches,
  isExactDuplicateMatch,
  isSimilarDuplicateMatch,
} from './person-duplicate.utils';

const basePatient = (overrides: Partial<PatientRecord> = {}): PatientRecord => ({
  id: 'patient-1',
  sourceRow: 0,
  fullName: 'Ana Pérez',
  age: '32',
  identityDocument: '28443736',
  phone: '+58 412-0000000',
  address: 'Petare, Sucre, Miranda',
  observations: null,
  hospitalId: 'center-1',
    hospitalName: 'Hospital Central',
    sourceHospitalName: 'Hospital Central',
    score: null,
    matchConfidence: null,
    ...overrides,
});

const baseForm = (overrides: Partial<PersonFormValue> = {}): PersonFormValue => ({
  ...EMPTY_PERSON_FORM,
  firstName: 'Ana',
  lastName: 'Pérez',
  cedula: '28.443.736',
  centerId: 'center-1',
  rescueEstadoId: 'estado-1',
  rescueMunicipioId: 'municipio-1',
  admittedAt: '2026-06-26T10:00',
  ...overrides,
});

describe('buildDuplicateSearchQuery', () => {
  it('prefers cedula when it has enough digits', () => {
    expect(buildDuplicateSearchQuery(baseForm())).toBe('28443736');
  });

  it('uses full name when cedula is missing', () => {
    expect(
      buildDuplicateSearchQuery(
        baseForm({
          cedula: '',
        }),
      ),
    ).toBe('Ana Pérez');
  });

  it('returns null when there is not enough identity data', () => {
    expect(buildDuplicateSearchQuery(EMPTY_PERSON_FORM)).toBeNull();
  });
});

describe('isExactDuplicateMatch', () => {
  it('matches the same cedula ignoring punctuation', () => {
    expect(isExactDuplicateMatch(baseForm(), basePatient())).toBe(true);
  });

  it('matches cedula with accents normalized in names when both are present', () => {
    expect(
      isExactDuplicateMatch(
        baseForm({ firstName: 'José', lastName: 'Muñoz', cedula: '12345678' }),
        basePatient({
          fullName: 'Jose Munoz',
          identityDocument: '12345678',
        }),
      ),
    ).toBe(true);
  });

  it('does not match a different cedula', () => {
    expect(
      isExactDuplicateMatch(
        baseForm({ cedula: '99999999' }),
        basePatient({ identityDocument: '28443736' }),
      ),
    ).toBe(false);
  });
});

describe('isSimilarDuplicateMatch', () => {
  it('matches similar names without the same cedula', () => {
    expect(
      isSimilarDuplicateMatch(
        baseForm({ cedula: '', firstName: 'Ana', lastName: 'Perez' }),
        basePatient({ identityDocument: null, fullName: 'Ana Maria Perez' }),
      ),
    ).toBe(true);
  });

  it('does not classify exact cedula matches as similar', () => {
    expect(isSimilarDuplicateMatch(baseForm(), basePatient())).toBe(false);
  });
});

describe('classifyDuplicateMatches', () => {
  it('returns exact when cedula matches', () => {
    const result = classifyDuplicateMatches(baseForm(), [basePatient()], '28443736');

    expect(result.kind).toBe('exact');
    expect(result.primaryMatch?.patient.id).toBe('patient-1');
  });

  it('returns similar when only names are close', () => {
    const result = classifyDuplicateMatches(
      baseForm({ cedula: '', firstName: 'Ana', lastName: 'Perez' }),
      [basePatient({ identityDocument: null, fullName: 'Ana Maria Perez' })],
      'Ana Perez',
    );

    expect(result.kind).toBe('similar');
  });

  it('returns none when there are no relevant matches', () => {
    const result = classifyDuplicateMatches(
      baseForm({ cedula: '11111111', firstName: 'Carlos', lastName: 'Ruiz' }),
      [basePatient()],
      '11111111',
    );

    expect(result.kind).toBe('none');
  });
});
