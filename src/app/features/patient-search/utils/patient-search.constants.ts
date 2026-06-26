export const MIN_NAME_QUERY_LENGTH = 2;
export const MIN_DOCUMENT_QUERY_LENGTH = 4;
export const PATIENT_SEARCH_PAGE_SIZE = 30;
export const PATIENT_SEARCH_DEBOUNCE_MS = 500;
export const SLOW_SEARCH_THRESHOLD_MS = 3000;

export const HOSPITAL_ALIASES: Readonly<Record<string, string>> = {
  'Hospital Universitario de Carac': 'Hospital Universitario de Caracas',
};
