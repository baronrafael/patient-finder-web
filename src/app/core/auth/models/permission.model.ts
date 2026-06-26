export const PERMISSIONS = [
  'persons.create',
  'persons.edit',
  'persons.delete',
  'users.create',
  'users.edit',
  'users.delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERSON_PERMISSIONS: readonly Permission[] = [
  'persons.create',
  'persons.edit',
  'persons.delete',
];

export const USER_PERMISSIONS: readonly Permission[] = [
  'users.create',
  'users.edit',
  'users.delete',
];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
