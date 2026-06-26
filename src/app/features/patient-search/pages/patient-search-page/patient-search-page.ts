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
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { ActiveFilterChip, ActiveFilterKey } from '../../models/active-filter-chip.model';
import { HospitalFilter } from '../../components/hospital-filter/hospital-filter';
import { PatientActiveFilters } from '../../components/patient-active-filters/patient-active-filters';
import { PatientResultsList } from '../../components/patient-results-list/patient-results-list';
import { PatientSearchFilters } from '../../components/patient-search-filters/patient-search-filters';
import { PatientSearchForm } from '../../components/patient-search-form/patient-search-form';
import { PATIENT_REPOSITORY } from '../../data-access/patient-repository.token';
import { Hospital } from '../../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../../models/location.model';
import { PatientFilters } from '../../models/patient-filters.model';
import { PatientSearchQuery } from '../../models/patient-search-query.model';
import { PatientSearchResult } from '../../models/patient-search-result.model';
import { PatientSex } from '../../models/patient-sex.model';
import { isSearchActive } from '../../utils/patient-search.matcher';
import { PATIENT_SEARCH_DEBOUNCE_MS, PATIENT_SEARCH_PAGE_SIZE, SLOW_SEARCH_THRESHOLD_MS } from '../../utils/patient-search.constants';

@Component({
  selector: 'app-patient-search-page',
  imports: [
    AppHeader,
    EmptyState,
    ErrorState,
    HospitalFilter,
    LoadingSkeleton,
    PatientActiveFilters,
    PatientResultsList,
    PatientSearchFilters,
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
    stream: () => {
      const estadoId = this.selectedEstadoId();
      if (!estadoId) {
        return of([] as readonly Municipio[]);
      }

      return this.repository.getMunicipios(estadoId);
    },
    defaultValue: [] as readonly Municipio[],
  });

  readonly parroquiasResource = rxResource({
    stream: () => {
      const municipioId = this.selectedMunicipioId();
      if (!municipioId) {
        return of([] as readonly Parroquia[]);
      }

      return this.repository.getParroquias(municipioId);
    },
    defaultValue: [] as readonly Parroquia[],
  });

  readonly hospitals = computed(() => this.hospitalsResource.value());
  readonly estados = computed(() => this.estadosResource.value());
  readonly municipios = computed(() => this.municipiosResource.value());
  readonly parroquias = computed(() => this.parroquiasResource.value());
  readonly showHospitalFilter = computed(() => this.hospitals().length > 0);

  readonly catalogError = computed(() => {
    const loadError = this.hospitalsResource.error() ?? this.estadosResource.error();
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

  readonly activeFilterChips = computed(() => {
    const chips: ActiveFilterChip[] = [];

    const hospitalId = this.selectedHospitalId();
    if (hospitalId) {
      const hospital = this.hospitals().find((item) => item.id === hospitalId);
      if (hospital) {
        chips.push({ key: 'hospital', label: hospital.name });
      }
    }

    const sex = this.selectedSex();
    if (sex === 'm') {
      chips.push({ key: 'sex', label: 'Masculino' });
    }
    if (sex === 'f') {
      chips.push({ key: 'sex', label: 'Femenino' });
    }

    const estadoId = this.selectedEstadoId();
    if (estadoId) {
      const estado = this.estados().find((item) => item.id === estadoId);
      if (estado) {
        chips.push({ key: 'estado', label: estado.name });

        const municipioId = this.selectedMunicipioId();
        if (municipioId) {
          const municipio = this.municipios().find((item) => item.id === municipioId);
          if (municipio) {
            chips.push({ key: 'municipio', label: municipio.name });

            const parroquiaId = this.selectedParroquiaId();
            if (parroquiaId) {
              const parroquia = this.parroquias().find((item) => item.id === parroquiaId);
              if (parroquia) {
                chips.push({ key: 'parroquia', label: parroquia.name });
              }
            }
          }
        }
      }
    }

    return chips;
  });

  readonly hasActiveFilters = computed(() => this.activeFilterChips().length > 0);

  readonly collapsedFiltersSummary = computed(() => {
    const labels = this.activeFilterChips().map((chip) => chip.label);
    if (!labels.length) {
      return null;
    }

    const joined = labels.join(' · ');
    return joined.length > 52 ? `${joined.slice(0, 49)}…` : joined;
  });

  readonly initialEmptyMessage = computed(() => {
    if (this.hasActiveFilters()) {
      return 'Tienes filtros seleccionados. Escribe al menos dos letras del nombre o cuatro dígitos de la cédula para buscar.';
    }

    return 'Escribe al menos dos letras del nombre o cuatro dígitos de la cédula. No mostramos todos los registros al entrar.';
  });

  readonly noResultsMessage = computed(() => {
    const chips = this.activeFilterChips();
    if (chips.length === 0) {
      return 'Revisa la escritura o prueba solo con un apellido.';
    }

    const filterLabels = chips.map((chip) => chip.label).join(' · ');
    return `Revisa la escritura o prueba variando los filtros activos (${filterLabels}).`;
  });

  readonly resultSummary = computed(() => {
    if (this.searchPending()) {
      return 'Preparando búsqueda...';
    }

    if (this.loading()) {
      return 'Cargando resultados...';
    }

    const result = this.result();
    if (!this.hasSearched() || !result) {
      return this.hasActiveFilters()
        ? 'Filtros listos. Escribe para buscar.'
        : 'Sin búsqueda activa.';
    }

    return `${result.total} coincidencia${result.total === 1 ? '' : 's'}`;
  });

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
    this.page.set(1);
    this.runSearchIfActive();
  }

  submitSearch(): void {
    this.clearDebouncedSearch();
    this.page.set(1);
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
        break;
      case 'municipio':
        this.selectedMunicipioId.set(null);
        break;
      case 'parroquia':
        this.selectedParroquiaId.set(null);
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
    document.getElementById('patient-search-query')?.focus();
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
              this.result.set(searchResult);
              this.lastUpdatedAt.set(searchResult.updatedAt);
              if (this.page() === 1) {
                this.scrollToResultsAfterSearch.set(true);
              }
            }),
            catchError((searchError: unknown) => {
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
}
