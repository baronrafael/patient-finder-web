import { describe, expect, it } from 'vitest';

import { highlightSearchText } from './highlight-search-text';

describe('highlightSearchText', () => {
  it('highlights matching name tokens without accents', () => {
    const segments = highlightSearchText('GARCÍA MARÍA', 'garcia');

    expect(segments.some((segment) => segment.highlight && segment.text.includes('GARC'))).toBe(true);
  });

  it('highlights document digits in formatted cedula', () => {
    const segments = highlightSearchText('V-28.443.736', '28443736');

    expect(segments.filter((segment) => segment.highlight).map((segment) => segment.text).join('')).toContain('28');
  });

  it('returns plain text when query is empty', () => {
    expect(highlightSearchText('GARCÍA MARÍA', '')).toEqual([{ text: 'GARCÍA MARÍA', highlight: false }]);
  });

  it('preserves original text length when joining segments', () => {
    const text = 'GARCÍA MARÍA';
    const segments = highlightSearchText(text, 'garcia maria');

    expect(segments.map((segment) => segment.text).join('')).toBe(text);
  });

  it('preserves formatted cedula when joining segments', () => {
    const text = 'V-28.443.736';
    const segments = highlightSearchText(text, '28443736');

    expect(segments.map((segment) => segment.text).join('')).toBe(text);
  });
});
