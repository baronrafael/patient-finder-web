import { describe, expect, it } from 'vitest';

import { formatResultProgress } from './format-result-progress';

describe('formatResultProgress', () => {
  it('describes partial pagination', () => {
    expect(formatResultProgress(20, 145)).toBe('Mostrando 20 de 145 coincidencias');
  });

  it('describes the full result set when everything is visible', () => {
    expect(formatResultProgress(3, 3)).toBe('Mostrando 3 coincidencias');
  });
});
