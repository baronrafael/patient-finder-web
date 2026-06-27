export interface AdminUserRoleAssignment {
  readonly roleId: string;
  readonly roleName: string;
  readonly displayName: string;
  readonly isGlobal: boolean;
  readonly centerId: string | null;
  readonly centerName: string | null;
}

export interface AdminUserRecord {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly lastName: string;
  readonly isActive: boolean;
  readonly roles: readonly AdminUserRoleAssignment[];
}

export interface AdminUserWriteRole {
  readonly roleId: string;
  readonly isGlobal: boolean;
  readonly centerId: string | null;
}

export interface AdminUserWriteValue {
  readonly email: string;
  readonly name: string;
  readonly lastName: string;
  readonly password?: string;
  readonly isActive: boolean;
  readonly roles: readonly AdminUserWriteRole[];
}
