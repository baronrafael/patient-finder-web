import { ActiveFilterChip } from '../models/active-filter-chip.model';
import { Hospital } from '../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../models/location.model';
import { PatientSex } from '../models/patient-sex.model';
import { PATIENT_SEX_LABELS } from './patient-search.messages';

export interface ActiveFilterChipContext {
  readonly hospitals: readonly Hospital[];
  readonly estados: readonly Estado[];
  readonly municipios: readonly Municipio[];
  readonly parroquias: readonly Parroquia[];
  readonly hospitalId: string | null;
  readonly sex: PatientSex | null;
  readonly estadoId: string | null;
  readonly municipioId: string | null;
  readonly parroquiaId: string | null;
}

export function buildActiveFilterChips(context: ActiveFilterChipContext): readonly ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (context.hospitalId) {
    const hospital = context.hospitals.find((item) => item.id === context.hospitalId);
    if (hospital) {
      chips.push({ key: 'hospital', label: hospital.name });
    }
  }

  if (context.sex === 'm' || context.sex === 'f') {
    chips.push({ key: 'sex', label: PATIENT_SEX_LABELS[context.sex] });
  }

  if (context.estadoId) {
    const estado = context.estados.find((item) => item.id === context.estadoId);
    if (estado) {
      chips.push({ key: 'estado', label: estado.name });

      if (context.municipioId) {
        const municipio = context.municipios.find((item) => item.id === context.municipioId);
        if (municipio) {
          chips.push({ key: 'municipio', label: municipio.name });

          if (context.parroquiaId) {
            const parroquia = context.parroquias.find((item) => item.id === context.parroquiaId);
            if (parroquia) {
              chips.push({ key: 'parroquia', label: parroquia.name });
            }
          }
        }
      }
    }
  }

  return chips;
}

export function summarizeFilterLabels(chips: readonly ActiveFilterChip[], maxLength = 52): string | null {
  if (!chips.length) {
    return null;
  }

  const joined = chips.map((chip) => chip.label).join(' · ');
  return joined.length > maxLength ? `${joined.slice(0, maxLength - 1)}…` : joined;
}
