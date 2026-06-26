import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Hospital } from '../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../models/location.model';
import { PatientRecord } from '../models/patient-record.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSearchResult } from '../models/patient-search-result.model';
import { formatSearchQueryForApi } from '../utils/patient-search.matcher';
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

interface ApiCenterDto {
  readonly id: string;
  readonly name: string;
  readonly type?: string;
  readonly contacts?: unknown;
}

interface ApiPersonDto {
  readonly id: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly cedula?: string | null;
  readonly sex?: string | null;
  readonly age_approx?: number | null;
  readonly status?: string | null;
  readonly admitted_at?: string | null;
  readonly rescue_estado?: string | null;
  readonly rescue_municipio?: string | null;
  readonly rescue_parroquia?: string | null;
  readonly center?: ApiCenterDto | null;
  readonly notes?: string | null;
  readonly contacts?: unknown;
  readonly created_at?: string | null;
}

interface ApiPaginationDto {
  readonly current_page?: number;
  readonly page_size?: number;
  readonly first_page?: number;
  readonly last_page?: number;
  readonly total_records?: number;
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
      params = params.set('q', formatSearchQueryForApi(trimmedQuery));
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
    if (query.page > 1) {
      params = params.set('page', query.page);
    }
    params = params.set('page_size', query.pageSize);

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
  const page = pagination.current_page ?? query.page;
  const pageSize = pagination.page_size ?? query.pageSize;
  const total = pagination.total_records ?? persons.length;
  const hasMore =
    pagination.last_page !== undefined ? page < pagination.last_page : page * pageSize < total;
  const updatedAt =
    persons.find((person) => person.created_at)?.created_at ?? new Date().toISOString();

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
  const fullName = formatFullName(person);
  const centerName = person.center?.name ?? 'Sin centro de atención';

  return {
    id: person.id,
    sourceRow: 0,
    fullName,
    age: person.age_approx == null ? null : String(person.age_approx),
    identityDocument: person.cedula?.trim() || null,
    phone: formatContacts(person.contacts),
    address: formatRescueLocation(person),
    observations: formatObservations(person),
    hospitalId: person.center?.id ?? 'unknown',
    hospitalName: centerName,
    sourceHospitalName: centerName,
  };
}

function formatFullName(person: ApiPersonDto): string {
  const fullName = [person.first_name, person.last_name]
    .filter((part) => part?.trim())
    .join(' ')
    .trim();

  return fullName || 'Sin nombre';
}

function formatRescueLocation(person: ApiPersonDto): string | null {
  const parts = [person.rescue_parroquia, person.rescue_municipio, person.rescue_estado]
    .filter((part) => part?.trim())
    .map((part) => part!.trim());

  return parts.length > 0 ? parts.join(', ') : null;
}

function formatObservations(person: ApiPersonDto): string | null {
  const notes = person.notes?.trim();
  if (notes) {
    return notes;
  }

  if (person.status?.trim()) {
    return `Estado: ${formatStatus(person.status)}`;
  }

  return null;
}

function formatStatus(status: string): string {
  switch (status) {
    case 'hospitalized':
      return 'Hospitalizado';
    default:
      return status.replaceAll('_', ' ');
  }
}

function formatContacts(contacts: unknown): string | null {
  if (contacts == null) {
    return null;
  }

  if (typeof contacts === 'string') {
    return contacts.trim() || null;
  }

  if (Array.isArray(contacts)) {
    const values = contacts
      .map((value) => (typeof value === 'string' ? value.trim() : String(value)))
      .filter(Boolean);
    return values.length > 0 ? values.join(' · ') : null;
  }

  if (typeof contacts === 'object') {
    const record = contacts as Record<string, unknown>;
    const values = ['phone', 'telefono', 'whatsapp', 'email']
      .map((key) => record[key])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());
    return values.length > 0 ? values.join(' · ') : null;
  }

  return null;
}
