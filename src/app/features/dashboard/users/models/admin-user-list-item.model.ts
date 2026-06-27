export interface AdminUserListRow {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly rolesLabel: string;
  readonly isActive: boolean;
  readonly statusLabel: string;
}

export interface AdminUserListItem extends AdminUserListRow {
  readonly canEdit: boolean;
  readonly canDelete: boolean;
}
