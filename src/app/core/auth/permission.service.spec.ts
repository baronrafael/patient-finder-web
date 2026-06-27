import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';
import { AuthSession } from './models/auth-session.model';

function createSession(
  overrides: Partial<Pick<AuthSession, 'globalPermissions' | 'centerPermissions'>> = {},
): AuthSession {
  return {
    accessToken: 'token',
    refreshToken: 'refresh',
    expiresAt: Date.now() + 60_000,
    user: { id: 'user-1', email: 'user@example.com', name: 'User' },
    globalPermissions: overrides.globalPermissions ?? [],
    centerPermissions: overrides.centerPermissions ?? {},
  };
}

describe('PermissionService', () => {
  const session = signal<AuthSession | null>(null);

  beforeEach(() => {
    session.set(null);
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        {
          provide: AuthService,
          useValue: {
            session: session.asReadonly(),
          },
        },
      ],
    });
  });

  it('grants global permissions without a center id', () => {
    session.set(
      createSession({
        globalPermissions: ['patients:read', 'users:read'],
      }),
    );
    const permissions = TestBed.inject(PermissionService);

    expect(permissions.can('patients:read')).toBe(true);
    expect(permissions.can('patients:create')).toBe(false);
    expect(permissions.canAccessPatients()).toBe(true);
  });

  it('grants center permissions only for the assigned center', () => {
    session.set(
      createSession({
        centerPermissions: {
          'center-1': ['patients:read', 'patients:create'],
        },
      }),
    );
    const permissions = TestBed.inject(PermissionService);

    expect(permissions.can('patients:read', 'center-1')).toBe(true);
    expect(permissions.can('patients:create', 'center-1')).toBe(true);
    expect(permissions.can('patients:update', 'center-1')).toBe(false);
    expect(permissions.can('patients:read', 'center-2')).toBe(false);
    expect(permissions.availableCenterIds()).toEqual(['center-1']);
  });

  it('auto-selects the only available center', () => {
    session.set(
      createSession({
        centerPermissions: {
          'center-1': ['patients:read'],
        },
      }),
    );
    const permissions = TestBed.inject(PermissionService);
    TestBed.flushEffects();

    expect(permissions.activeCenterId()).toBe('center-1');
  });

  it('allows registrador access with read-only patient permissions', () => {
    session.set(
      createSession({
        centerPermissions: {
          'center-1': ['patients:read', 'patients:create'],
        },
      }),
    );
    const permissions = TestBed.inject(PermissionService);

    expect(permissions.canAccessPatients()).toBe(true);
    expect(permissions.can('patients:update', 'center-1')).toBe(false);
  });
});
