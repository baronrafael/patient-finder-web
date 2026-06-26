import { ParamMap, Params } from '@angular/router';

import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSex } from '../models/patient-sex.model';
import { isSearchActive } from './patient-search.matcher';

export const PATIENT_SEARCH_URL_PARAM_KEYS = [
  'q',
  'sex',
  'estado_id',
  'municipio_id',
  'parroquia_id',
  'center_id',
  'page',
] as const;

export type PatientSearchUrlParamKey = (typeof PATIENT_SEARCH_URL_PARAM_KEYS)[number];

export interface ParsedPatientSearchUrlParams {
  readonly query: string;
  readonly hospitalId: string | null;
  readonly sex: PatientSex | null;
  readonly estadoId: string | null;
  readonly municipioId: string | null;
  readonly parroquiaId: string | null;
  readonly page: number;
}

export function serializePatientSearchUrlParams(query: PatientSearchQuery): Params {
  const trimmedQuery = query.query.trim();

  return {
    q: isSearchActive(trimmedQuery) ? trimmedQuery : null,
    sex: query.sex,
    estado_id: query.estadoId,
    municipio_id: query.municipioId,
    parroquia_id: query.parroquiaId,
    center_id: query.hospitalId,
    page: query.page > 1 ? query.page : null,
  };
}

export function parsePatientSearchUrlParams(params: ParamMap): ParsedPatientSearchUrlParams {
  return {
    query: params.get('q') ?? '',
    hospitalId: readNullableParam(params, 'center_id'),
    sex: parsePatientSexParam(params.get('sex')),
    estadoId: readNullableParam(params, 'estado_id'),
    municipioId: readNullableParam(params, 'municipio_id'),
    parroquiaId: readNullableParam(params, 'parroquia_id'),
    page: parsePositiveIntParam(params.get('page')) ?? 1,
  };
}

export function hasPatientSearchUrlState(params: ParamMap): boolean {
  return PATIENT_SEARCH_URL_PARAM_KEYS.some((key) => params.get(key) !== null);
}

export function patientSearchUrlParamsMatch(current: ParamMap, next: Params): boolean {
  return PATIENT_SEARCH_URL_PARAM_KEYS.every((key) => {
    const currentValue = current.get(key);
    const nextValue = next[key];
    const normalizedNext =
      nextValue === null || nextValue === undefined ? null : String(nextValue);

    return currentValue === normalizedNext;
  });
}

function readNullableParam(params: ParamMap, key: PatientSearchUrlParamKey): string | null {
  const value = params.get(key);
  return value && value.trim() !== '' ? value : null;
}

function parsePatientSexParam(value: string | null): PatientSex | null {
  return value === 'm' || value === 'f' ? value : null;
}

function parsePositiveIntParam(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
