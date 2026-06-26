import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';

import {
  parsePatientSearchUrlParams,
  patientSearchUrlParamsMatch,
  serializePatientSearchUrlParams,
} from './patient-search-url';

describe('patient-search-url', () => {
  it('serializes active search and filters into shareable query params', () => {
    const params = serializePatientSearchUrlParams({
      query: 'García',
      hospitalId: 'center-1',
      sex: 'f',
      estadoId: 'estado-1',
      municipioId: 'municipio-1',
      parroquiaId: 'parroquia-1',
      page: 2,
      pageSize: 30,
    });

    expect(params).toEqual({
      q: 'García',
      sex: 'f',
      estado_id: 'estado-1',
      municipio_id: 'municipio-1',
      parroquia_id: 'parroquia-1',
      center_id: 'center-1',
      page: 2,
    });
  });

  it('omits inactive query text and first page from the url', () => {
    const params = serializePatientSearchUrlParams({
      query: 'G',
      hospitalId: null,
      sex: null,
      estadoId: null,
      municipioId: null,
      parroquiaId: null,
      page: 1,
      pageSize: 30,
    });

    expect(params).toEqual({
      q: null,
      sex: null,
      estado_id: null,
      municipio_id: null,
      parroquia_id: null,
      center_id: null,
      page: null,
    });
  });

  it('parses query params back into search state', () => {
    const parsed = parsePatientSearchUrlParams(
      convertToParamMap({
        q: 'María Pérez',
        sex: 'm',
        estado_id: 'estado-1',
        municipio_id: 'municipio-1',
        parroquia_id: 'parroquia-1',
        center_id: 'center-1',
        page: '3',
      }),
    );

    expect(parsed).toEqual({
      query: 'María Pérez',
      hospitalId: 'center-1',
      sex: 'm',
      estadoId: 'estado-1',
      municipioId: 'municipio-1',
      parroquiaId: 'parroquia-1',
      page: 3,
    });
  });

  it('detects when the current url already matches the next params', () => {
    const current = convertToParamMap({
      q: 'Garcia',
      sex: 'f',
      estado_id: 'estado-1',
    });
    const next = serializePatientSearchUrlParams({
      query: 'Garcia',
      hospitalId: null,
      sex: 'f',
      estadoId: 'estado-1',
      municipioId: null,
      parroquiaId: null,
      page: 1,
      pageSize: 30,
    });

    expect(patientSearchUrlParamsMatch(current, next)).toBe(true);
  });
});
