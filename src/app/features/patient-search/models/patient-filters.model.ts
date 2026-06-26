import { PatientSex } from './patient-sex.model';

export interface PatientFilters {
  readonly sex: PatientSex | null;
  readonly estadoId: string | null;
  readonly municipioId: string | null;
  readonly parroquiaId: string | null;
}
