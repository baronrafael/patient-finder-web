import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { HospitalFilter } from '../hospital-filter/hospital-filter';
import { PatientSearchFilters } from '../patient-search-filters/patient-search-filters';
import { Hospital } from '../../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../../models/location.model';
import { PatientFilters } from '../../models/patient-filters.model';
import { PatientSex } from '../../models/patient-sex.model';
import { PATIENT_SEARCH_MESSAGES } from '../../utils/patient-search.messages';

@Component({
  selector: 'app-optional-filters-panel',
  imports: [HospitalFilter, PatientSearchFilters],
  templateUrl: './optional-filters-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionalFiltersPanel {
  readonly expanded = input(false);
  readonly activeFilterCount = input(0);
  readonly collapsedSummary = input<string | null>(null);
  readonly hasActiveFilters = input(false);
  readonly showHospitalFilter = input(false);
  readonly hospitals = input.required<readonly Hospital[]>();
  readonly selectedHospitalId = input<string | null>(null);
  readonly estados = input.required<readonly Estado[]>();
  readonly municipios = input<readonly Municipio[]>([]);
  readonly parroquias = input<readonly Parroquia[]>([]);
  readonly selectedSex = input<PatientSex | null>(null);
  readonly selectedEstadoId = input<string | null>(null);
  readonly selectedMunicipioId = input<string | null>(null);
  readonly selectedParroquiaId = input<string | null>(null);

  readonly toggle = output<void>();
  readonly hospitalChange = output<string | null>();
  readonly filtersChange = output<PatientFilters>();

  readonly hint = PATIENT_SEARCH_MESSAGES.optionalFiltersHint;
}
