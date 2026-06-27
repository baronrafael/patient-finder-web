export interface AuthTokensDto {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly token_type: 'Bearer';
  readonly expires_in: number;
}

export interface AuthTokensResponseDto {
  readonly data: AuthTokensDto;
}

export interface RefreshAccessTokenRequestDto {
  readonly refresh_token: string;
}

export interface LoginRequestDto {
  readonly email: string;
  readonly password: string;
}

export interface AuthUserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly last_name?: string;
}

export interface AuthMeResponseDto {
  readonly data: {
    readonly user: AuthUserDto;
  };
}

export interface UserRoleDto {
  readonly user_id: string;
  readonly role_id: string;
  readonly role_name: string;
  readonly is_global: boolean;
  readonly center_id: string | null;
  readonly created_at?: string;
}

export interface UserRolesResponseDto {
  readonly data: {
    readonly roles: readonly UserRoleDto[];
  };
}

export interface RoleCatalogItemDto {
  readonly id: string;
  readonly name: string;
  readonly display_name: string;
  readonly is_global: boolean;
  readonly permissions?: readonly string[];
  readonly created_at?: string;
  readonly updated_at?: string;
}

export interface RolesCatalogResponseDto {
  readonly data: {
    readonly roles: readonly RoleCatalogItemDto[];
  };
}
