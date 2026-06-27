import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import {
  ApiUserListResponseDto,
  ApiUserResponseDto,
} from '../../../../core/api/user-api.dto';
import {
  RolesCatalogResponseDto,
  UserRolesResponseDto,
} from '../../../../core/auth/models/auth-api.dto';
import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { AdminUserRecord, AdminUserWriteValue } from '../models/admin-user-record.model';
import { UserRoleOption } from '../models/user-form.model';
import { UserListQuery } from '../models/user-list-query.model';
import { UserListResult } from '../models/user-list-result.model';
import {
  mapAdminUserRecord,
  mapAdminUserToWriteDto,
  mapUserListResult,
} from './admin-user.mapper';
import { UserAdminRepository } from './user-admin.repository';

@Injectable({ providedIn: 'root' })
export class ApiUserAdminRepository extends UserAdminRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  override list(query: UserListQuery): Observable<UserListResult> {
    const params = buildUserListHttpParams(query);

    return this.http
      .get<ApiUserListResponseDto>(`${this.config.apiBaseUrl}/users`, { params })
      .pipe(map((response) => mapUserListResult(response, query.page, query.pageSize)));
  }

  override listRoles(): Observable<readonly UserRoleOption[]> {
    return this.http.get<RolesCatalogResponseDto>(`${this.config.apiBaseUrl}/roles`).pipe(
      map((response) =>
        (response.data.roles ?? []).map(
          (role): UserRoleOption => ({
            id: role.id,
            name: role.name,
            displayName: role.display_name?.trim() || role.name,
            isGlobal: role.is_global,
          }),
        ),
      ),
    );
  }

  override getById(id: string): Observable<AdminUserRecord> {
    return forkJoin({
      user: this.http.get<ApiUserResponseDto>(`${this.config.apiBaseUrl}/users/${id}`),
      roles: this.http.get<UserRolesResponseDto>(`${this.config.apiBaseUrl}/users/${id}/roles`),
    }).pipe(
      map(({ user, roles }) => mapAdminUserRecord(user.data.user, roles)),
    );
  }

  override create(value: AdminUserWriteValue): Observable<AdminUserRecord> {
    const body = mapAdminUserToWriteDto(value);

    return this.http
      .post<ApiUserResponseDto>(`${this.config.apiBaseUrl}/users`, body)
      .pipe(map((response) => mapAdminUserRecord(response.data.user)));
  }

  override update(id: string, value: AdminUserWriteValue): Observable<AdminUserRecord> {
    const body = mapAdminUserToWriteDto(value);

    return this.http
      .patch<ApiUserResponseDto>(`${this.config.apiBaseUrl}/users/${id}`, body)
      .pipe(map((response) => mapAdminUserRecord(response.data.user)));
  }

  override delete(id: string): Observable<void> {
    return this.http
      .delete(`${this.config.apiBaseUrl}/users/${id}`)
      .pipe(map(() => undefined));
  }
}

function buildUserListHttpParams(query: UserListQuery): HttpParams {
  let params = new HttpParams().set('page_size', query.pageSize);

  if (query.page > 1) {
    params = params.set('page', query.page);
  }

  return params;
}
