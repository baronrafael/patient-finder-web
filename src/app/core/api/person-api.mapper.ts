import { ApiPaginationDto, ApiPersonDto } from './person-api.dto';

export interface ParsedApiPagination {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export function parseApiPagination(
  pagination: ApiPaginationDto | undefined,
  fallbackPage: number,
  fallbackPageSize: number,
  itemCount = 0,
): ParsedApiPagination {
  const p = pagination ?? {};
  const page = p.current_page ?? fallbackPage;
  const pageSize = p.page_size ?? fallbackPageSize;
  const total = p.total_records ?? itemCount;
  const totalPages = p.last_page ?? Math.max(1, Math.ceil(total / pageSize));

  return { page, pageSize, total, totalPages };
}

export function formatPersonAge(ageApprox: number | null | undefined): string | null {
  return ageApprox == null ? null : String(ageApprox);
}

export function formatFullName(person: ApiPersonDto): string {
  const fullName = [person.first_name, person.last_name]
    .filter((part) => part?.trim())
    .join(' ')
    .trim();

  return fullName || 'Sin nombre';
}

export function formatPersonStatus(status: string): string {
  switch (status) {
    case 'hospitalized':
      return 'Hospitalizado';
    default:
      return status.replaceAll('_', ' ');
  }
}

export function formatSexLabel(sex: string | null | undefined): string | null {
  switch (sex?.toLowerCase()) {
    case 'm':
      return 'Masculino';
    case 'f':
      return 'Femenino';
    default:
      return sex?.trim() || null;
  }
}

export function formatAdmittedAtLabel(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatRescueLocation(person: ApiPersonDto): string | null {
  const parts = [person.rescue_parroquia, person.rescue_municipio, person.rescue_estado]
    .filter((part) => part?.trim())
    .map((part) => part!.trim());

  return parts.length > 0 ? parts.join(', ') : null;
}

export function formatPersonObservations(person: ApiPersonDto): string | null {
  const notes = person.notes?.trim();
  if (notes) {
    return notes;
  }

  if (person.status?.trim()) {
    return `Estado: ${formatPersonStatus(person.status)}`;
  }

  return null;
}

export function formatPersonContacts(contacts: unknown): string | null {
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
