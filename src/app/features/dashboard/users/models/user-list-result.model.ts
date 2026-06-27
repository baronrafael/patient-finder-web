import { AdminUserListRow } from './admin-user-list-item.model';

export interface UserListResult {
  readonly items: readonly AdminUserListRow[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
