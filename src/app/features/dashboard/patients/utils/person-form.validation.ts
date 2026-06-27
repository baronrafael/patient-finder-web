import { normalizeDocument } from '../../../../core/utils/normalize-document';
import { PersonSex } from '../../../../core/models/person-sex.model';
import {
  PersonFormErrors,
  PersonFormValue,
} from '../models/person-form.model';
import { isPersonStatus } from '../models/person-status.model';
import {
  MAX_PERSON_AGE,
  MIN_PERSON_AGE,
  MIN_PERSON_CEDULA_DIGITS,
} from './person-form.constants';

export function normalizePersonFormCedula(cedula: string): string {
  return normalizeDocument(cedula.trim());
}

export function hasValidPersonIdentity(value: PersonFormValue): boolean {
  const cedulaDigits = normalizePersonFormCedula(value.cedula);
  if (cedulaDigits.length >= MIN_PERSON_CEDULA_DIGITS) {
    return true;
  }

  return Boolean(value.firstName.trim() && value.lastName.trim());
}

export function isPersonFormValid(errors: PersonFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

export function validatePersonForm(value: PersonFormValue): PersonFormErrors {
  const errors: PersonFormErrors = {};

  if (!hasValidPersonIdentity(value)) {
    errors.identity =
      'Ingresa una cédula válida (mínimo 6 dígitos) o nombre y apellido.';
  }

  const cedulaDigits = normalizePersonFormCedula(value.cedula);
  if (value.cedula.trim() && cedulaDigits.length > 0 && cedulaDigits.length < MIN_PERSON_CEDULA_DIGITS) {
    errors.cedula = `La cédula debe tener al menos ${MIN_PERSON_CEDULA_DIGITS} dígitos.`;
  }

  if (value.sex !== null && value.sex !== 'm' && value.sex !== 'f') {
    errors.sex = 'Selecciona un sexo válido.';
  }

  if (value.ageApprox != null) {
    if (!Number.isInteger(value.ageApprox) || value.ageApprox < MIN_PERSON_AGE || value.ageApprox > MAX_PERSON_AGE) {
      errors.ageApprox = `La edad debe estar entre ${MIN_PERSON_AGE} y ${MAX_PERSON_AGE}.`;
    }
  }

  if (!isPersonStatus(value.status)) {
    errors.status = 'Selecciona un estado válido.';
  }

  if (!value.admittedAt.trim()) {
    errors.admittedAt = 'Indica la fecha de ingreso.';
  } else if (Number.isNaN(new Date(value.admittedAt).getTime())) {
    errors.admittedAt = 'La fecha de ingreso no es válida.';
  }

  if (!value.rescueEstadoId.trim()) {
    errors.rescueEstadoId = 'Selecciona el estado de rescate.';
  }

  if (!value.rescueMunicipioId.trim()) {
    errors.rescueMunicipioId = 'Selecciona el municipio de rescate.';
  }

  if (!value.centerId.trim()) {
    errors.centerId = 'Selecciona el centro.';
  }

  return errors;
}

export function parsePersonFormSex(value: string): PersonSex | null {
  if (value === 'm' || value === 'f') {
    return value;
  }

  return null;
}
