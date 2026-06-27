import { describe, expect, it } from 'vitest';

import { DashboardAccess, resolveDefaultDashboardPath } from './dashboard-navigation.utils';

function createAccess(overrides: Partial<DashboardAccess>): DashboardAccess {
  return {
    canAccessPatients: () => overrides.canAccessPatients?.() ?? false,
    canAccessUsers: () => overrides.canAccessUsers?.() ?? false,
  };
}

describe('resolveDefaultDashboardPath', () => {
  it('prefers patients when available', () => {
    const path = resolveDefaultDashboardPath(
      createAccess({
        canAccessPatients: () => true,
        canAccessUsers: () => true,
      }),
    );

    expect(path).toBe('/admin/pacientes');
  });

  it('falls back to users when patients are unavailable', () => {
    const path = resolveDefaultDashboardPath(
      createAccess({
        canAccessPatients: () => false,
        canAccessUsers: () => true,
      }),
    );

    expect(path).toBe('/admin/usuarios');
  });

  it('falls back to profile when no dashboard sections are available', () => {
    const path = resolveDefaultDashboardPath(
      createAccess({
        canAccessPatients: () => false,
        canAccessUsers: () => false,
      }),
    );

    expect(path).toBe('/admin/perfil');
  });
});
