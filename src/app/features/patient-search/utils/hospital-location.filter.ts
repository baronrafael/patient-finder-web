import { Hospital } from '../models/hospital.model';

export interface HospitalLocationFilter {
  readonly estadoId: string | null;
  readonly municipioId: string | null;
  readonly parroquiaId: string | null;
}

export function filterHospitalsByLocation(
  hospitals: readonly Hospital[],
  filters: HospitalLocationFilter,
): readonly Hospital[] {
  const { estadoId, municipioId, parroquiaId } = filters;
  if (!estadoId && !municipioId && !parroquiaId) {
    return hospitals;
  }

  return hospitals.filter((hospital) => hospitalMatchesLocationFilter(hospital, filters));
}

export function hospitalMatchesLocationFilter(
  hospital: Hospital,
  filters: HospitalLocationFilter,
): boolean {
  const { estadoId, municipioId, parroquiaId } = filters;

  if (parroquiaId && hospital.parroquiaId !== parroquiaId) {
    return false;
  }
  if (municipioId && hospital.municipioId !== municipioId) {
    return false;
  }
  if (estadoId && hospital.estadoId !== estadoId) {
    return false;
  }

  return true;
}
