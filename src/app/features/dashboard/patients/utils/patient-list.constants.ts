export const ADMIN_PERSON_PAGE_SIZE = 20;

export const PERSON_SEX_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'm', label: 'Masculino' },
  { value: 'f', label: 'Femenino' },
] as const;

export const PERSON_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'hospitalized', label: 'Hospitalizado' },
] as const;
