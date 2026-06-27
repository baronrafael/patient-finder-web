import { PersonSex } from '../../../../core/models/person-sex.model';

export interface PatientListFiltersValue {
  readonly query: string;
  readonly centerId: string | null;
  readonly sex: PersonSex | null;
  readonly status: string | null;
}

export const EMPTY_PATIENT_LIST_FILTERS: PatientListFiltersValue = {
  query: '',
  centerId: null,
  sex: null,
  status: null,
};

export interface PatientListCenterOption {
  readonly id: string;
  readonly name: string;
}
