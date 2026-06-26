import { normalizeDocument } from '../../../core/utils/normalize-document';
import { normalizeSearchText } from '../../../core/utils/normalize-search-text';
import { PatientRecord } from '../models/patient-record.model';
import { MIN_DOCUMENT_QUERY_LENGTH, MIN_NAME_QUERY_LENGTH } from './patient-search.constants';

export interface PatientSearchMatch {
  readonly patient: PatientRecord;
  readonly rank: number;
}

export function isDocumentOnlyQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!/\d/.test(trimmed)) {
    return false;
  }

  const withoutDigits = trimmed.replace(/\d/g, '');
  return /^[\s.\-_/vejpgp]*$/i.test(withoutDigits);
}

/** Normaliza cédulas formateadas (4.567.890) antes de enviarlas al API. */
export function formatSearchQueryForApi(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (isDocumentOnlyQuery(trimmed)) {
    return normalizeDocument(trimmed);
  }

  return trimmed
    .split(/\s+/)
    .map((token) => (isDocumentOnlyQuery(token) ? normalizeDocument(token) : token))
    .join(' ');
}

export function isSearchActive(query: string): boolean {
  const trimmed = query.trim();
  if (isDocumentOnlyQuery(trimmed)) {
    return normalizeDocument(trimmed).length >= MIN_DOCUMENT_QUERY_LENGTH;
  }

  return normalizeSearchText(trimmed).length >= MIN_NAME_QUERY_LENGTH;
}

export function matchPatient(patient: PatientRecord, query: string): PatientSearchMatch | null {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedDocumentQuery = normalizeDocument(query);
  const normalizedPatientName = normalizeSearchText(patient.fullName);
  const normalizedPatientDocument = patient.identityDocument
    ? normalizeDocument(patient.identityDocument)
    : '';

  if (
    normalizedDocumentQuery.length >= MIN_DOCUMENT_QUERY_LENGTH &&
    normalizedPatientDocument === normalizedDocumentQuery
  ) {
    return { patient, rank: 0 };
  }

  if (!normalizedQuery) {
    return null;
  }

  if (normalizedPatientName === normalizedQuery) {
    return { patient, rank: 1 };
  }

  if (normalizedPatientName.startsWith(normalizedQuery)) {
    return { patient, rank: 2 };
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length > 0 && tokens.every((token) => normalizedPatientName.includes(token))) {
    return { patient, rank: 3 };
  }

  if (tokens.length === 1 && normalizedPatientName.includes(tokens[0])) {
    return { patient, rank: 4 };
  }

  return null;
}

export function isExactDocumentMatch(patient: PatientRecord, query: string): boolean {
  if (!patient.identityDocument) {
    return false;
  }

  const documentQuery = normalizeDocument(query);
  if (documentQuery.length < MIN_DOCUMENT_QUERY_LENGTH) {
    return false;
  }

  return normalizeDocument(patient.identityDocument) === documentQuery;
}
