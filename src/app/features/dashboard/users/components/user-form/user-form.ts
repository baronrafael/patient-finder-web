import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { disabled, form } from '@angular/forms/signals';

import { SelectField } from '../../../../../shared/components/select-field/select-field';
import { TextField } from '../../../../../shared/components/text-field/text-field';
import {
  UserFormCenterOption,
  UserFormErrors,
  UserFormField,
  UserFormRoleRow,
  UserFormValue,
  UserRoleOption,
} from '../../models/user-form.model';
import { USER_ACTIVE_FORM_OPTIONS, MIN_USER_PASSWORD_LENGTH } from '../../utils/user-form.constants';
import {
  createEmptyUserFormModel,
  isGlobalRole,
  roleOptionLabel,
  userFormModelToValue,
  userFormValueToModel,
  UserFormModel,
} from '../../utils/user-form.mapper';
import { isUserFormValid, validateUserForm } from '../../utils/user-form.validation';

@Component({
  selector: 'app-user-form',
  imports: [TextField, SelectField],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  readonly initialValue = input<UserFormValue | null>(null);
  readonly roleOptions = input.required<readonly UserRoleOption[]>();
  readonly centerOptions = input.required<readonly UserFormCenterOption[]>();
  readonly isEditMode = input(false);
  readonly disabled = input(false);
  readonly submitLabel = input('Guardar voluntario');

  readonly submitted = output<UserFormValue>();

  readonly activeOptions = USER_ACTIVE_FORM_OPTIONS;

  readonly formModel = signal<UserFormModel>(createEmptyUserFormModel());
  readonly roleRows = signal<UserFormRoleRow[]>([{ roleId: '', centerId: '' }]);
  readonly formErrors = signal<UserFormErrors>({});
  readonly showErrors = signal(false);

  readonly form = form(this.formModel, (path) => {
    disabled(path.email, () => this.disabled());
    disabled(path.name, () => this.disabled());
    disabled(path.lastName, () => this.disabled());
    disabled(path.password, () => this.disabled());
    disabled(path.isActive, () => this.disabled());
  });

  readonly passwordHint = computed(() =>
    this.isEditMode()
      ? 'Opcional. Déjalo vacío para mantener la contraseña actual.'
      : `Mínimo ${MIN_USER_PASSWORD_LENGTH} caracteres.`,
  );

  constructor() {
    effect(() => {
      const initial = this.initialValue();
      if (!initial) {
        return;
      }

      untracked(() => {
        const nextModel = userFormValueToModel(initial);
        const nextRoles = initial.roles.map((row) => ({ ...row }));

        if (
          userFormModelsEqual(this.formModel(), nextModel) &&
          userFormRoleRowsEqual(this.roleRows(), nextRoles)
        ) {
          return;
        }

        this.formModel.set(nextModel);
        this.roleRows.set(nextRoles.length > 0 ? nextRoles : [{ roleId: '', centerId: '' }]);
      });
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.disabled()) {
      return;
    }

    const value = userFormModelToValue(this.formModel(), this.roleRows());
    const errors = validateUserForm(
      value,
      { requirePassword: !this.isEditMode() },
      this.roleOptions(),
    );
    this.formErrors.set(errors);
    this.showErrors.set(true);

    if (isUserFormValid(errors)) {
      this.submitted.emit(value);
    }
  }

  fieldError(field: UserFormField): string | null {
    if (!this.showErrors()) {
      return null;
    }

    return this.formErrors()[field] ?? null;
  }

  fieldErrorMarkup(field: UserFormField): { readonly visible: boolean; readonly text: string } {
    const message = this.fieldError(field);
    return {
      visible: Boolean(message),
      text: message ?? '\u00a0',
    };
  }

  roleLabel(role: UserRoleOption): string {
    return roleOptionLabel(role);
  }

  isGlobalRole(roleId: string): boolean {
    return isGlobalRole(roleId, this.roleOptions());
  }

  onRoleChange(index: number, roleId: string): void {
    this.roleRows.update((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              roleId,
              centerId: isGlobalRole(roleId, this.roleOptions()) ? '' : row.centerId,
            }
          : row,
      ),
    );
  }

  onCenterChange(index: number, centerId: string): void {
    this.roleRows.update((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, centerId } : row)),
    );
  }

  addRoleRow(): void {
    this.roleRows.update((rows) => [...rows, { roleId: '', centerId: '' }]);
  }

  removeRoleRow(index: number): void {
    this.roleRows.update((rows) => {
      if (rows.length <= 1) {
        return rows;
      }

      return rows.filter((_, rowIndex) => rowIndex !== index);
    });
  }
}

function userFormModelsEqual(left: UserFormModel, right: UserFormModel): boolean {
  return (
    left.email === right.email &&
    left.name === right.name &&
    left.lastName === right.lastName &&
    left.password === right.password &&
    left.isActive === right.isActive
  );
}

function userFormRoleRowsEqual(
  left: readonly UserFormRoleRow[],
  right: readonly UserFormRoleRow[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (row, index) => row.roleId === right[index]?.roleId && row.centerId === right[index]?.centerId,
  );
}
