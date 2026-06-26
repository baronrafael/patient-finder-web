import { Permission } from './permission.model';

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly user: AuthUser;
  readonly globalPermissions: readonly Permission[];
  readonly centerPermissions: Readonly<Record<string, readonly Permission[]>>;
}
