import { Permission } from './permission.model';

/**
 * Permisos por rol según documentación del backend.
 * Fallback cuando GET /roles no incluye el array `permissions`.
 */
export const ROLE_PERMISSIONS: Readonly<Record<string, readonly Permission[]>> = {
  admin: [
    'patients:read',
    'patients:create',
    'patients:update',
    'patients:delete',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
  ],
  supervisor: [
    'patients:read',
    'patients:create',
    'patients:update',
    'patients:delete',
  ],
  encargado: [
    'patients:read',
    'patients:create',
    'patients:update',
    'patients:delete',
  ],
  digitador: ['patients:read', 'patients:create', 'patients:update'],
  registrador: ['patients:read', 'patients:create'],
};

export function permissionsForRole(roleName: string): readonly Permission[] {
  return ROLE_PERMISSIONS[roleName] ?? [];
}
