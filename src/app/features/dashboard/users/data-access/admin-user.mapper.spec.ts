import { describe, expect, it } from 'vitest';

import { ApiUserDto } from '../../../../core/api/user-api.dto';
import { mapAdminUserListRow, mapUserListResult } from './admin-user.mapper';

describe('mapAdminUserListRow', () => {
  it('formats full name, roles and active status', () => {
    const user: ApiUserDto = {
      id: 'user-1',
      email: 'ana@example.com',
      name: 'Ana',
      last_name: 'Pérez',
      is_active: true,
      roles: [
        {
          role_id: 'role-1',
          role_name: 'digitador',
          display_name: 'Digitador',
          is_global: false,
          center_id: 'center-1',
          center_name: 'Hospital Central',
        },
      ],
    };

    expect(mapAdminUserListRow(user)).toEqual({
      id: 'user-1',
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      rolesLabel: 'Digitador · Hospital Central',
      isActive: true,
      statusLabel: 'Activo',
    });
  });

  it('marks inactive users', () => {
    const row = mapAdminUserListRow({
      id: 'user-2',
      email: 'inactive@example.com',
      name: 'Carlos',
      is_active: false,
    });

    expect(row.isActive).toBe(false);
    expect(row.statusLabel).toBe('Inactivo');
  });
});

describe('mapUserListResult', () => {
  it('maps paginated users', () => {
    const result = mapUserListResult(
      {
        data: {
          users: [
            {
              id: 'user-1',
              email: 'ana@example.com',
              name: 'Ana',
            },
          ],
        },
        pagination: {
          current_page: 1,
          page_size: 20,
          total_records: 1,
          last_page: 1,
        },
      },
      1,
      20,
    );

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.email).toBe('ana@example.com');
  });
});
