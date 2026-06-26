import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiPersonListResponseDto } from '../../../../core/api/person-api.dto';
import { buildPersonQueryHttpParams } from '../../../../core/api/person-query.params';
import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { PersonListQuery } from '../models/person-list-query.model';
import { PersonListResult } from '../models/person-list-result.model';
import { mapPersonListResult } from './admin-person.mapper';
import { PersonAdminRepository } from './person-admin.repository';

@Injectable({ providedIn: 'root' })
export class ApiPersonAdminRepository extends PersonAdminRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

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
}
