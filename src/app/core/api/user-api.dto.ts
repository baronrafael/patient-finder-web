import { ApiPaginationDto } from './person-api.dto';

export interface ApiUserRoleAssignmentDto {
  readonly role_id: string;
  readonly role_name: string;
  readonly display_name?: string | null;
  readonly is_global: boolean;
  readonly center_id?: string | null;
  readonly center_name?: string | null;
}

export interface ApiUserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly last_name?: string | null;
  readonly is_active?: boolean;
  readonly roles?: readonly ApiUserRoleAssignmentDto[];
}

export interface ApiUserListResponseDto {
  readonly data: {
    readonly users: readonly ApiUserDto[];
  };
  readonly pagination?: ApiPaginationDto;
}

export interface ApiUserResponseDto {
  readonly data: {
    readonly user: ApiUserDto;
  };
}

export interface ApiUserRoleWriteDto {
  readonly role_id: string;
  readonly center_id?: string | null;
}

export interface ApiUserWriteDto {
  readonly email: string;
  readonly name: string;
  readonly last_name?: string;
  readonly password?: string;
  readonly is_active?: boolean;
  readonly roles?: readonly ApiUserRoleWriteDto[];
}
