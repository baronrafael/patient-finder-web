import { ApiPersonDto, ApiPersonListResponseDto } from '../../../../core/api/person-api.dto';
import {
  formatAdmittedAtLabel,
  formatFullName,
  formatPersonAge,
  formatPersonStatus,
  formatSexLabel,
  parseApiPagination,
} from '../../../../core/api/person-api.mapper';
import { AdminPersonListRow } from '../models/admin-person-list-item.model';
import { PersonListResult } from '../models/person-list-result.model';

export function mapPersonListResult(
  response: ApiPersonListResponseDto,
  fallbackPage: number,
  fallbackPageSize: number,
): PersonListResult {
  const persons = response.data.persons ?? [];
  const { page, pageSize, total, totalPages } = parseApiPagination(
    response.pagination,
    fallbackPage,
    fallbackPageSize,
    persons.length,
  );

  return {
    items: persons.map(mapAdminPersonListItem),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function mapAdminPersonListItem(person: ApiPersonDto): AdminPersonListRow {
  const status = person.status?.trim() || null;

  return {
    id: person.id,
    fullName: formatFullName(person),
    identityDocument: person.cedula?.trim() || null,
    sex: formatSexLabel(person.sex),
    age: formatPersonAge(person.age_approx),
    status,
    statusLabel: status ? formatPersonStatus(status) : '—',
    centerId: person.center?.id ?? 'unknown',
    centerName: person.center?.name ?? 'Sin centro',
    admittedAt: person.admitted_at ?? null,
    admittedAtLabel: formatAdmittedAtLabel(person.admitted_at),
  };
}
