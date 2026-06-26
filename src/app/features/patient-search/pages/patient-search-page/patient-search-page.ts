import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';

import { mapHttpError } from '../../../../core/http/http-error.mapper';
import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { OptionalFiltersPanel } from '../../components/optional-filters-panel/optional-filters-panel';
import { PatientActiveFilters } from '../../components/patient-active-filters/patient-active-filters';
import { PatientResultsPanel } from '../../components/patient-results-panel/patient-results-panel';
import { PatientSearchForm } from '../../components/patient-search-form/patient-search-form';
import { ActiveFilterKey } from '../../models/active-filter-chip.model';
import { buildActiveFilterChips, summarizeFilterLabels } from '../../utils/build-active-filter-chips';
import { formatResultCount } from '../../utils/format-result-count';
import { PATIENT_SEARCH_MESSAGES } from '../../utils/patient-search.messages';
import { PATIENT_REPOSITORY } from '../../data-access/patient-repository.token';
import { Hospital } from '../../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../../models/location.model';
import { PatientFilters } from '../../models/patient-filters.model';
import { PatientSearchQuery } from '../../models/patient-search-query.model';
import { PatientSearchResult } from '../../models/patient-search-result.model';
import { PatientSex } from '../../models/patient-sex.model';
import { isSearchActive } from '../../utils/patient-search.matcher';
import {
  filterHospitalsByLocation,
  hospitalMatchesLocationFilter,
} from '../../utils/hospital-location.filter';
import { PATIENT_SEARCH_DEBOUNCE_MS, PATIENT_SEARCH_PAGE_SIZE, SLOW_SEARCH_THRESHOLD_MS } from '../../utils/patient-search.constants';

