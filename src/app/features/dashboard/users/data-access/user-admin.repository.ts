import { Observable } from 'rxjs';

import { AdminUserRecord, AdminUserWriteValue } from '../models/admin-user-record.model';
import { UserRoleOption } from '../models/user-form.model';
import { UserListQuery } from '../models/user-list-query.model';
import { UserListResult } from '../models/user-list-result.model';

export abstract class UserAdminRepository {
  abstract list(query: UserListQuery): Observable<UserListResult>;

  abstract listRoles(): Observable<readonly UserRoleOption[]>;

  abstract getById(id: string): Observable<AdminUserRecord>;

  abstract create(value: AdminUserWriteValue): Observable<AdminUserRecord>;

  abstract update(id: string, value: AdminUserWriteValue): Observable<AdminUserRecord>;

  abstract delete(id: string): Observable<void>;
}
