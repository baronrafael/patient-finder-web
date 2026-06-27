import { UserFormErrors, UserFormValue, UserRoleOption } from '../models/user-form.model';
import { MIN_USER_PASSWORD_LENGTH } from './user-form.constants';
import { isGlobalRole } from './user-form.mapper';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUserFormValid(errors: UserFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

export function validateUserForm(
  value: UserFormValue,
  options: { requirePassword: boolean },
  roleOptions: readonly UserRoleOption[],
): UserFormErrors {
  const errors: UserFormErrors = {};
  const email = value.email.trim();

  if (!email) {
    errors.email = 'Indica el correo electrónico.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (!value.name.trim()) {
    errors.name = 'Indica el nombre.';
  }

  const password = value.password.trim();
  if (options.requirePassword && !password) {
    errors.password = 'Indica una contraseña.';
  } else if (password && password.length < MIN_USER_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_USER_PASSWORD_LENGTH} caracteres.`;
  }

  const validRoles = value.roles.filter((row) => row.roleId.trim());
  if (validRoles.length === 0) {
    errors.roles = 'Asigna al menos un rol.';
  } else {
    const roleErrors = validateRoleRows(value, roleOptions);
    if (roleErrors) {
      errors.roles = roleErrors;
    }
  }

  return errors;
}

function validateRoleRows(
  value: UserFormValue,
  roleOptions: readonly UserRoleOption[],
): string | null {
  const seen = new Set<string>();

  for (const row of value.roles) {
    const roleId = row.roleId.trim();
    if (!roleId) {
      continue;
    }

    const global = isGlobalRole(roleId, roleOptions);
    const centerId = row.centerId.trim();
    const key = global ? `global:${roleId}` : `center:${roleId}:${centerId}`;

    if (!global && !centerId) {
      return 'Selecciona un centro para los roles por centro.';
    }

    if (seen.has(key)) {
      return 'Hay roles duplicados. Revisa las asignaciones.';
    }

    seen.add(key);
  }

  return null;
}
