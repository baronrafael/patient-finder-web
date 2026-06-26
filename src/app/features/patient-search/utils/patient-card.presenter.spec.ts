import { describe, expect, it } from 'vitest';

import { getPatientInitials } from './patient-card.presenter';

describe('patient-card.presenter', () => {
  it('builds initials from first and last name tokens', () => {
    expect(getPatientInitials('GARCÍA MARÍA')).toBe('GM');
    expect(getPatientInitials('Pedro')).toBe('PE');
  });
});
