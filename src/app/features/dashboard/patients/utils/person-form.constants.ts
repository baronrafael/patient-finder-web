export const MIN_PERSON_CEDULA_DIGITS = 6;

export const MIN_PERSON_AGE = 0;
export const MAX_PERSON_AGE = 120;

export const PERSON_STATUS_FORM_OPTIONS = [
  { value: 'hospitalized', label: 'Hospitalizado' },
  { value: 'discharged', label: 'Dado de alta' },
  { value: 'deceased', label: 'Fallecido' },
  { value: 'transferred', label: 'Transferido' },
] as const;

export const PERSON_SEX_FORM_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  { value: 'm', label: 'Masculino' },
  { value: 'f', label: 'Femenino' },
] as const;
