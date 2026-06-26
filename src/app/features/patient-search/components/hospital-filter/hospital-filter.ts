import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { disabled, form } from '@angular/forms/signals';

import { Hospital } from '../../models/hospital.model';
import { SelectField } from '../../../../shared/components/select-field/select-field';
import { bindControlledField } from '../../utils/bind-controlled-field';

@Component({
  selector: 'app-hospital-filter',
  imports: [SelectField],
  templateUrl: './hospital-filter.html',
  styleUrl: './hospital-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalFilter {
  private readonly destroyRef = inject(DestroyRef);

  readonly hospitals = input.required<readonly Hospital[]>();
  readonly selectedHospitalId = input<string | null>(null);
  readonly disabled = input(false);
  readonly hospitalChange = output<string | null>();

  readonly hospitalModel = signal({ hospitalId: '' });
  readonly hospitalForm = form(this.hospitalModel, (path) => {
    disabled(path.hospitalId, () => this.disabled());
  });

  readonly parentHospitalId = computed(() => this.selectedHospitalId() ?? '');

  constructor() {
    bindControlledField({
      destroyRef: this.destroyRef,
      parentValue: this.parentHospitalId,
      localModel: this.hospitalModel,
      selectValue: (model) => model.hospitalId,
      patchValue: (_model, hospitalId) => ({ hospitalId }),
      emit: (hospitalId) => this.hospitalChange.emit(hospitalId || null),
    });
  }
}
