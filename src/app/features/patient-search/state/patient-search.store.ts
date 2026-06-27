import { DestroyRef, Injectable, afterNextRender, computed, effect, inject, linkedSignal, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { formatUserDateTime } from '../../../core/i18n/format-user-datetime.util';
import { mapHttpError } from '../../../core/http/http-error.mapper';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { ActiveFilterKey } from '../models/active-filter-chip.model';
import { buildActiveFilterChips, summarizeFilterLabels } from '../utils/build-active-filter-chips';
import { formatResultCount } from '../utils/format-result-count';
import { formatResultProgress } from '../utils/format-result-progress';
import { PATIENT_SEARCH_MESSAGES } from '../utils/patient-search.messages';
import { PATIENT_REPOSITORY } from '../data-access/patient-repository.token';
import { Hospital } from '../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../models/location.model';
import { PatientFilters } from '../models/patient-filters.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSearchResult } from '../models/patient-search-result.model';
import { PatientSearchStats } from '../models/patient-search-stats.model';
import { PatientSex } from '../models/patient-sex.model';
import {
  enrichPatientsWithMatchConfidence,
  resolveSearchMaxScoreFromItems,
} from '../utils/match-score.utils';
import { isSearchActive } from '../utils/patient-search.matcher';
import {
  filterHospitalsByLocation,
  hospitalMatchesLocationFilter,
} from '../utils/hospital-location.filter';
import {
  PATIENT_SEARCH_DEBOUNCE_MS,
  PATIENT_SEARCH_PAGE_SIZE,
  SLOW_SEARCH_THRESHOLD_MS,
} from '../utils/patient-search.constants';
import {
  hasPatientSearchUrlState,
  parsePatientSearchUrlParams,
  patientSearchUrlParamsMatch,
  serializePatientSearchUrlParams,
} from '../utils/patient-search-url';

@Injectable()
export class PatientSearchStore {
  private readonly repository = inject(PATIENT_REPOSITORY);
  private readonly config = inject(APP_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searchRequest$ = new Subject<void>();
  private queryDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private slowSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly scrollToResultsAfterSearch = signal(false);
  private searchFabMediaQuery: MediaQueryList | null = null;
  private searchFabMediaHandler: (() => void) | null = null;
  private searchFabScrollHandler: (() => void) | null = null;
  private mobileSearchFabInitialized = false;
  private shareLinkFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

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
  readonly filtersCatalogLoaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<PatientSearchResult | null>(null);
  readonly hasSearched = signal(false);
  readonly stats = signal<PatientSearchStats | null>(null);
  private readonly searchMaxScore = signal<number | null>(null);

  readonly hospitalsResource = rxResource({
    params: () => this.filtersCatalogLoaded(),
    stream: ({ params: loadCatalog }) => {
      if (!loadCatalog) {
        return of([] as readonly Hospital[]);
      }

      return this.repository.getHospitals();
    },
    defaultValue: [] as readonly Hospital[],
  });

  readonly estadosResource = rxResource({
    params: () => this.filtersCatalogLoaded(),
    stream: ({ params: loadCatalog }) => {
      if (!loadCatalog) {
        return of([] as readonly Estado[]);
      }

      return this.repository.getEstados();
    },
    defaultValue: [] as readonly Estado[],
  });

  readonly municipiosResource = rxResource({
    params: () => ({
      loadCatalog: this.filtersCatalogLoaded(),
      estadoId: this.selectedEstadoId(),
    }),
    stream: ({ params }) => {
      if (!params.loadCatalog || !params.estadoId) {
        return of([] as readonly Municipio[]);
      }

      return this.repository.getMunicipios(params.estadoId);
    },
    defaultValue: [] as readonly Municipio[],
  });

  readonly parroquiasResource = rxResource({
    params: () => ({
      loadCatalog: this.filtersCatalogLoaded(),
      municipioId: this.selectedMunicipioId(),
    }),
    stream: ({ params }) => {
      if (!params.loadCatalog || !params.municipioId) {
        return of([] as readonly Parroquia[]);
      }

      return this.repository.getParroquias(params.municipioId);
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
  readonly filtersCatalogLoading = computed(
    () =>
      this.filtersCatalogLoaded() &&
      (this.hospitalsResource.isLoading() || this.estadosResource.isLoading()),
  );
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
    const updatedAt = this.stats()?.lastUpdatedAt;
    if (!updatedAt) {
      return null;
    }

    return formatUserDateTime(updatedAt);
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

  readonly resultProgress = computed(() => {
    if (this.searchPending() || this.loading()) {
      return null;
    }

    const result = this.result();
    if (!this.hasSearched() || !result || result.total === 0) {
      return null;
    }

    return formatResultProgress(result.items.length, result.total);
  });

  readonly canShareSearchLink = computed(
    () => this.hasSearched() && isSearchActive(this.query()) && !this.loading() && !this.searchPending(),
  );

  readonly showMobileResultsJump = computed(
    () => this.hasSearched() && !this.loading() && !this.searchPending(),
  );

  readonly showMobileSearchFab = signal(false);
  readonly shareLinkFeedback = signal<string | null>(null);

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
    this.hydrateFromUrl();
    this.setupResultsScroll();
    this.destroyRef.onDestroy(() => {
      this.clearDebouncedSearch();
      this.clearSlowSearchTimer();
      this.teardownMobileSearchFab();
      if (this.shareLinkFeedbackTimer !== null) {
        clearTimeout(this.shareLinkFeedbackTimer);
      }
    });
    this.loadDatasetMetadata();
    afterNextRender(() => this.setupMobileSearchFab());
  }

  updateQuery(query: string): void {
    this.query.set(query);
    this.page.set(1);

    if (query.trim() === '') {
      this.clearDebouncedSearch();
      this.hasSearched.set(false);
      this.result.set(null);
      this.resetSearchMaxScore();
      this.error.set(null);
      this.resetSelectionFilters();
      this.syncUrlToState();
      return;
    }

    if (!isSearchActive(query)) {
      this.clearDebouncedSearch();
      this.hasSearched.set(false);
      this.result.set(null);
      this.resetSearchMaxScore();
      this.error.set(null);
      this.syncUrlToState();
      return;
    }

    this.scheduleDebouncedSearch();
  }

  updateHospital(hospitalId: string | null): void {
    this.selectedHospitalId.set(hospitalId);
    this.page.set(1);
    this.syncUrlToState();
    this.runSearchIfActive();
  }

  updateFilters(filters: PatientFilters): void {
    this.selectedSex.set(filters.sex);
    this.selectedEstadoId.set(filters.estadoId);
    this.selectedMunicipioId.set(filters.municipioId);
    this.selectedParroquiaId.set(filters.parroquiaId);
    this.resetHospitalIfOutsideLocation();
    this.page.set(1);
    this.syncUrlToState();
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
    this.resetSearchMaxScore();
    this.error.set(null);
    this.syncUrlToState();
  }

  toggleOptionalFilters(): void {
    this.optionalFiltersExpanded.update((expanded) => {
      const nextExpanded = !expanded;
      if (nextExpanded) {
        this.filtersCatalogLoaded.set(true);
      }
      return nextExpanded;
    });
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
    this.syncUrlToState();
    this.runSearchIfActive();
  }

  clearAllFilters(): void {
    this.resetSelectionFilters();
    this.page.set(1);
    this.syncUrlToState();
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

  goToSearch(): void {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    requestAnimationFrame(() => {
      document.getElementById('patient-search-panel')?.scrollIntoView?.({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      requestAnimationFrame(() => this.focusSearchInput());
    });
  }

  async copySearchLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.buildShareableSearchUrl());
      this.showShareLinkFeedback(PATIENT_SEARCH_MESSAGES.searchLinkCopied);
    } catch {
      this.showShareLinkFeedback(PATIENT_SEARCH_MESSAGES.searchLinkCopyFailed);
    }
  }

  private showShareLinkFeedback(message: string): void {
    if (this.shareLinkFeedbackTimer !== null) {
      clearTimeout(this.shareLinkFeedbackTimer);
    }

    this.shareLinkFeedback.set(message);
    this.shareLinkFeedbackTimer = setTimeout(() => {
      this.shareLinkFeedback.set(null);
      this.shareLinkFeedbackTimer = null;
    }, 3000);
  }

  private buildShareableSearchUrl(): string {
    const tree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: serializePatientSearchUrlParams(this.buildSearchQuery()),
    });
    const path = this.router.serializeUrl(tree);

    if (typeof window === 'undefined') {
      return path;
    }

    return `${window.location.origin}${path}`;
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

          return this.resolveSearchRequest(this.buildSearchQuery()).pipe(
            tap((searchResult) => {
              this.applySearchResult(searchResult);
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

  private setupMobileSearchFab(): void {
    if (typeof window === 'undefined' || this.mobileSearchFabInitialized) {
      return;
    }

    this.mobileSearchFabInitialized = true;
    this.searchFabMediaQuery = window.matchMedia('(max-width: 1023px)');

    this.searchFabScrollHandler = () => this.updateMobileSearchFab();
    document.addEventListener('scroll', this.searchFabScrollHandler, { passive: true, capture: true });
    window.addEventListener('resize', this.searchFabScrollHandler, { passive: true });

    this.searchFabMediaHandler = () => this.updateMobileSearchFab();
    this.searchFabMediaQuery.addEventListener('change', this.searchFabMediaHandler);

    effect(() => {
      this.hasSearched();
      this.loading();
      this.searchPending();

      untracked(() => {
        requestAnimationFrame(() => this.updateMobileSearchFab());
      });
    });
  }

  private updateMobileSearchFab(): void {
    if (!this.searchFabMediaQuery?.matches || !this.hasSearched()) {
      this.showMobileSearchFab.set(false);
      return;
    }

    const searchAnchor =
      document.getElementById('patient-search-query') ??
      document.getElementById('patient-search-panel');
    const resultsHeading = document.getElementById('results-heading');

    if (!searchAnchor || !resultsHeading) {
      this.showMobileSearchFab.set(false);
      return;
    }

    const searchBottom = searchAnchor.getBoundingClientRect().bottom;
    const resultsTop = resultsHeading.getBoundingClientRect().top;
    const showFab = searchBottom < 72 && resultsTop < window.innerHeight;

    this.showMobileSearchFab.set(showFab);
  }

  private teardownMobileSearchFab(): void {
    if (this.searchFabScrollHandler) {
      document.removeEventListener('scroll', this.searchFabScrollHandler, { capture: true });
      window.removeEventListener('resize', this.searchFabScrollHandler);
      this.searchFabScrollHandler = null;
    }

    if (this.searchFabMediaQuery && this.searchFabMediaHandler) {
      this.searchFabMediaQuery.removeEventListener('change', this.searchFabMediaHandler);
    }

    this.searchFabMediaQuery = null;
    this.searchFabMediaHandler = null;
    this.mobileSearchFabInitialized = false;
    this.showMobileSearchFab.set(false);
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
      requestAnimationFrame(() => this.updateMobileSearchFab());
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
    this.repository
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.stats.set(stats),
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

    this.syncUrlToState();
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
    const maxScore = resolveSearchMaxScoreFromItems(
      searchResult.items,
      searchResult.page,
      this.searchMaxScore(),
    );
    this.searchMaxScore.set(maxScore);

    const enrichedResult: PatientSearchResult = {
      ...searchResult,
      items: enrichPatientsWithMatchConfidence(searchResult.items, maxScore),
    };

    if (this.page() <= 1) {
      this.result.set(enrichedResult);
      return;
    }

    const previous = this.result();
    if (!previous) {
      this.result.set(enrichedResult);
      return;
    }

    const seenIds = new Set(previous.items.map((item) => item.id));
    const nextItems = enrichedResult.items.filter((item) => !seenIds.has(item.id));

    this.result.set({
      ...enrichedResult,
      items: [...previous.items, ...nextItems],
    });
  }

  private resolveSearchRequest(query: PatientSearchQuery) {
    const needsMaxScore = query.page > 1 && this.searchMaxScore() == null;

    if (!needsMaxScore) {
      return this.repository.search(query);
    }

    const maxScoreQuery: PatientSearchQuery = {
      ...query,
      page: 1,
      pageSize: 1,
    };

    return forkJoin({
      searchResult: this.repository.search(query),
      maxScoreResult: this.repository.search(maxScoreQuery),
    }).pipe(
      map(({ searchResult, maxScoreResult }) => {
        const maxScore = maxScoreResult.items[0]?.score ?? null;
        if (maxScore != null) {
          this.searchMaxScore.set(maxScore);
        }

        return searchResult;
      }),
    );
  }

  private resetSearchMaxScore(): void {
    this.searchMaxScore.set(null);
  }

  private hydrateFromUrl(): void {
    const snapshot = this.route.snapshot.queryParamMap;
    if (!hasPatientSearchUrlState(snapshot)) {
      return;
    }

    const parsed = parsePatientSearchUrlParams(snapshot);
    const hasFilters =
      parsed.hospitalId !== null ||
      parsed.sex !== null ||
      parsed.estadoId !== null ||
      parsed.municipioId !== null ||
      parsed.parroquiaId !== null;

    if (hasFilters) {
      this.filtersCatalogLoaded.set(true);
    }

    this.selectedHospitalId.set(parsed.hospitalId);
    this.selectedSex.set(parsed.sex);
    this.selectedEstadoId.set(parsed.estadoId);
    this.selectedMunicipioId.set(parsed.municipioId);
    this.selectedParroquiaId.set(parsed.parroquiaId);
    this.page.set(parsed.page);
    this.query.set(parsed.query);

    if (isSearchActive(parsed.query)) {
      this.runSearch();
    }
  }

  private syncUrlToState(): void {
    const nextParams = serializePatientSearchUrlParams(this.buildSearchQuery());
    const currentParams = this.route.snapshot.queryParamMap;

    if (patientSearchUrlParamsMatch(currentParams, nextParams)) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: nextParams,
      replaceUrl: true,
    });
  }
}
