import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, disabled, form } from '@angular/forms/signals';
import { distinctUntilChanged, filter, map } from 'rxjs';

import { Hospital } from '../../models/hospital.model';

@Component({
  selector: 'app-hospital-filter',
  imports: [FormField],
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

  constructor() {
    effect(() => {
      const hospitalId = this.selectedHospitalId() ?? '';
      untracked(() => {
        if (this.hospitalModel().hospitalId === hospitalId) {
          return;
        }
        this.hospitalModel.set({ hospitalId });
      });
    });

    toObservable(this.hospitalModel)
      .pipe(
        map((model) => model.hospitalId || null),
        distinctUntilChanged(),
        filter((hospitalId) => hospitalId !== this.selectedHospitalId()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((hospitalId) => this.hospitalChange.emit(hospitalId));
  }
}