@Component({
  selector: 'app-patient-search-page',
  imports: [
    AppHeader,
    OptionalFiltersPanel,
    PatientActiveFilters,
    PatientResultsPanel,
    PatientSearchForm,
  ],
  templateUrl: './patient-search-page.html',
  styleUrl: './patient-search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientSearchPage {
  private readonly repository = inject(PATIENT_REPOSITORY);
  private readonly config = inject(APP_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchRequest$ = new Subject<void>();
  private queryDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private slowSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly scrollToResultsAfterSearch = signal(false);

  readonly query = signal('');
  readonly selectedHospitalId = signal<string | null>(null);
  readonly selectedSex = signal<PatientSex | null>(null);
  readonly selectedEstadoId = signal<string | null>(null);
  readonly selectedMunicipioId = linkedSignal<string | null, string | null>({
    source: this.selectedEstadoId,
    computation: () => null,
  });
  readonly selectedParroquiaId = linkedSignal<string | null, string | null>({
    source: this.selectedMunicipioId,
    computation: () => null,
  });
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly slowSearch = signal(false);
  readonly searchPending = signal(false);
  readonly optionalFiltersExpanded = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<PatientSearchResult | null>(null);
  readonly hasSearched = signal(false);
  readonly lastUpdatedAt = signal<string | null>(null);

  readonly hospitalsResource = rxResource({
    stream: () => this.repository.getHospitals(),
    defaultValue: [] as readonly Hospital[],
  });

  readonly estadosResource = rxResource({
    stream: () => this.repository.getEstados(),
    defaultValue: [] as readonly Estado[],
  });

  readonly municipiosResource = rxResource({
    params: () => this.selectedEstadoId(),
    stream: ({ params: estadoId }) => {
      if (!estadoId) {
        return of([] as readonly Municipio[]);
      }

      return this.repository.getMunicipios(estadoId);
    },
    defaultValue: [] as readonly Municipio[],
  });

  readonly parroquiasResource = rxResource({
    params: () => this.selectedMunicipioId(),
    stream: ({ params: municipioId }) => {
      if (!municipioId) {
        return of([] as readonly Parroquia[]);
      }

      return this.repository.getParroquias(municipioId);
    },
    defaultValue: [] as readonly Parroquia[],
  });

  readonly hospitals = computed(() => this.hospitalsResource.value());
  readonly availableHospitals = computed(() =>
    filterHospitalsByLocation(this.hospitals(), {
      estadoId: this.selectedEstadoId(),
      municipioId: this.selectedMunicipioId(),
      parroquiaId: this.selectedParroquiaId(),
    }),
  );
  readonly estados = computed(() => this.estadosResource.value());
  readonly municipios = computed(() => this.municipiosResource.value());
  readonly parroquias = computed(() => this.parroquiasResource.value());
  readonly showHospitalFilter = computed(() => this.hospitals().length > 0);

  readonly catalogError = computed(() => {
    const loadError =
      this.hospitalsResource.error() ??
      this.estadosResource.error() ??
      this.municipiosResource.error() ??
      this.parroquiasResource.error();
    return loadError ? mapHttpError(loadError) : null;
  });

  readonly formattedUpdatedAt = computed(() => {
    const updatedAt = this.lastUpdatedAt();
    if (!updatedAt) {
      return null;
    }

    return new Intl.DateTimeFormat('es-VE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Caracas',
    }).format(new Date(updatedAt));
  });

  readonly activeFilterChips = computed(() =>
    buildActiveFilterChips({
      hospitals: this.hospitals(),
      estados: this.estados(),
      municipios: this.municipios(),
      parroquias: this.parroquias(),
      hospitalId: this.selectedHospitalId(),
      sex: this.selectedSex(),
      estadoId: this.selectedEstadoId(),
      municipioId: this.selectedMunicipioId(),
      parroquiaId: this.selectedParroquiaId(),
    }),
  );

  readonly hasActiveFilters = computed(() => this.activeFilterChips().length > 0);

  readonly collapsedFiltersSummary = computed(() => summarizeFilterLabels(this.activeFilterChips()));

  readonly initialEmptyMessage = computed(() =>
    this.hasActiveFilters()
      ? PATIENT_SEARCH_MESSAGES.filtersWithQueryPending
      : PATIENT_SEARCH_MESSAGES.searchHintNoBrowse,
  );

  readonly noResultsMessage = computed(() => {
    const chips = this.activeFilterChips();
    if (chips.length === 0) {
      return PATIENT_SEARCH_MESSAGES.noResultsBase;
    }

    const filterLabels = chips.map((chip) => chip.label).join(' · ');
    return `Revisa la escritura o prueba variando los filtros activos (${filterLabels}).`;
  });

  readonly resultSummary = computed(() => {
    if (this.searchPending()) {
      return PATIENT_SEARCH_MESSAGES.preparingSearch;
    }

    if (this.loading()) {
      return PATIENT_SEARCH_MESSAGES.loadingResults;
    }

    const result = this.result();
    if (!this.hasSearched() || !result) {
      return this.hasActiveFilters()
        ? PATIENT_SEARCH_MESSAGES.filtersReady
        : PATIENT_SEARCH_MESSAGES.noActiveSearch;
    }

    return formatResultCount(result.total);
  });

  readonly showMobileResultsJump = computed(
    () => this.hasSearched() && !this.loading() && !this.searchPending(),
  );

  readonly mobileResultsJumpLabel = computed(() => {
    if (this.error()) {
      return 'Ir a resultados';
    }

    const result = this.result();
    if (!result || result.total === 0) {
      return 'Sin coincidencias — ver detalles';
    }

    return `Ir al listado (${formatResultCount(result.total)})`;
  });

  readonly disclaimer = PATIENT_SEARCH_MESSAGES.disclaimer;

  constructor() {
    this.setupSearchPipeline();
    this.setupResultsScroll();
    this.destroyRef.onDestroy(() => {
      this.clearDebouncedSearch();
      this.clearSlowSearchTimer();
    });
    this.loadDatasetMetadata();
  }

  updateQuery(query: string): void {
    this.query.set(query);
    this.page.set(1);

    if (query.trim() === '') {
      this.clearDebouncedSearch();
      this.hasSearched.set(false);
      this.result.set(null);
      this.error.set(null);
      this.resetSelectionFilters();
      return;
    }

    if (!isSearchActive(query)) {
      this.clearDebouncedSearch();
      this.hasSearched.set(false);
      this.result.set(null);
      this.error.set(null);
      return;
    }

    this.scheduleDebouncedSearch();
  }

  updateHospital(hospitalId: string | null): void {
    this.selectedHospitalId.set(hospitalId);
    this.page.set(1);
    this.runSearchIfActive();
  }

  updateFilters(filters: PatientFilters): void {
    this.selectedSex.set(filters.sex);
    this.selectedEstadoId.set(filters.estadoId);
    this.selectedMunicipioId.set(filters.municipioId);
    this.selectedParroquiaId.set(filters.parroquiaId);
    this.resetHospitalIfOutsideLocation();
    this.page.set(1);
    this.runSearchIfActive();
  }

  submitSearch(): void {
    this.clearDebouncedSearch();
    this.page.set(1);
    this.scrollToResultsAfterSearch.set(true);
    this.runSearch(true);
  }

  clearSearch(): void {
    this.clearDebouncedSearch();
    this.query.set('');
    this.resetSelectionFilters();
    this.page.set(1);
    this.hasSearched.set(false);
    this.result.set(null);
    this.error.set(null);
  }

  toggleOptionalFilters(): void {
    this.optionalFiltersExpanded.update((expanded) => !expanded);
  }

  clearFilter(key: ActiveFilterKey): void {
    switch (key) {
      case 'hospital':
        this.updateHospital(null);
        return;
      case 'sex':
        this.selectedSex.set(null);
        break;
      case 'estado':
        this.selectedEstadoId.set(null);
        this.resetHospitalIfOutsideLocation();
        break;
      case 'municipio':
        this.selectedMunicipioId.set(null);
        this.resetHospitalIfOutsideLocation();
        break;
      case 'parroquia':
        this.selectedParroquiaId.set(null);
        this.resetHospitalIfOutsideLocation();
        break;
    }

    this.page.set(1);
    this.runSearchIfActive();
  }

  clearAllFilters(): void {
    this.resetSelectionFilters();
    this.page.set(1);
    this.runSearchIfActive();
  }

  loadMore(): void {
    this.page.update((page) => page + 1);
    this.runSearch(true);
  }

  retry(): void {
    this.runSearch(this.hasSearched());
  }

  focusSearchInput(): void {
    document.getElementById('patient-search-query')?.focus({ preventScroll: true });
  }

  goToResults(): void {
    this.scrollToResults();
  }

  private setupSearchPipeline(): void {
    this.searchRequest$
      .pipe(
        switchMap(() => {
          const query = this.query();
          if (!isSearchActive(query)) {
            return EMPTY;
          }

          this.hasSearched.set(true);
          this.error.set(null);
          this.clearSlowSearchTimer();
          this.slowSearch.set(false);

          if (this.page() > 1) {
            this.loadingMore.set(true);
          } else {
            this.loading.set(true);
          }

          this.slowSearchTimer = setTimeout(() => this.slowSearch.set(true), SLOW_SEARCH_THRESHOLD_MS);

          return this.repository.search(this.buildSearchQuery()).pipe(
            tap((searchResult) => {
              this.applySearchResult(searchResult);
              this.lastUpdatedAt.set(searchResult.updatedAt);
            }),
            catchError((searchError: unknown) => {
              if (this.page() > 1) {
                this.page.update((page) => page - 1);
              }
              this.error.set(mapHttpError(searchError));
              return EMPTY;
            }),
            finalize(() => {
              this.clearSlowSearchTimer();
              this.slowSearch.set(false);
              this.loading.set(false);
              this.loadingMore.set(false);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private setupResultsScroll(): void {
    effect(() => {
      const shouldScroll = this.scrollToResultsAfterSearch();
      const isLoading = this.loading();
      const isPending = this.searchPending();

      if (!shouldScroll || isLoading || isPending || !this.hasSearched()) {
        return;
      }

      untracked(() => this.scrollToResultsAfterSearch.set(false));
      this.scrollToResults();
    });
  }

  private scrollToResults(): void {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    requestAnimationFrame(() => {
      document.getElementById('results-heading')?.scrollIntoView?.({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  private clearSlowSearchTimer(): void {
    if (this.slowSearchTimer !== null) {
      clearTimeout(this.slowSearchTimer);
      this.slowSearchTimer = null;
    }
  }

  private scheduleDebouncedSearch(): void {
    this.clearDebouncedSearch();
    this.searchPending.set(true);
    this.queryDebounceTimer = setTimeout(() => {
      this.queryDebounceTimer = null;
      this.searchPending.set(false);
      this.runSearch();
    }, PATIENT_SEARCH_DEBOUNCE_MS);
  }

  private clearDebouncedSearch(): void {
    if (this.queryDebounceTimer !== null) {
      clearTimeout(this.queryDebounceTimer);
      this.queryDebounceTimer = null;
    }

    this.searchPending.set(false);
  }

  private loadDatasetMetadata(): void {
    if (!this.config.useMockData) {
      return;
    }

    this.repository
      .search(this.buildSearchQuery(''))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (searchResult) => this.lastUpdatedAt.set(searchResult.updatedAt),
        error: () => undefined,
      });
  }

  private runSearch(force = false): void {
    if (!isSearchActive(this.query())) {
      if (force) {
        this.hasSearched.set(true);
        this.result.set(null);
      }
      return;
    }

    this.hasSearched.set(true);
    this.searchRequest$.next();
  }

  private runSearchIfActive(): void {
    if (!isSearchActive(this.query())) {
      return;
    }

    this.runSearch();
  }

  private resetSelectionFilters(): void {
    this.selectedHospitalId.set(null);
    this.selectedSex.set(null);
    this.selectedEstadoId.set(null);
  }

  private resetHospitalIfOutsideLocation(): void {
    const hospitalId = this.selectedHospitalId();
    if (!hospitalId) {
      return;
    }

    const hospital = this.hospitals().find((item) => item.id === hospitalId);
    if (
      !hospital ||
      !hospitalMatchesLocationFilter(hospital, {
        estadoId: this.selectedEstadoId(),
        municipioId: this.selectedMunicipioId(),
        parroquiaId: this.selectedParroquiaId(),
      })
    ) {
      this.selectedHospitalId.set(null);
    }
  }

  private buildSearchQuery(query = this.query()): PatientSearchQuery {
    return {
      query,
      hospitalId: this.selectedHospitalId(),
      sex: this.selectedSex(),
      estadoId: this.selectedEstadoId(),
      municipioId: this.selectedMunicipioId(),
      parroquiaId: this.selectedParroquiaId(),
      page: this.page(),
      pageSize: PATIENT_SEARCH_PAGE_SIZE,
    };
  }

  private applySearchResult(searchResult: PatientSearchResult): void {
    if (this.page() <= 1) {
      this.result.set(searchResult);
      return;
    }

    const previous = this.result();
    if (!previous) {
      this.result.set(searchResult);
      return;
    }

    const seenIds = new Set(previous.items.map((item) => item.id));
    const nextItems = searchResult.items.filter((item) => !seenIds.has(item.id));

    this.result.set({
      ...searchResult,
      items: [...previous.items, ...nextItems],
    });
  }
}
