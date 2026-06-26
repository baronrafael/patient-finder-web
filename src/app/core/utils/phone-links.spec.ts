import { describe, expect, it } from 'vitest';

import { buildWhatsAppHref } from './phone-links';

describe('buildWhatsAppHref', () => {
  it('builds a WhatsApp link for Venezuelan mobile numbers', () => {
    expect(buildWhatsAppHref('0414-1234567')).toBe('https://wa.me/584141234567');
  });

  it('returns null for unsupported numbers', () => {
    expect(buildWhatsAppHref('0212-5551234')).toBeNull();
  });
});
