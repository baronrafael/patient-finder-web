import { describe, expect, it } from 'vitest';

import { EMPTY_PERSON_FORM } from '../models/person-form.model';
import {
  hasValidPersonIdentity,
  isPersonFormValid,
  normalizePersonFormCedula,
  parsePersonFormSex,
  validatePersonForm,
} from './person-form.validation';

const validForm = {
  ...EMPTY_PERSON_FORM,
  firstName: 'Carlos',
  lastName: 'Rodríguez',
  cedula: '12345678',
  sex: 'm' as const,
  ageApprox: 45,
  admittedAt: '2026-06-26T10:00',
  rescueEstadoId: 'estado-1',
  rescueMunicipioId: 'municipio-1',
  centerId: 'center-1',
};

describe('normalizePersonFormCedula', () => {
  it('strips non-digit characters', () => {
    expect(normalizePersonFormCedula('12.345.678')).toBe('12345678');
  });
});

describe('hasValidPersonIdentity', () => {
  it('accepts a valid cedula without names', () => {
    expect(
      hasValidPersonIdentity({
        ...EMPTY_PERSON_FORM,
        cedula: '12345678',
      }),
    ).toBe(true);
  });

  it('accepts first and last name without cedula', () => {
    expect(
      hasValidPersonIdentity({
        ...EMPTY_PERSON_FORM,
        firstName: 'Carlos',
        lastName: 'Rodríguez',
      }),
    ).toBe(true);
  });

  it('rejects partial identity data', () => {
    expect(
      hasValidPersonIdentity({
        ...EMPTY_PERSON_FORM,
        firstName: 'Carlos',
        cedula: '123',
      }),
    ).toBe(false);
  });
});

describe('validatePersonForm', () => {
  it('returns no errors for a complete form', () => {
    expect(validatePersonForm(validForm)).toEqual({});
    expect(isPersonFormValid(validatePersonForm(validForm))).toBe(true);
  });

  it('requires rescue geography and center', () => {
    const errors = validatePersonForm({
      ...validForm,
      rescueEstadoId: '',
      rescueMunicipioId: '',
      centerId: '',
    });

    expect(errors.rescueEstadoId).toBeTruthy();
    expect(errors.rescueMunicipioId).toBeTruthy();
    expect(errors.centerId).toBeTruthy();
  });

  it('requires admittedAt', () => {
    const errors = validatePersonForm({
      ...validForm,
      admittedAt: '',
    });

    expect(errors.admittedAt).toBeTruthy();
  });

  it('validates cedula length when provided', () => {
    const errors = validatePersonForm({
      ...validForm,
      firstName: '',
      lastName: '',
      cedula: '12345',
    });

    expect(errors.identity).toBeTruthy();
    expect(errors.cedula).toBeTruthy();
  });

  it('validates age range when provided', () => {
    const errors = validatePersonForm({
      ...validForm,
      ageApprox: 200,
    });

    expect(errors.ageApprox).toBeTruthy();
  });
});

describe('parsePersonFormSex', () => {
  it('maps select values to PersonSex', () => {
    expect(parsePersonFormSex('m')).toBe('m');
    expect(parsePersonFormSex('f')).toBe('f');
    expect(parsePersonFormSex('')).toBeNull();
  });
});
