import { AuthMeResponseDto } from './models/auth-api.dto';
import { AuthSession, AuthUser } from './models/auth-session.model';
import { Permission, isPermission } from './models/permission.model';

function mapPermissions(values: readonly string[] | undefined): readonly Permission[] {
  return (values ?? []).filter(isPermission);
}

function mapCenterPermissions(
  values: Readonly<Record<string, readonly string[]>> | undefined,
): Readonly<Record<string, readonly Permission[]>> {
  if (!values) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(values).map(([centerId, permissions]) => [centerId, mapPermissions(permissions)]),
  );
}

export function buildAuthSession(
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  me: AuthMeResponseDto,
): AuthSession {
  const user: AuthUser = {
    id: me.data.user.id,
    email: me.data.user.email,
    name: me.data.user.name,
  };

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user,
    globalPermissions: mapPermissions(me.data.global_permissions),
    centerPermissions: mapCenterPermissions(me.data.center_permissions),
  };
}
