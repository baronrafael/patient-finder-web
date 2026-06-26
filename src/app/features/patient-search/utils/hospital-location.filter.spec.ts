import { describe, expect, it } from 'vitest';

import { Hospital } from '../models/hospital.model';
import {
  filterHospitalsByLocation,
  hospitalMatchesLocationFilter,
} from './hospital-location.filter';

const hospitals: readonly Hospital[] = [
  {
    id: 'a',
    name: 'Hospital A',
    sourceNames: ['Hospital A'],
    recordCount: 0,
    estadoId: 'estado-1',
    municipioId: 'municipio-1',
    parroquiaId: 'parroquia-1',
  },
  {
    id: 'b',
    name: 'Hospital B',
    sourceNames: ['Hospital B'],
    recordCount: 0,
    estadoId: 'estado-2',
    municipioId: 'municipio-2',
    parroquiaId: 'parroquia-2',
  },
];

describe('filterHospitalsByLocation', () => {
  it('returns all hospitals when no location is selected', () => {
    expect(
      filterHospitalsByLocation(hospitals, {
        estadoId: null,
        municipioId: null,
        parroquiaId: null,
      }),
    ).toEqual(hospitals);
  });

  it('filters by the most specific selected location', () => {
    expect(
      filterHospitalsByLocation(hospitals, {
        estadoId: 'estado-1',
        municipioId: 'municipio-1',
        parroquiaId: 'parroquia-1',
      }),
    ).toEqual([hospitals[0]]);
  });

  it('filters by estado only', () => {
    expect(
      filterHospitalsByLocation(hospitals, {
        estadoId: 'estado-2',
        municipioId: null,
        parroquiaId: null,
      }),
    ).toEqual([hospitals[1]]);
  });
});

describe('hospitalMatchesLocationFilter', () => {
  it('detects when a selected hospital no longer matches the location', () => {
    expect(
      hospitalMatchesLocationFilter(hospitals[0], {
        estadoId: 'estado-2',
        municipioId: null,
        parroquiaId: null,
      }),
    ).toBe(false);
  });
});
