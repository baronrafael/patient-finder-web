import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';

import { Estado, Municipio, Parroquia } from '../../models/location.model';
import { PatientFilters } from '../../models/patient-filters.model';
import { PatientSex } from '../../models/patient-sex.model';

@Component({
  selector: 'app-patient-search-filters',
  imports: [FormField],
  templateUrl: './patient-search-filters.html',
  styleUrl: './patient-search-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientSearchFilters {
  readonly estados = input.required<readonly Estado[]>();
  readonly municipios = input<readonly Municipio[]>([]);
  readonly parroquias = input<readonly Parroquia[]>([]);
  readonly selectedSex = input<PatientSex | null>(null);
  readonly selectedEstadoId = input<string | null>(null);
  readonly selectedMunicipioId = input<string | null>(null);
  readonly selectedParroquiaId = input<string | null>(null);
  readonly disabled = input(false);

  readonly filtersChange = output<PatientFilters>();

  readonly filterModel = signal({
    sex: '',
    estadoId: '',
    municipioId: '',
    parroquiaId: '',
  });

  readonly filterForm = form(this.filterModel, (path) => {
    disabled(path.sex, () => this.disabled());
    disabled(path.estadoId, () => this.disabled());
    disabled(path.municipioId, ({ valueOf }) => !valueOf(path.estadoId) || this.disabled());
    disabled(path.parroquiaId, ({ valueOf }) => !valueOf(path.municipioId) || this.disabled());
  });

  readonly availableMunicipios = computed(() => this.municipios());

  readonly availableParroquias = computed(() => this.parroquias());

  readonly municipioDisabled = computed(() => this.disabled() || !this.filterModel().estadoId);
  readonly parroquiaDisabled = computed(() => this.disabled() || !this.filterModel().municipioId);

  constructor() {
    effect(() => {
      const nextModel = {
        sex: this.selectedSex() ?? '',
        estadoId: this.selectedEstadoId() ?? '',
        municipioId: this.selectedMunicipioId() ?? '',
        parroquiaId: this.selectedParroquiaId() ?? '',
      };

      untracked(() => {
        const current = this.filterModel();
        if (
          current.sex === nextModel.sex &&
          current.estadoId === nextModel.estadoId &&
          current.municipioId === nextModel.municipioId &&
          current.parroquiaId === nextModel.parroquiaId
        ) {
          return;
        }
        this.filterModel.set(nextModel);
      });
    });

    effect(() => {
      const model = this.filterModel();
      const sex = model.sex === 'm' || model.sex === 'f' ? model.sex : null;
      const estadoId = model.estadoId || null;
      const municipios = this.availableMunicipios();
      const municipioId = model.municipioId || null;
      const validMunicipioId =
        municipioId && municipios.some((municipio) => municipio.id === municipioId)
          ? municipioId
          : null;
      const parroquias = this.availableParroquias();
      const parroquiaId = model.parroquiaId || null;
      const validParroquiaId =
        parroquiaId && parroquias.some((parroquia) => parroquia.id === parroquiaId)
          ? parroquiaId
          : null;

      untracked(() => {
        if (
          (municipioId && !validMunicipioId) ||
          (parroquiaId && !validParroquiaId)
        ) {
          this.filterModel.set({
            ...model,
            municipioId: validMunicipioId ?? '',
            parroquiaId: validParroquiaId ?? '',
          });
          return;
        }

        const nextFilters: PatientFilters = {
          sex,
          estadoId,
          municipioId: validMunicipioId,
          parroquiaId: validParroquiaId,
        };

        if (!filtersEqual(nextFilters, this.currentFilters())) {
          this.filtersChange.emit(nextFilters);
        }
      });
    });
  }

  private currentFilters(): PatientFilters {
    return {
      sex: this.selectedSex(),
      estadoId: this.selectedEstadoId(),
      municipioId: this.selectedMunicipioId(),
      parroquiaId: this.selectedParroquiaId(),
    };
  }
}

function filtersEqual(left: PatientFilters, right: PatientFilters): boolean {
  return (
    left.sex === right.sex &&
    left.estadoId === right.estadoId &&
    left.municipioId === right.municipioId &&
    left.parroquiaId === right.parroquiaId
  );
}
