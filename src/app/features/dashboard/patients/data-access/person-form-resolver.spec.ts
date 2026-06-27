import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { ApiPersonDto } from '../../../../core/api/person-api.dto';
import { PatientRepository } from '../../../patient-search/data-access/patient.repository';
import { resolvePersonFormValue } from './person-form-resolver';

const person: ApiPersonDto = {
  id: 'person-1',
  first_name: 'Ana',
  last_name: 'Pérez',
  cedula: '28443736',
  sex: 'F',
  age_approx: 32,
  status: 'hospitalized',
  admitted_at: '2026-06-26T14:30:00Z',
  rescue_estado: 'Miranda',
  rescue_municipio: 'Sucre',
  rescue_parroquia: 'Petare',
  center: { id: 'center-1', name: 'Hospital Central' },
  contacts: '+58 412-0000000',
  notes: 'Notas',
};

const catalog: PatientRepository = {
  getEstados: () =>
    of([
      { id: 'estado-miranda', name: 'Miranda' },
      { id: 'estado-zulia', name: 'Zulia' },
    ]),
  getMunicipios: (estadoId: string) =>
    of(
      estadoId === 'estado-miranda'
        ? [{ id: 'municipio-sucre', name: 'Sucre', estadoId: 'estado-miranda' }]
        : [],
    ),
  getParroquias: (municipioId: string) =>
    of(
      municipioId === 'municipio-sucre'
        ? [{ id: 'parroquia-petare', name: 'Petare', municipioId: 'municipio-sucre' }]
        : [],
    ),
  search: () => {
    throw new Error('not used');
  },
  getStats: () => of(null),
  getHospitals: () => of([]),
};

describe('resolvePersonFormValue', () => {
  it('resolves geo names to catalog ids for the edit form', async () => {
    const formValue = await firstValueFrom(resolvePersonFormValue(person, catalog));

    expect(formValue).toMatchObject({
      firstName: 'Ana',
      lastName: 'Pérez',
      cedula: '28443736',
      sex: 'f',
      ageApprox: 32,
      status: 'hospitalized',
      rescueEstadoId: 'estado-miranda',
      rescueMunicipioId: 'municipio-sucre',
      rescueParroquiaId: 'parroquia-petare',
      centerId: 'center-1',
      contacts: '+58 412-0000000',
      notes: 'Notas',
    });
    expect(formValue.admittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('leaves geo ids empty when names do not match the catalog', async () => {
    const formValue = await firstValueFrom(
      resolvePersonFormValue(
        {
          ...person,
          rescue_estado: 'Estado desconocido',
        },
        catalog,
      ),
    );

    expect(formValue.rescueEstadoId).toBe('');
    expect(formValue.rescueMunicipioId).toBe('');
    expect(formValue.rescueParroquiaId).toBeNull();
  });
});
