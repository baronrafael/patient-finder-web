import { HttpParams } from '@angular/common/http';

import { PersonSex } from '../models/person-sex.model';
import { formatSearchQueryForApi } from './person-search.utils';

export interface PersonQueryParamsInput {
  readonly query: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sex?: PersonSex | null;
  readonly centerId?: string | null;
  readonly status?: string | null;
  readonly estadoId?: string | null;
  readonly municipioId?: string | null;
  readonly parroquiaId?: string | null;
}

export function buildPersonQueryHttpParams(input: PersonQueryParamsInput): HttpParams {
  let params = new HttpParams().set('page_size', input.pageSize);

  const trimmedQuery = input.query.trim();
  if (trimmedQuery) {
    params = params.set('q', formatSearchQueryForApi(trimmedQuery));
  }
  if (input.sex) {
    params = params.set('sex', input.sex);
  }
  if (input.status) {
    params = params.set('status', input.status);
  }
  if (input.centerId) {
    params = params.set('center_id', input.centerId);
  }
  if (input.estadoId) {
    params = params.set('estado_id', input.estadoId);
  }
  if (input.municipioId) {
    params = params.set('municipio_id', input.municipioId);
  }
  if (input.parroquiaId) {
    params = params.set('parroquia_id', input.parroquiaId);
  }
  if (input.page > 1) {
    params = params.set('page', input.page);
  }

  return params;
}
