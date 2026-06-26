import { PersonSex } from '../../../../core/models/person-sex.model';

export interface PatientListFiltersValue {
  readonly query: string;
  readonly sex: PersonSex | null;
  readonly status: string | null;
}

export const EMPTY_PATIENT_LIST_FILTERS: PatientListFiltersValue = {
  query: '',
  sex: null,
  status: null,
};
