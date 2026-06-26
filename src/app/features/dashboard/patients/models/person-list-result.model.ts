import { AdminPersonListRow } from './admin-person-list-item.model';

export interface PersonListResult {
  readonly items: readonly AdminPersonListRow[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
