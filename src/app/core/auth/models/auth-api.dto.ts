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
}

export interface AuthMeResponseDto {
  readonly data: {
    readonly user: AuthUserDto;
    readonly global_permissions?: readonly string[];
    readonly center_permissions?: Readonly<Record<string, readonly string[]>>;
  };
}
