import { describe, expect, it } from 'vitest';

import {
  mapAdminUserRecordToFormValue,
  mapUserFormValueToWriteValue,
  normalizeUserFormRoles,
  userFormModelToValue,
} from './user-form.mapper';
import { validateUserForm } from './user-form.validation';

const roleOptions = [
  { id: 'role-admin', name: 'admin', displayName: 'Administrador', isGlobal: true },
  { id: 'role-digitador', name: 'digitador', displayName: 'Digitador', isGlobal: false },
] as const;

describe('mapAdminUserRecordToFormValue', () => {
  it('maps record fields and role assignments', () => {
    const value = mapAdminUserRecordToFormValue({
      id: 'user-1',
      email: 'ana@example.com',
      name: 'Ana',
      lastName: 'Pérez',
      isActive: true,
      roles: [
        {
          roleId: 'role-digitador',
          roleName: 'digitador',
          displayName: 'Digitador',
          isGlobal: false,
          centerId: 'center-1',
          centerName: 'Hospital Central',
        },
      ],
    });

    expect(value.email).toBe('ana@example.com');
    expect(value.password).toBe('');
    expect(value.roles).toEqual([{ roleId: 'role-digitador', centerId: 'center-1' }]);
  });
});

describe('mapUserFormValueToWriteValue', () => {
  it('maps global and center roles for the API', () => {
    const writeValue = mapUserFormValueToWriteValue(
      {
        email: 'ana@example.com',
        name: 'Ana',
        lastName: 'Pérez',
        password: 'secret123',
        isActive: true,
        roles: [
          { roleId: 'role-admin', centerId: '' },
          { roleId: 'role-digitador', centerId: 'center-1' },
        ],
      },
      roleOptions,
    );

    expect(writeValue.password).toBe('secret123');
    expect(writeValue.roles).toEqual([
      expect.objectContaining({ roleId: 'role-admin', isGlobal: true, centerId: null }),
      expect.objectContaining({
        roleId: 'role-digitador',
        isGlobal: false,
        centerId: 'center-1',
      }),
    ]);
  });

  it('omits empty password on update', () => {
    const writeValue = mapUserFormValueToWriteValue(
      {
        email: 'ana@example.com',
        name: 'Ana',
        lastName: '',
        password: '   ',
        isActive: false,
        roles: [{ roleId: 'role-admin', centerId: '' }],
      },
      roleOptions,
    );

    expect(writeValue.password).toBeUndefined();
    expect(writeValue.isActive).toBe(false);
  });

  it('ignores blank role rows before writing', () => {
    const writeValue = mapUserFormValueToWriteValue(
      {
        email: 'ana@example.com',
        name: 'Ana',
        lastName: '',
        password: 'secret123',
        isActive: true,
        roles: [
          { roleId: 'role-admin', centerId: '' },
          { roleId: '', centerId: '' },
        ],
      },
      roleOptions,
    );

    expect(writeValue.roles).toEqual([
      { roleId: 'role-admin', isGlobal: true, centerId: null },
    ]);
  });
});

describe('normalizeUserFormRoles', () => {
  it('drops blank rows and trims values', () => {
    expect(
      normalizeUserFormRoles([
        { roleId: ' role-admin ', centerId: ' center-1 ' },
        { roleId: '', centerId: '' },
      ]),
    ).toEqual([{ roleId: 'role-admin', centerId: 'center-1' }]);
  });
});

describe('userFormModelToValue', () => {
  it('normalizes role rows when building the form value', () => {
    const value = userFormModelToValue(
      {
        email: 'ana@example.com',
        name: 'Ana',
        lastName: '',
        password: '',
        isActive: 'true',
      },
      [
        { roleId: 'role-admin', centerId: '' },
        { roleId: '', centerId: '' },
      ],
    );

    expect(value.roles).toEqual([{ roleId: 'role-admin', centerId: '' }]);
  });
});

describe('validateUserForm', () => {
  it('requires email, name, password on create and at least one role', () => {
    const errors = validateUserForm(
      {
        email: '',
        name: '',
        lastName: '',
        password: '',
        isActive: true,
        roles: [{ roleId: '', centerId: '' }],
      },
      { requirePassword: true },
      roleOptions,
    );

    expect(errors.email).toBeTruthy();
    expect(errors.name).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(errors.roles).toBeTruthy();
  });

  it('requires center for non-global roles', () => {
    const errors = validateUserForm(
      {
        email: 'ana@example.com',
        name: 'Ana',
        lastName: '',
        password: '',
        isActive: true,
        roles: [{ roleId: 'role-digitador', centerId: '' }],
      },
      { requirePassword: false },
      roleOptions,
    );

    expect(errors.roles).toContain('centro');
  });

  it('rejects duplicate role assignments', () => {
    const errors = validateUserForm(
      {
        email: 'ana@example.com',
        name: 'Ana',
        lastName: '',
        password: '',
        isActive: true,
        roles: [
          { roleId: 'role-digitador', centerId: 'center-1' },
          { roleId: 'role-digitador', centerId: 'center-1' },
        ],
      },
      { requirePassword: false },
      roleOptions,
    );

    expect(errors.roles).toContain('duplicados');
  });
});
