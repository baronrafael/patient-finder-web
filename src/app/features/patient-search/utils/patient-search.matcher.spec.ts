import { describe, expect, it } from 'vitest';

import {
  formatSearchQueryForApi,
  isDocumentOnlyQuery,
  isSearchActive,
} from './patient-search.matcher';

describe('formatSearchQueryForApi', () => {
  it('strips formatting from document-only queries', () => {
    expect(formatSearchQueryForApi('4.567.890')).toBe('4567890');
    expect(formatSearchQueryForApi('28.443.736-V')).toBe('28443736');
    expect(formatSearchQueryForApi('  11222333  ')).toBe('11222333');
  });

  it('keeps name queries unchanged', () => {
    expect(formatSearchQueryForApi('Garcia')).toBe('Garcia');
    expect(formatSearchQueryForApi('Maria Perez')).toBe('Maria Perez');
  });

  it('cleans formatted cedulas in mixed name and document queries', () => {
    expect(formatSearchQueryForApi('Garcia 4.567.890')).toBe('Garcia 4567890');
    expect(formatSearchQueryForApi('Maria Perez 28.443.736-V')).toBe('Maria Perez 28443736');
  });
});

describe('isDocumentOnlyQuery', () => {
  it('detects formatted cedulas', () => {
    expect(isDocumentOnlyQuery('4.567.890')).toBe(true);
    expect(isDocumentOnlyQuery('V-28443736')).toBe(true);
  });

  it('rejects name queries', () => {
    expect(isDocumentOnlyQuery('Rafael')).toBe(false);
    expect(isDocumentOnlyQuery('Garcia 4567890')).toBe(false);
  });
});

describe('isSearchActive', () => {
  it('accepts formatted cedulas with enough digits', () => {
    expect(isSearchActive('4.567.890')).toBe(true);
  });
});
