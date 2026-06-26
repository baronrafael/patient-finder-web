import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Hospital } from '../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../models/location.model';
import { PatientRecord } from '../models/patient-record.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSearchResult } from '../models/patient-search-result.model';
import { PatientRepository } from './patient.repository';

interface ApiStateDto {
  readonly id: string;
  readonly name: string;
}

interface ApiMunicipalityDto {
  readonly id: string;
  readonly name: string;
  readonly estado_id?: string;
}

interface ApiParishDto {
  readonly id: string;
  readonly name: string;
  readonly municipio_id?: string;
}

interface ApiStatesResponseDto {
  readonly data: {
    readonly states: readonly ApiStateDto[];
  };
}

interface ApiMunicipalitiesResponseDto {
  readonly data: {
    readonly municipalities: readonly ApiMunicipalityDto[];
  };
}

interface ApiParishesResponseDto {
  readonly data: {
    readonly parishes: readonly ApiParishDto[];
  };
}

interface ApiPersonDto {
  readonly id: string;
  readonly fullName?: string;
  readonly full_name?: string;
  readonly name?: string;
  readonly age?: string | number | null;
  readonly identityDocument?: string | null;
  readonly identity_document?: string | null;
  readonly cedula?: string | null;
  readonly phone?: string | null;
  readonly address?: string | null;
  readonly observations?: string | null;
  readonly hospital?: {
    readonly id?: string;
    readonly name?: string;
  } | null;
  readonly hospitalName?: string | null;
  readonly hospital_name?: string | null;
}

interface ApiPaginationDto {
  readonly total?: number;
  readonly page?: number;
  readonly pageSize?: number;
  readonly page_size?: number;
  readonly hasMore?: boolean;
  readonly has_more?: boolean;
  readonly updatedAt?: string;
  readonly updated_at?: string;
  readonly datasetUpdatedAt?: string;
  readonly dataset_updated_at?: string;
}

interface ApiPersonSearchResponseDto {
  readonly data: {
    readonly persons: readonly ApiPersonDto[];
  };
  readonly pagination?: ApiPaginationDto;
}

@Injectable({ providedIn: 'root' })
export class ApiPatientRepository extends PatientRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  override getHospitals(): Observable<readonly Hospital[]> {
    // Pendiente: César no documentó endpoint de hospitales todavía.
    return of([]);
  }

  override getEstados(): Observable<readonly Estado[]> {
    return this.http.get<ApiStatesResponseDto>(`${this.config.apiBaseUrl}/states`).pipe(
      map((response) =>
        response.data.states.map((state) => ({
          id: state.id,
          name: state.name,
        })),
      ),
    );
  }

  override getMunicipios(estadoId: string): Observable<readonly Municipio[]> {
    return this.http
      .get<ApiMunicipalitiesResponseDto>(`${this.config.apiBaseUrl}/states/${estadoId}/municipalities`)
      .pipe(
        map((response) =>
          response.data.municipalities.map((municipality) => ({
            id: municipality.id,
            name: municipality.name,
          })),
        ),
      );
  }

  override getParroquias(municipioId: string): Observable<readonly Parroquia[]> {
    return this.http
      .get<ApiParishesResponseDto>(
        `${this.config.apiBaseUrl}/municipalities/${municipioId}/parishes`,
      )
      .pipe(
        map((response) =>
          response.data.parishes.map((parish) => ({
            id: parish.id,
            name: parish.name,
          })),
        ),
      );
  }

  override search(query: PatientSearchQuery): Observable<PatientSearchResult> {
    let params = new HttpParams();

    const trimmedQuery = query.query.trim();
    if (trimmedQuery) {
      params = params.set('q', trimmedQuery);
    }
    if (query.sex) {
      params = params.set('sex', query.sex);
    }
    if (query.estadoId) {
      params = params.set('estado_id', query.estadoId);
    }
    if (query.municipioId) {
      params = params.set('municipio_id', query.municipioId);
    }
    if (query.parroquiaId) {
      params = params.set('parroquia_id', query.parroquiaId);
    }

    return this.http
      .get<ApiPersonSearchResponseDto>(`${this.config.apiBaseUrl}/persons/search`, { params })
      .pipe(map((response) => mapPersonSearchResponse(response, query)));
  }
}

function mapPersonSearchResponse(
  response: ApiPersonSearchResponseDto,
  query: PatientSearchQuery,
): PatientSearchResult {
  const persons = response.data.persons ?? [];
  const pagination = response.pagination ?? {};
  const pageSize = pagination.pageSize ?? pagination.page_size ?? query.pageSize;
  const page = pagination.page ?? query.page;
  const total = pagination.total ?? persons.length;
  const hasMore =
    pagination.hasMore ??
    pagination.has_more ??
    (pagination.total !== undefined ? page * pageSize < total : false);
  const updatedAt =
    pagination.datasetUpdatedAt ??
    pagination.dataset_updated_at ??
    pagination.updatedAt ??
    pagination.updated_at ??
    new Date().toISOString();

  return {
    items: persons.map(mapPersonDto),
    total,
    page,
    pageSize,
    hasMore,
    updatedAt,
  };
}

function mapPersonDto(person: ApiPersonDto): PatientRecord {
  const hospitalName =
    person.hospital?.name ?? person.hospitalName ?? person.hospital_name ?? 'Sin hospital';

  return {
    id: person.id,
    sourceRow: 0,
    fullName: person.fullName ?? person.full_name ?? person.name ?? 'Sin nombre',
    age: person.age == null ? null : String(person.age),
    identityDocument:
      person.identityDocument ?? person.identity_document ?? person.cedula ?? null,
    phone: person.phone ?? null,
    address: person.address ?? null,
    observations: person.observations ?? null,
    hospitalId: person.hospital?.id ?? 'unknown',
    hospitalName,
    sourceHospitalName: hospitalName,
  };
}
