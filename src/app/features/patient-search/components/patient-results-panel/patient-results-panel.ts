import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { PatientSearchResult } from '../../models/patient-search-result.model';
import { PatientResultsList } from '../patient-results-list/patient-results-list';
import { formatResultCount } from '../../utils/format-result-count';

@Component({
  selector: 'app-patient-results-panel',
  imports: [EmptyState, ErrorState, LoadingSkeleton, PatientResultsList],
  templateUrl: './patient-results-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientResultsPanel {
  readonly hasSearched = input(false);
  readonly loading = input(false);
  readonly loadingMore = input(false);
  readonly error = input<string | null>(null);
  readonly result = input<PatientSearchResult | null>(null);
  readonly resultSummary = input('');
  readonly query = input('');
  readonly initialEmptyTitle = input('Empieza una búsqueda');
  readonly initialEmptyMessage = input('');
  readonly noResultsTitle = input('No encontramos coincidencias');
  readonly noResultsMessage = input('');
  readonly hasActiveFilters = input(false);

  readonly retry = output<void>();
  readonly clearAllFilters = output<void>();
  readonly focusSearch = output<void>();
  readonly loadMore = output<void>();

  protected readonly formatCount = formatResultCount;
}
