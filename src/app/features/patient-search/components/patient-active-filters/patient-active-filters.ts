import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ActiveFilterChip, ActiveFilterKey } from '../../models/active-filter-chip.model';

@Component({
  selector: 'app-patient-active-filters',
  templateUrl: './patient-active-filters.html',
  styleUrl: './patient-active-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientActiveFilters {
  readonly chips = input.required<readonly ActiveFilterChip[]>();
  readonly chipRemove = output<ActiveFilterKey>();
  readonly clearAll = output<void>();
}
