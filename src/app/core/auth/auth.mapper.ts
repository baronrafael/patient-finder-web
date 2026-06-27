import {
  AuthMeResponseDto,
  RoleCatalogItemDto,
  UserRoleDto,
} from './models/auth-api.dto';
import { AuthSession, AuthUser } from './models/auth-session.model';
import { Permission, isPermission } from './models/permission.model';
import { permissionsForRole } from './models/role-permissions.model';

export interface ResolvedPermissions {
  readonly globalPermissions: readonly Permission[];
  readonly centerPermissions: Readonly<Record<string, readonly Permission[]>>;
}

function resolveRolePermissions(
  roleName: string,
  role: RoleCatalogItemDto | undefined,
): readonly Permission[] {
  const fromApi = (role?.permissions ?? []).filter(isPermission);
  if (fromApi.length) {
    return fromApi;
  }

  return permissionsForRole(roleName);
}

export function resolvePermissionsFromRoles(
  userRoles: readonly UserRoleDto[],
  roleCatalog: readonly RoleCatalogItemDto[],
): ResolvedPermissions {
  const catalogByName = new Map(roleCatalog.map((role) => [role.name, role]));
  const globalSet = new Set<Permission>();
  const centerMap = new Map<string, Set<Permission>>();

  for (const assignment of userRoles) {
    const permissions = resolveRolePermissions(
      assignment.role_name,
      catalogByName.get(assignment.role_name),
    );
    if (!permissions.length) {
      continue;
    }

    if (assignment.is_global) {
      for (const permission of permissions) {
        globalSet.add(permission);
      }
      continue;
    }

    if (!assignment.center_id) {
      continue;
    }

    const existing = centerMap.get(assignment.center_id) ?? new Set<Permission>();
    for (const permission of permissions) {
      existing.add(permission);
    }
    centerMap.set(assignment.center_id, existing);
  }

  return {
    globalPermissions: [...globalSet],
    centerPermissions: Object.fromEntries(
      [...centerMap.entries()].map(([centerId, permissions]) => [
        centerId,
        [...permissions],
      ]),
    ),
  };
}

function formatUserName(me: AuthMeResponseDto): string {
  const { name, last_name: lastName } = me.data.user;
  return [name, lastName].filter(Boolean).join(' ');
}

export function buildAuthSession(
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  me: AuthMeResponseDto,
  userRoles: readonly UserRoleDto[],
  roleCatalog: readonly RoleCatalogItemDto[],
): AuthSession {
  const user: AuthUser = {
    id: me.data.user.id,
    email: me.data.user.email,
    name: formatUserName(me),
  };

  const { globalPermissions, centerPermissions } = resolvePermissionsFromRoles(
    userRoles,
    roleCatalog,
  );

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user,
    globalPermissions,
    centerPermissions,
  };
}
