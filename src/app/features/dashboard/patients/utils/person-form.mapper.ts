import { PersonFormValue } from '../models/person-form.model';
import { DEFAULT_PERSON_STATUS } from '../models/person-status.model';
import { parsePersonFormSex } from './person-form.validation';

export interface PersonFormModel {
  readonly firstName: string;
  readonly lastName: string;
  readonly cedula: string;
  readonly sex: string;
  readonly ageApprox: string;
  readonly status: string;
  readonly admittedAt: string;
  readonly rescueEstadoId: string;
  readonly rescueMunicipioId: string;
  readonly rescueParroquiaId: string;
  readonly centerId: string;
  readonly contacts: string;
  readonly notes: string;
}

export function createEmptyPersonFormModel(): PersonFormModel {
  return personFormValueToModel({
    firstName: '',
    lastName: '',
    cedula: '',
    sex: null,
    ageApprox: null,
    status: DEFAULT_PERSON_STATUS,
    admittedAt: defaultAdmittedAtLocal(),
    rescueEstadoId: '',
    rescueMunicipioId: '',
    rescueParroquiaId: null,
    centerId: '',
    contacts: '',
    notes: '',
  });
}

export function personFormValueToModel(value: PersonFormValue): PersonFormModel {
  return {
    firstName: value.firstName,
    lastName: value.lastName,
    cedula: value.cedula,
    sex: value.sex ?? '',
    ageApprox: value.ageApprox == null ? '' : String(value.ageApprox),
    status: value.status,
    admittedAt: value.admittedAt,
    rescueEstadoId: value.rescueEstadoId,
    rescueMunicipioId: value.rescueMunicipioId,
    rescueParroquiaId: value.rescueParroquiaId ?? '',
    centerId: value.centerId,
    contacts: value.contacts,
    notes: value.notes,
  };
}

export function personFormModelToValue(model: PersonFormModel): PersonFormValue {
  const ageText = model.ageApprox.trim();
  const parsedAge = ageText ? Number(ageText) : null;

  return {
    firstName: model.firstName.trim(),
    lastName: model.lastName.trim(),
    cedula: model.cedula.trim(),
    sex: parsePersonFormSex(model.sex),
    ageApprox: parsedAge == null || Number.isNaN(parsedAge) ? null : parsedAge,
    status: model.status as PersonFormValue['status'],
    admittedAt: model.admittedAt.trim(),
    rescueEstadoId: model.rescueEstadoId.trim(),
    rescueMunicipioId: model.rescueMunicipioId.trim(),
    rescueParroquiaId: model.rescueParroquiaId.trim() || null,
    centerId: model.centerId.trim(),
    contacts: model.contacts.trim(),
    notes: model.notes.trim(),
  };
}

export function defaultAdmittedAtLocal(date = new Date()): string {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

export function localDateTimeToIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}
