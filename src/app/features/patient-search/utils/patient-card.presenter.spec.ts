import { describe, expect, it } from 'vitest';

import { getHospitalAvatarColors, getPatientInitials } from './patient-card.presenter';

describe('patient-card.presenter', () => {
  it('builds initials from first and last name tokens', () => {
    expect(getPatientInitials('GARCÍA MARÍA')).toBe('GM');
    expect(getPatientInitials('Pedro')).toBe('PE');
  });

  it('returns stable avatar colors for a hospital id', () => {
    const first = getHospitalAvatarColors('hospital-a');
    const second = getHospitalAvatarColors('hospital-a');

    expect(first).toEqual(second);
    expect(first.background).toBeTruthy();
    expect(first.color).toBeTruthy();
  });
});
