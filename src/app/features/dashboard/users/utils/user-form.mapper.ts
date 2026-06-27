import { AdminUserRecord, AdminUserWriteValue } from '../models/admin-user-record.model';
import {
  EMPTY_USER_FORM,
  UserFormRoleRow,
  UserFormValue,
  UserRoleOption,
} from '../models/user-form.model';

export interface UserFormModel {
  email: string;
  name: string;
  lastName: string;
  password: string;
  isActive: 'true' | 'false';
}

export function createEmptyUserFormModel(): UserFormModel {
  return {
    email: '',
    name: '',
    lastName: '',
    password: '',
    isActive: 'true',
  };
}

export function createDefaultUserFormValue(): UserFormValue {
  return { ...EMPTY_USER_FORM, roles: [{ roleId: '', centerId: '' }] };
}

export function mapAdminUserRecordToFormValue(record: AdminUserRecord): UserFormValue {
  return {
    email: record.email,
    name: record.name,
    lastName: record.lastName,
    password: '',
    isActive: record.isActive,
    roles:
      record.roles.length > 0
        ? record.roles.map((role) => ({
            roleId: role.roleId,
            centerId: role.isGlobal ? '' : (role.centerId ?? ''),
          }))
        : [{ roleId: '', centerId: '' }],
  };
}

export function normalizeUserFormRoles(
  roles: readonly UserFormRoleRow[],
): readonly UserFormRoleRow[] {
  return roles
    .filter((row) => row.roleId.trim())
    .map((row) => ({
      roleId: row.roleId.trim(),
      centerId: row.centerId.trim(),
    }));
}

export function userFormModelToValue(
  model: UserFormModel,
  roleRows: readonly UserFormRoleRow[],
): UserFormValue {
  return {
    email: model.email,
    name: model.name,
    lastName: model.lastName,
    password: model.password,
    isActive: model.isActive === 'true',
    roles: normalizeUserFormRoles(roleRows),
  };
}

export function userFormValueToModel(value: UserFormValue): UserFormModel {
  return {
    email: value.email,
    name: value.name,
    lastName: value.lastName,
    password: value.password,
    isActive: value.isActive ? 'true' : 'false',
  };
}

export function mapUserFormValueToWriteValue(
  value: UserFormValue,
  roleOptions: readonly UserRoleOption[],
): AdminUserWriteValue {
  const globalById = new Map(roleOptions.map((role) => [role.id, role.isGlobal]));

  return {
    email: value.email,
    name: value.name,
    lastName: value.lastName,
    ...(value.password.trim() ? { password: value.password.trim() } : {}),
    isActive: value.isActive,
    roles: normalizeUserFormRoles(value.roles).map((row) => {
      const isGlobal = globalById.get(row.roleId) ?? false;

      return {
        roleId: row.roleId,
        isGlobal,
        centerId: isGlobal ? null : row.centerId || null,
      };
    }),
  };
}

export function roleOptionLabel(role: UserRoleOption): string {
  return role.isGlobal ? `${role.displayName} (global)` : role.displayName;
}

export function isGlobalRole(roleId: string, roleOptions: readonly UserRoleOption[]): boolean {
  return roleOptions.find((role) => role.id === roleId)?.isGlobal ?? false;
}
