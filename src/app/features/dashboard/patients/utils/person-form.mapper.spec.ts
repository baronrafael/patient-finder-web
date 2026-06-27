import { describe, expect, it } from 'vitest';

import { EMPTY_PERSON_FORM } from '../models/person-form.model';
import {
  createEmptyPersonFormModel,
  defaultAdmittedAtLocal,
  personFormModelToValue,
  personFormValueToModel,
} from './person-form.mapper';

describe('personFormValueToModel', () => {
  it('maps nullable fields to form strings', () => {
    const model = personFormValueToModel({
      ...EMPTY_PERSON_FORM,
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      cedula: '12345678',
      sex: 'm',
      ageApprox: 45,
      admittedAt: '2026-06-26T10:00',
      rescueEstadoId: 'estado-1',
      rescueMunicipioId: 'municipio-1',
      rescueParroquiaId: 'parroquia-1',
      centerId: 'center-1',
      contacts: '+58 412-1234567',
      notes: 'Observaciones',
    });

    expect(model.sex).toBe('m');
    expect(model.ageApprox).toBe('45');
    expect(model.rescueParroquiaId).toBe('parroquia-1');
  });
});

describe('personFormModelToValue', () => {
  it('trims strings and parses age', () => {
    const value = personFormModelToValue({
      ...createEmptyPersonFormModel(),
      firstName: '  Carlos ',
      lastName: ' Rodriguez ',
      cedula: ' 12345678 ',
      sex: 'f',
      ageApprox: '33',
      rescueParroquiaId: '',
    });

    expect(value.firstName).toBe('Carlos');
    expect(value.lastName).toBe('Rodriguez');
    expect(value.sex).toBe('f');
    expect(value.ageApprox).toBe(33);
    expect(value.rescueParroquiaId).toBeNull();
  });
});

describe('defaultAdmittedAtLocal', () => {
  it('returns a datetime-local compatible string', () => {
    expect(defaultAdmittedAtLocal(new Date('2026-06-26T15:30:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
