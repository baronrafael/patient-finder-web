export interface AdminPersonListRow {
  readonly id: string;
  readonly fullName: string;
  readonly identityDocument: string | null;
  readonly sex: string | null;
  readonly age: string | null;
  readonly status: string | null;
  readonly statusLabel: string;
  readonly centerId: string;
  readonly centerName: string;
  readonly admittedAt: string | null;
  readonly admittedAtLabel: string;
}

export interface AdminPersonListItem extends AdminPersonListRow {
  readonly canEdit: boolean;
  readonly canDelete: boolean;
}
