import { describe, expect, it } from 'vitest';

import { buildAuthSession, resolvePermissionsFromRoles } from './auth.mapper';
import { RoleCatalogItemDto, UserRoleDto } from './models/auth-api.dto';

const roleCatalog: readonly RoleCatalogItemDto[] = [
  {
    id: 'role-admin',
    name: 'admin',
    display_name: 'Administrador',
    is_global: true,
    permissions: [
      'patients:read',
      'patients:create',
      'patients:update',
      'patients:delete',
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
    ],
  },
  {
    id: 'role-digitador',
    name: 'digitador',
    display_name: 'Digitador',
    is_global: false,
    permissions: ['patients:read', 'patients:create', 'patients:update'],
  },
  {
    id: 'role-registrador',
    name: 'registrador',
    display_name: 'Registrador',
    is_global: false,
    permissions: ['patients:read', 'patients:create'],
  },
];

describe('resolvePermissionsFromRoles', () => {
  it('assigns global permissions for global roles', () => {
    const userRoles: UserRoleDto[] = [
      {
        user_id: 'user-1',
        role_id: 'role-admin',
        role_name: 'admin',
        is_global: true,
        center_id: null,
      },
    ];

    const result = resolvePermissionsFromRoles(userRoles, roleCatalog);

    expect(result.globalPermissions).toContain('patients:read');
    expect(result.globalPermissions).toContain('users:delete');
    expect(result.centerPermissions).toEqual({});
  });

  it('assigns center-scoped permissions for center roles', () => {
    const userRoles: UserRoleDto[] = [
      {
        user_id: 'user-1',
        role_id: 'role-digitador',
        role_name: 'digitador',
        is_global: false,
        center_id: 'center-1',
      },
    ];

    const result = resolvePermissionsFromRoles(userRoles, roleCatalog);

    expect(result.globalPermissions).toEqual([]);
    expect(result.centerPermissions['center-1']).toEqual([
      'patients:read',
      'patients:create',
      'patients:update',
    ]);
  });

  it('merges permissions when multiple roles share the same center', () => {
    const userRoles: UserRoleDto[] = [
      {
        user_id: 'user-1',
        role_id: 'role-registrador',
        role_name: 'registrador',
        is_global: false,
        center_id: 'center-1',
      },
      {
        user_id: 'user-1',
        role_id: 'role-digitador',
        role_name: 'digitador',
        is_global: false,
        center_id: 'center-1',
      },
    ];

    const result = resolvePermissionsFromRoles(userRoles, roleCatalog);

    expect(result.centerPermissions['center-1']).toEqual([
      'patients:read',
      'patients:create',
      'patients:update',
    ]);
  });

  it('ignores unknown permissions from the role catalog', () => {
    const catalogWithExtra: RoleCatalogItemDto[] = [
      {
        id: 'role-custom',
        name: 'custom',
        display_name: 'Custom',
        is_global: true,
        permissions: ['patients:read', 'audit:read', 'centers:delete'],
      },
    ];
    const userRoles: UserRoleDto[] = [
      {
        user_id: 'user-1',
        role_id: 'role-custom',
        role_name: 'custom',
        is_global: true,
        center_id: null,
      },
    ];

    const result = resolvePermissionsFromRoles(userRoles, catalogWithExtra);

    expect(result.globalPermissions).toEqual(['patients:read']);
  });

  it('falls back to known role permissions when catalog omits permissions', () => {
    const apiCatalog: RoleCatalogItemDto[] = [
      {
        id: 'ea57d4e1-683d-4595-9de2-d3120ff3bde7',
        name: 'admin',
        display_name: 'Administrador',
        is_global: true,
      },
    ];
    const userRoles: UserRoleDto[] = [
      {
        user_id: '6f838541-3c4e-4b7a-8e28-648b9424328a',
        role_id: 'ea57d4e1-683d-4595-9de2-d3120ff3bde7',
        role_name: 'admin',
        is_global: true,
        center_id: null,
      },
    ];

    const result = resolvePermissionsFromRoles(userRoles, apiCatalog);

    expect(result.globalPermissions).toContain('patients:read');
    expect(result.globalPermissions).toContain('users:delete');
  });
});

describe('buildAuthSession', () => {
  it('builds a session with resolved permissions and user data', () => {
    const session = buildAuthSession(
      'access-token',
      'refresh-token',
      1_700_000_000_000,
      {
        data: {
          user: {
            id: 'user-1',
            email: 'admin@example.com',
            name: 'Admin',
          },
        },
      },
      [
        {
          user_id: 'user-1',
          role_id: 'role-admin',
          role_name: 'admin',
          is_global: true,
          center_id: null,
        },
      ],
      roleCatalog,
    );

    expect(session.accessToken).toBe('access-token');
    expect(session.user.email).toBe('admin@example.com');
    expect(session.globalPermissions).toContain('patients:read');
    expect(session.centerPermissions).toEqual({});
  });

  it('combines first and last name for display', () => {
    const session = buildAuthSession(
      'access-token',
      'refresh-token',
      1_700_000_000_000,
      {
        data: {
          user: {
            id: 'user-1',
            email: 'baronrafael@hotmail.com',
            name: 'Rafael',
            last_name: 'Baron',
          },
        },
      },
      [],
      [],
    );

    expect(session.user.name).toBe('Rafael Baron');
  });
});
