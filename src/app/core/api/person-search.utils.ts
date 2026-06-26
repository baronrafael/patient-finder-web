import { normalizeDocument } from '../utils/normalize-document';

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
