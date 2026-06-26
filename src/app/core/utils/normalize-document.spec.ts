import { normalizeDocument } from './normalize-document';

describe('normalizeDocument', () => {
  it('keeps only digits', () => {
    expect(normalizeDocument('28.443.736-V')).toBe('28443736');
  });
});
