import { describe, expect, it } from 'vitest';

import { formatUserInteger } from './format-user-integer.util';

describe('formatUserInteger', () => {
  it('formats numbers using the runtime locale', () => {
    const formatted = formatUserInteger(3133);

    expect(formatted).toBeTruthy();
    expect(formatted.replace(/\D/g, '')).toBe('3133');
  });
});
