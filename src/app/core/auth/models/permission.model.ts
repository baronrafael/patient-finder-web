export const PERMISSIONS = [
  'patients:read',
  'patients:create',
  'patients:update',
  'patients:delete',
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERSON_PERMISSIONS: readonly Permission[] = [
  'patients:read',
  'patients:create',
  'patients:update',
  'patients:delete',
];

export const USER_PERMISSIONS: readonly Permission[] = [
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
