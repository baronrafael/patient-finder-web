export interface UserFormRoleRow {
  readonly roleId: string;
  readonly centerId: string;
}

export interface UserFormValue {
  readonly email: string;
  readonly name: string;
  readonly lastName: string;
  readonly password: string;
  readonly isActive: boolean;
  readonly roles: readonly UserFormRoleRow[];
}

export interface UserRoleOption {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly isGlobal: boolean;
}

export interface UserFormCenterOption {
  readonly id: string;
  readonly name: string;
}

export type UserFormField = 'email' | 'name' | 'lastName' | 'password' | 'isActive' | 'roles';

export type UserFormErrors = Partial<Record<UserFormField, string>>;

export const EMPTY_USER_FORM: UserFormValue = {
  email: '',
  name: '',
  lastName: '',
  password: '',
  isActive: true,
  roles: [{ roleId: '', centerId: '' }],
};
