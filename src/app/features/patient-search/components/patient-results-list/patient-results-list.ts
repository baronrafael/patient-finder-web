import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { PatientRecord } from '../../models/patient-record.model';
import { PatientResultCard } from '../patient-result-card/patient-result-card';

@Component({
  selector: 'app-patient-results-list',
  imports: [PatientResultCard],
  templateUrl: './patient-results-list.html',
  styleUrl: './patient-results-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientResultsList {
  readonly patients = input.required<readonly PatientRecord[]>();
  readonly query = input('');
  readonly hasMore = input(false);
  readonly loadingMore = input(false);
  readonly loadMore = output<void>();
}
