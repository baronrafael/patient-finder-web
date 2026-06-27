import { PersonSex } from '../../../../core/models/person-sex.model';

import { DEFAULT_PERSON_STATUS, PersonStatus } from './person-status.model';

export interface PersonFormValue {
  readonly firstName: string;
  readonly lastName: string;
  readonly cedula: string;
  readonly sex: PersonSex | null;
  readonly ageApprox: number | null;
  readonly status: PersonStatus;
  readonly admittedAt: string;
  readonly rescueEstadoId: string;
  readonly rescueMunicipioId: string;
  readonly rescueParroquiaId: string | null;
  readonly centerId: string;
  readonly contacts: string;
  readonly notes: string;
}

export type PersonFormField =
  | 'identity'
  | 'firstName'
  | 'lastName'
  | 'cedula'
  | 'sex'
  | 'ageApprox'
  | 'status'
  | 'admittedAt'
  | 'rescueEstadoId'
  | 'rescueMunicipioId'
  | 'rescueParroquiaId'
  | 'centerId'
  | 'contacts'
  | 'notes';

export type PersonFormErrors = Partial<Record<PersonFormField, string>>;

export const EMPTY_PERSON_FORM: PersonFormValue = {
  firstName: '',
  lastName: '',
  cedula: '',
  sex: null,
  ageApprox: null,
  status: DEFAULT_PERSON_STATUS,
  admittedAt: '',
  rescueEstadoId: '',
  rescueMunicipioId: '',
  rescueParroquiaId: null,
  centerId: '',
  contacts: '',
  notes: '',
};
