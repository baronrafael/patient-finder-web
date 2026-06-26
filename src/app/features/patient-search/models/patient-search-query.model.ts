import { PatientSex } from './patient-sex.model';

export interface PatientSearchQuery {
  readonly query: string;
  readonly hospitalId: string | null;
  readonly sex: PatientSex | null;
  readonly estadoId: string | null;
  readonly municipioId: string | null;
  readonly parroquiaId: string | null;
  readonly page: number;
  readonly pageSize: number;
}
