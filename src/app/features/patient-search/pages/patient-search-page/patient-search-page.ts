import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { OptionalFiltersPanel } from '../../components/optional-filters-panel/optional-filters-panel';
import { PatientActiveFilters } from '../../components/patient-active-filters/patient-active-filters';
import { PatientResultsPanel } from '../../components/patient-results-panel/patient-results-panel';
import { PatientSearchForm } from '../../components/patient-search-form/patient-search-form';
import { PatientSearchStore } from '../../state/patient-search.store';

@Component({
  selector: 'app-patient-search-page',
  imports: [
    AppHeader,
    OptionalFiltersPanel,
    PatientActiveFilters,
    PatientResultsPanel,
    PatientSearchForm,
  ],
  providers: [PatientSearchStore],
  templateUrl: './patient-search-page.html',
  styleUrl: './patient-search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientSearchPage {
  readonly store = inject(PatientSearchStore);
  readonly showMobileSearchFab = this.store.showMobileSearchFab;
}
