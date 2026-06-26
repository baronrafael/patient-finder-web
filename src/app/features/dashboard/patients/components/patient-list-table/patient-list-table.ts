import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminPersonListItem } from '../../models/admin-person-list-item.model';

@Component({
  selector: 'app-patient-list-table',
  imports: [RouterLink],
  templateUrl: './patient-list-table.html',
  styleUrl: './patient-list-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientListTable {
  readonly items = input.required<readonly AdminPersonListItem[]>();
  readonly patientDetailPath = input.required<(id: string) => string>();
}
