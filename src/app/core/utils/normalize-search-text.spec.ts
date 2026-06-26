import { normalizeSearchText } from './normalize-search-text';

describe('normalizeSearchText', () => {
  it('removes accents and lowercases text', () => {
    expect(normalizeSearchText('GARCÍA JOSÉ')).toBe('garcia jose');
  });

  it('normalizes repeated spaces', () => {
    expect(normalizeSearchText('  maria   diaz  ')).toBe('maria diaz');
  });

  it('ignores common punctuation', () => {
    expect(normalizeSearchText('RAMOS/SILVA, MARYELIS')).toBe('ramos silva maryelis');
  });
});
