import {
  ApiUserDto,
  ApiUserListResponseDto,
  ApiUserRoleAssignmentDto,
  ApiUserWriteDto,
} from '../../../../core/api/user-api.dto';
import { parseApiPagination } from '../../../../core/api/person-api.mapper';
import { UserRolesResponseDto } from '../../../../core/auth/models/auth-api.dto';
import { AdminUserListRow } from '../models/admin-user-list-item.model';
import {
  AdminUserRecord,
  AdminUserRoleAssignment,
  AdminUserWriteValue,
} from '../models/admin-user-record.model';
import { UserListResult } from '../models/user-list-result.model';

export function mapUserListResult(
  response: ApiUserListResponseDto,
  fallbackPage: number,
  fallbackPageSize: number,
): UserListResult {
  const users = response.data.users ?? [];
  const { page, pageSize, total, totalPages } = parseApiPagination(
    response.pagination,
    fallbackPage,
    fallbackPageSize,
    users.length,
  );

  return {
    items: users.map(mapAdminUserListRow),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function mapAdminUserListRow(user: ApiUserDto): AdminUserListRow {
  const isActive = user.is_active !== false;

  return {
    id: user.id,
    fullName: formatUserFullName(user),
    email: user.email.trim(),
    rolesLabel: formatUserRolesLabel(user.roles),
    isActive,
    statusLabel: isActive ? 'Activo' : 'Inactivo',
  };
}

export function mapAdminUserRecord(
  user: ApiUserDto,
  rolesResponse?: UserRolesResponseDto,
): AdminUserRecord {
  const roles = rolesResponse?.data.roles?.length
    ? rolesResponse.data.roles.map(mapRoleAssignmentFromAuth)
    : (user.roles ?? []).map(mapRoleAssignmentFromApi);

  return {
    id: user.id,
    email: user.email.trim(),
    name: user.name.trim(),
    lastName: user.last_name?.trim() ?? '',
    isActive: user.is_active !== false,
    roles,
  };
}

export function mapAdminUserToWriteDto(value: AdminUserWriteValue): ApiUserWriteDto {
  const lastName = value.lastName.trim();
  const password = value.password?.trim();

  return {
    email: value.email.trim(),
    name: value.name.trim(),
    ...(lastName ? { last_name: lastName } : {}),
    ...(password ? { password } : {}),
    is_active: value.isActive,
    roles: value.roles.map((role) => ({
      role_id: role.roleId,
      center_id: role.isGlobal ? null : role.centerId,
    })),
  };
}

function mapRoleAssignmentFromApi(role: ApiUserRoleAssignmentDto): AdminUserRoleAssignment {
  return {
    roleId: role.role_id,
    roleName: role.role_name,
    displayName: role.display_name?.trim() || role.role_name,
    isGlobal: role.is_global,
    centerId: role.center_id ?? null,
    centerName: role.center_name?.trim() || null,
  };
}

function mapRoleAssignmentFromAuth(
  role: UserRolesResponseDto['data']['roles'][number],
): AdminUserRoleAssignment {
  return {
    roleId: role.role_id,
    roleName: role.role_name,
    displayName: role.role_name,
    isGlobal: role.is_global,
    centerId: role.center_id,
    centerName: null,
  };
}

function formatUserFullName(user: ApiUserDto): string {
  const fullName = [user.name, user.last_name]
    .filter((part) => part?.trim())
    .join(' ')
    .trim();

  return fullName || user.email.trim() || 'Sin nombre';
}

function formatUserRolesLabel(roles: readonly ApiUserRoleAssignmentDto[] | undefined): string {
  if (!roles?.length) {
    return '—';
  }

  return roles
    .map((role) => {
      const label = role.display_name?.trim() || role.role_name;
      if (role.is_global) {
        return label;
      }

      return role.center_name ? `${label} · ${role.center_name}` : `${label} · centro`;
    })
    .join(', ');
}
