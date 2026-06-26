import { describe, expect, it } from 'vitest';

import { hasPatientFieldValue } from './patient-field-display';

describe('patient-field-display', () => {
  it('treats blank values as empty', () => {
    expect(hasPatientFieldValue(null)).toBe(false);
    expect(hasPatientFieldValue('')).toBe(false);
    expect(hasPatientFieldValue('   ')).toBe(false);
    expect(hasPatientFieldValue('34')).toBe(true);
  });
});
