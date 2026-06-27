import { describe, expect, it } from 'vitest';

import { formatUserDateTime } from './format-user-datetime.util';

describe('formatUserDateTime', () => {
  it('formats a UTC ISO timestamp using the runtime locale', () => {
    const formatted = formatUserDateTime('2026-06-27T16:01:45.895855Z');

    expect(formatted).toBeTruthy();
    expect(formatted).toMatch(/2026/);
  });

  it('formats an ISO timestamp with a numeric offset', () => {
    const formatted = formatUserDateTime('2026-06-27T11:23:23.716419-04:00');

    expect(formatted).toBeTruthy();
    expect(formatted).toMatch(/2026/);
    expect(new Date('2026-06-27T11:23:23.716419-04:00').getTime()).toBe(
      new Date('2026-06-27T15:23:23.716419Z').getTime(),
    );
  });

  it('returns null for invalid timestamps', () => {
    expect(formatUserDateTime('not-a-date')).toBeNull();
  });
});
