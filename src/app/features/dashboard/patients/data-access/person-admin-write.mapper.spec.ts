import { describe, expect, it } from 'vitest';

import { EMPTY_PERSON_FORM } from '../models/person-form.model';
import { mapPersonFormToWriteDto } from './person-admin-write.mapper';

const validForm = {
  ...EMPTY_PERSON_FORM,
  firstName: 'Carlos',
  lastName: 'Rodríguez',
  cedula: '12.345.678',
  sex: 'm' as const,
  ageApprox: 45,
  status: 'hospitalized' as const,
  admittedAt: '2026-06-26T10:00',
  rescueEstadoId: 'estado-1',
  rescueMunicipioId: 'municipio-1',
  rescueParroquiaId: 'parroquia-1',
  centerId: 'center-1',
  contacts: '+58 412-1234567',
  notes: 'Observación de prueba',
};

describe('mapPersonFormToWriteDto', () => {
  it('maps form values to the API write payload', () => {
    const dto = mapPersonFormToWriteDto(validForm);

    expect(dto).toEqual({
      first_name: 'Carlos',
      last_name: 'Rodríguez',
      cedula: '12345678',
      sex: 'M',
      age_approx: 45,
      status: 'hospitalized',
      admitted_at: expect.any(String),
      rescue_estado_id: 'estado-1',
      rescue_municipio_id: 'municipio-1',
      rescue_parroquia_id: 'parroquia-1',
      center_id: 'center-1',
      contacts: '+58 412-1234567',
      notes: 'Observación de prueba',
    });
  });

  it('omits optional fields when empty', () => {
    const dto = mapPersonFormToWriteDto({
      ...EMPTY_PERSON_FORM,
      cedula: '12345678',
      admittedAt: '2026-06-26T10:00',
      rescueEstadoId: 'estado-1',
      rescueMunicipioId: 'municipio-1',
      centerId: 'center-1',
    });

    expect(dto).toMatchObject({
      cedula: '12345678',
      rescue_estado_id: 'estado-1',
      rescue_municipio_id: 'municipio-1',
      center_id: 'center-1',
    });
    expect(dto.first_name).toBeUndefined();
    expect(dto.last_name).toBeUndefined();
    expect(dto.sex).toBeUndefined();
    expect(dto.age_approx).toBeUndefined();
    expect(dto.rescue_parroquia_id).toBeUndefined();
    expect(dto.contacts).toBeUndefined();
    expect(dto.notes).toBeUndefined();
  });
});
