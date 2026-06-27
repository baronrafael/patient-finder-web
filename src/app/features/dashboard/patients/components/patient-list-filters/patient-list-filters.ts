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
import { disabled, form } from '@angular/forms/signals';

import { SelectField } from '../../../../../shared/components/select-field/select-field';
import { TextField } from '../../../../../shared/components/text-field/text-field';
import {
  EMPTY_PATIENT_LIST_FILTERS,
  PatientListCenterOption,
  PatientListFiltersValue,
} from '../../models/patient-list-filters.model';
import {
  PERSON_SEX_FILTER_OPTIONS,
  PERSON_STATUS_FILTER_OPTIONS,
} from '../../utils/patient-list.constants';

@Component({
  selector: 'app-patient-list-filters',
  imports: [TextField, SelectField],
  templateUrl: './patient-list-filters.html',
  styleUrl: './patient-list-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientListFilters {
  readonly applied = input(EMPTY_PATIENT_LIST_FILTERS);
  readonly centerOptions = input.required<readonly PatientListCenterOption[]>();
  readonly lockCenter = input(false);
  readonly showAllCentersOption = input(false);
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly hasActiveFilters = input(false);

  readonly filtersSubmit = output<PatientListFiltersValue>();
  readonly filtersClear = output<void>();

  readonly sexOptions = PERSON_SEX_FILTER_OPTIONS;
  readonly statusOptions = PERSON_STATUS_FILTER_OPTIONS;

  readonly filterModel = signal({
    query: '',
    centerId: '',
    sex: '',
    status: '',
  });

  readonly filterForm = form(this.filterModel, (path) => {
    disabled(path.query, () => this.disabled());
    disabled(path.centerId, () => this.disabled() || this.lockCenter());
    disabled(path.sex, () => this.disabled());
    disabled(path.status, () => this.disabled());
  });

  readonly isSubmitDisabled = computed(() => this.disabled() || this.loading());

  constructor() {
    effect(() => {
      const applied = this.applied();
      const nextModel = {
        query: applied.query,
        centerId: applied.centerId ?? '',
        sex: applied.sex ?? '',
        status: applied.status ?? '',
      };

      untracked(() => {
        const current = this.filterModel();
        if (
          current.query === nextModel.query &&
          current.centerId === nextModel.centerId &&
          current.sex === nextModel.sex &&
          current.status === nextModel.status
        ) {
          return;
        }

        this.filterModel.set(nextModel);
      });
    });

    effect(() => {
      if (!this.lockCenter()) {
        return;
      }

      const lockedCenterId = this.applied().centerId ?? this.centerOptions()[0]?.id ?? '';
      if (!lockedCenterId) {
        return;
      }

      untracked(() => {
        if (this.filterModel().centerId === lockedCenterId) {
          return;
        }

        this.filterModel.update((model) => ({
          ...model,
          centerId: lockedCenterId,
        }));
      });
    });
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    if (this.isSubmitDisabled()) {
      return;
    }

    this.filtersSubmit.emit(this.readFiltersFromModel());
  }

  onClearFilters(): void {
    if (this.disabled()) {
      return;
    }

    this.filtersClear.emit();
  }

  private readFiltersFromModel(): PatientListFiltersValue {
    const model = this.filterModel();
    const sex = model.sex === 'm' || model.sex === 'f' ? model.sex : null;

    return {
      query: model.query,
      centerId: model.centerId.trim() || null,
      sex,
      status: model.status || null,
    };
  }
}
