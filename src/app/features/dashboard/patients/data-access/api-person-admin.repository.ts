import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import {
  ApiPersonListResponseDto,
  ApiPersonResponseDto,
} from '../../../../core/api/person-api.dto';
import { buildPersonQueryHttpParams } from '../../../../core/api/person-query.params';
import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { PATIENT_REPOSITORY } from '../../../patient-search/data-access/patient-repository.token';
import { PersonAdminRecord } from '../models/person-admin-record.model';
import { PersonFormValue } from '../models/person-form.model';
import { PersonListQuery } from '../models/person-list-query.model';
import { PersonListResult } from '../models/person-list-result.model';
import { mapPersonListResult } from './admin-person.mapper';
import { mapPersonFormToWriteDto } from './person-admin-write.mapper';
import { PersonAdminRepository } from './person-admin.repository';
import { resolvePersonFormValue } from './person-form-resolver';

@Injectable({ providedIn: 'root' })
export class ApiPersonAdminRepository extends PersonAdminRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly catalog = inject(PATIENT_REPOSITORY);

  override list(query: PersonListQuery): Observable<PersonListResult> {
    const params = buildPersonQueryHttpParams({
      query: query.query,
      page: query.page,
      pageSize: query.pageSize,
      sex: query.sex,
      centerId: query.centerId,
      status: query.status,
    });

    return this.http
      .get<ApiPersonListResponseDto>(`${this.config.apiBaseUrl}/persons`, { params })
      .pipe(map((response) => mapPersonListResult(response, query.page, query.pageSize)));
  }

  override getById(id: string): Observable<PersonAdminRecord> {
    return this.http
      .get<ApiPersonResponseDto>(`${this.config.apiBaseUrl}/persons/${id}`)
      .pipe(
        switchMap((response) =>
          resolvePersonFormValue(response.data.person, this.catalog).pipe(
            map((formValue) => ({
              id: response.data.person.id,
              formValue,
            })),
          ),
        ),
      );
  }

  override create(value: PersonFormValue): Observable<PersonAdminRecord> {
    const body = mapPersonFormToWriteDto(value);

    return this.http
      .post<ApiPersonResponseDto>(`${this.config.apiBaseUrl}/persons`, body)
      .pipe(
        map((response) => ({
          id: response.data.person.id,
          formValue: value,
        })),
      );
  }

  override update(id: string, value: PersonFormValue): Observable<PersonAdminRecord> {
    const body = mapPersonFormToWriteDto(value);

    return this.http
      .patch<ApiPersonResponseDto>(`${this.config.apiBaseUrl}/persons/${id}`, body)
      .pipe(
        map((response) => ({
          id: response.data.person.id,
          formValue: value,
        })),
      );
  }
}
