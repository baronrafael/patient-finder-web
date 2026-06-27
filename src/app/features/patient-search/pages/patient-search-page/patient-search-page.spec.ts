import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { Observable, delay, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { PATIENT_REPOSITORY } from '../../data-access/patient-repository.token';
import { PatientRepository } from '../../data-access/patient.repository';
import { Hospital } from '../../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../../models/location.model';
import { PatientRecord } from '../../models/patient-record.model';
import { PatientSearchQuery } from '../../models/patient-search-query.model';
import { PatientSearchResult } from '../../models/patient-search-result.model';
import { PatientSearchStats } from '../../models/patient-search-stats.model';
import { patientSearchRoutes } from '../../patient-search.routes';
import { PATIENT_SEARCH_DEBOUNCE_MS, PATIENT_SEARCH_PAGE_SIZE } from '../../utils/patient-search.constants';
import { PatientSearchPage } from './patient-search-page';

const updatedAt = '2026-06-25T20:00:00-04:00';

function createPatient(id: string, score: number | null = null): PatientRecord {
  return {
    id,
    sourceRow: 0,
    fullName: `PACIENTE ${id}`,
    age: null,
    identityDocument: null,
    phone: null,
    address: null,
    observations: null,
    hospitalId: 'hospital-a',
    hospitalName: 'Hospital A',
    sourceHospitalName: 'Hospital A',
    score,
    matchConfidence: null,
  };
}

function createSearchResult(page: number, ids: readonly string[]): PatientSearchResult {
  return {
    items: ids.map((id, index) =>
      createPatient(id, page === 1 ? 100 - index * 5 : 70 - index * 5),
    ),
    total: 40,
    page,
    pageSize: PATIENT_SEARCH_PAGE_SIZE,
    hasMore: page < 2,
    updatedAt,
  };
}

class TestPatientRepository extends PatientRepository {
  searchCalls = 0;
  hospitalsCalls = 0;
  estadosCalls = 0;
  lastQuery: PatientSearchQuery | null = null;

  override getHospitals(): Observable<readonly Hospital[]> {
    this.hospitalsCalls += 1;
    return of([]);
  }

  override getEstados(): Observable<readonly Estado[]> {
    this.estadosCalls += 1;
    return of([]);
  }

  override getMunicipios(_estadoId: string): Observable<readonly Municipio[]> {
    return of([]);
  }

  override getParroquias(_municipioId: string): Observable<readonly Parroquia[]> {
    return of([]);
  }

  override getStats(): Observable<PatientSearchStats | null> {
    return of({
      totalPersons: 3133,
      totalCenters: 13,
      lastUpdatedAt: updatedAt,
    });
  }

  override search(query: PatientSearchQuery): Observable<PatientSearchResult> {
    this.searchCalls += 1;
    this.lastQuery = query;

    if (query.page === 1) {
      return of(createSearchResult(1, ['1', '2']));
    }

    return of(createSearchResult(2, ['3', '4']));
  }
}

describe('PatientSearchPage', () => {
  let repository: TestPatientRepository;
  let router: Router;

  beforeEach(async () => {
    repository = new TestPatientRepository();

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    await TestBed.configureTestingModule({
      imports: [PatientSearchPage],
      providers: [
        provideRouter(patientSearchRoutes),
        provideHttpClient(),
        { provide: PATIENT_REPOSITORY, useValue: repository },
        {
          provide: APP_CONFIG,
          useValue: {
            useMockData: true,
            mockDataUrl: '/data/patients.mock.json',
            locationsMockUrl: '/data/locations.mock.json',
            apiBaseUrl: 'http://localhost:3000',
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createPage(): PatientSearchPage {
    const fixture = TestBed.createComponent(PatientSearchPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('does not load filter catalogs until optional filters are opened', () => {
    const fixture = TestBed.createComponent(PatientSearchPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;

    expect(repository.hospitalsCalls).toBe(0);
    expect(repository.estadosCalls).toBe(0);

    page.store.toggleOptionalFilters();
    fixture.detectChanges();

    expect(repository.hospitalsCalls).toBe(1);
    expect(repository.estadosCalls).toBe(1);
  });

  it('shows filter catalog loading state while states and centers load', async () => {
    repository.getHospitals = () => {
      repository.hospitalsCalls += 1;
      return of([]).pipe(delay(50));
    };
    repository.getEstados = () => {
      repository.estadosCalls += 1;
      return of([]).pipe(delay(50));
    };

    const fixture = TestBed.createComponent(PatientSearchPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;

    page.store.toggleOptionalFilters();
    fixture.detectChanges();

    expect(page.store.filtersCatalogLoading()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 60));
    fixture.detectChanges();

    expect(page.store.filtersCatalogLoading()).toBe(false);
    expect(repository.hospitalsCalls).toBe(1);
    expect(repository.estadosCalls).toBe(1);
  });

  it('keeps location filters when typing a partial query', () => {
    const page = createPage();
    const store = page.store;

    store.updateFilters({
      sex: null,
      estadoId: 'miranda',
      municipioId: 'chacao',
      parroquiaId: null,
    });
    store.updateQuery('G');

    expect(store.selectedEstadoId()).toBe('miranda');
    expect(store.selectedMunicipioId()).toBe('chacao');
    expect(repository.searchCalls).toBe(0);
  });

  it('resets filters only when the query becomes empty', () => {
    const page = createPage();
    const store = page.store;

    store.updateFilters({
      sex: null,
      estadoId: 'miranda',
      municipioId: null,
      parroquiaId: null,
    });
    store.updateQuery('');

    expect(store.selectedEstadoId()).toBeNull();
    expect(store.query()).toBe('');
  });

  it('debounces text search until the debounce window passes', async () => {
    vi.useFakeTimers();
    await router.navigateByUrl('/');
    const page = createPage();
    const store = page.store;
    const initialCalls = repository.searchCalls;

    store.updateQuery('Garcia');

    expect(repository.searchCalls).toBe(initialCalls);

    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);
    await vi.runOnlyPendingTimersAsync();

    expect(repository.searchCalls).toBe(initialCalls + 1);
    expect(repository.lastQuery?.query).toBe('Garcia');
    expect(router.url).toContain('q=Garcia');
  });

  it('hydrates search state from url query params and runs the search', async () => {
    await router.navigateByUrl('/?q=Garcia&sex=f&estado_id=miranda');

    const fixture = TestBed.createComponent(PatientSearchPage);
    fixture.detectChanges();
    const store = fixture.componentInstance.store;

    await vi.waitFor(() => expect(store.result()?.items).toHaveLength(2));

    expect(store.query()).toBe('Garcia');
    expect(store.selectedSex()).toBe('f');
    expect(store.selectedEstadoId()).toBe('miranda');
    expect(store.filtersCatalogLoaded()).toBe(true);
    expect(store.hasSearched()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('clears url query params when search is cleared', async () => {
    vi.useFakeTimers();
    await router.navigateByUrl('/');
    const page = createPage();
    const store = page.store;

    store.updateQuery('Garcia');
    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);
    await vi.runOnlyPendingTimersAsync();

    expect(router.url).toContain('q=Garcia');

    store.clearSearch();
    await vi.runOnlyPendingTimersAsync();

    expect(router.url).not.toContain('q=');
  });

  it('runs submit immediately and cancels a pending debounced search', () => {
    vi.useFakeTimers();
    const page = createPage();
    const store = page.store;
    const initialCalls = repository.searchCalls;

    store.updateQuery('Garcia');
    store.submitSearch();

    expect(repository.searchCalls).toBe(initialCalls + 1);

    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);

    expect(repository.searchCalls).toBe(initialCalls + 1);
  });

  it('applies pending filters when the query becomes active', () => {
    vi.useFakeTimers();
    const page = createPage();
    const store = page.store;

    store.updateFilters({
      sex: 'f',
      estadoId: 'miranda',
      municipioId: null,
      parroquiaId: null,
    });
    store.updateQuery('Garcia');

    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);

    expect(repository.lastQuery).toEqual(
      expect.objectContaining({
        query: 'Garcia',
        sex: 'f',
        estadoId: 'miranda',
      }),
    );
  });

  it('appends results when loading more pages', async () => {
    vi.useFakeTimers();
    const page = createPage();
    const store = page.store;

    store.updateQuery('Garcia');
    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);
    await vi.waitFor(() => expect(store.result()?.items).toHaveLength(2));

    store.loadMore();
    await vi.waitFor(() => expect(store.result()?.items).toHaveLength(4));

    expect(store.result()?.items.map((patient) => patient.id)).toEqual(['1', '2', '3', '4']);
    expect(repository.lastQuery?.page).toBe(2);
  });
});
