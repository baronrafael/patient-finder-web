import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ApiCentersResponseDto,
  ApiMunicipalitiesResponseDto,
  ApiParishesResponseDto,
  ApiPersonListResponseDto,
  ApiStatesResponseDto,
} from '../../../core/api/person-api.dto';
import {
  formatFullName,
  formatPersonAge,
  formatPersonContacts,
  formatPersonObservations,
  formatRescueLocation,
  parseApiPagination,
} from '../../../core/api/person-api.mapper';
import { buildPersonQueryHttpParams } from '../../../core/api/person-query.params';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Hospital } from '../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../models/location.model';
import { PatientRecord } from '../models/patient-record.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSearchResult } from '../models/patient-search-result.model';
import { CENTERS_PAGE_SIZE } from '../utils/patient-search.constants';
import { PatientRepository } from './patient.repository';
import { ApiPersonDto } from '../../../core/api/person-api.dto';

@Injectable({ providedIn: 'root' })
export class ApiPatientRepository extends PatientRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  override getHospitals(): Observable<readonly Hospital[]> {
    const params = new HttpParams().set('page_size', CENTERS_PAGE_SIZE);

    return this.http.get<ApiCentersResponseDto>(`${this.config.apiBaseUrl}/centers`, { params }).pipe(
      map((response) =>
        (response.data.centers ?? [])
          .filter((center) => center.is_active !== false)
          .map((center) => ({
            id: center.id,
            name: center.name,
            sourceNames: [center.name],
            recordCount: 0,
            estadoId: center.estado_id ?? null,
            municipioId: center.municipio_id ?? null,
            parroquiaId: center.parroquia_id ?? null,
          })),
      ),
    );
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
    const params = buildPersonQueryHttpParams({
      query: query.query,
      page: query.page,
      pageSize: query.pageSize,
      sex: query.sex,
      centerId: query.hospitalId,
      estadoId: query.estadoId,
      municipioId: query.municipioId,
      parroquiaId: query.parroquiaId,
    });

    return this.http
      .get<ApiPersonListResponseDto>(`${this.config.apiBaseUrl}/persons/search`, { params })
      .pipe(map((response) => mapPersonSearchResponse(response, query)));
  }
}

function mapPersonSearchResponse(
  response: ApiPersonListResponseDto,
  query: PatientSearchQuery,
): PatientSearchResult {
  const persons = response.data.persons ?? [];
  const pagination = response.pagination;
  const { page, pageSize, total } = parseApiPagination(
    pagination,
    query.page,
    query.pageSize,
    persons.length,
  );
  const hasMore =
    pagination?.last_page !== undefined ? page < pagination.last_page : page * pageSize < total;
  const updatedAt =
    persons.find((person) => person.created_at)?.created_at ?? new Date().toISOString();

  return {
    items: persons.map(mapPatientRecord),
    total,
    page,
    pageSize,
    hasMore,
    updatedAt,
  };
}

function mapPatientRecord(person: ApiPersonDto): PatientRecord {
  const centerName = person.center?.name ?? 'Sin centro de atención';

  return {
    id: person.id,
    sourceRow: 0,
    fullName: formatFullName(person),
    age: formatPersonAge(person.age_approx),
    identityDocument: person.cedula?.trim() || null,
    phone: formatPersonContacts(person.contacts),
    address: formatRescueLocation(person),
    observations: formatPersonObservations(person),
    hospitalId: person.center?.id ?? 'unknown',
    hospitalName: centerName,
    sourceHospitalName: centerName,
    score: person.score ?? null,
    matchConfidence: null,
  };
}
