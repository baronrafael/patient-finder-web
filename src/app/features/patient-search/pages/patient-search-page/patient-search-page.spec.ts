import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { PATIENT_REPOSITORY } from '../../data-access/patient-repository.token';
import { PatientRepository } from '../../data-access/patient.repository';
import { Hospital } from '../../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../../models/location.model';
import { PatientRecord } from '../../models/patient-record.model';
import { PatientSearchQuery } from '../../models/patient-search-query.model';
import { PatientSearchResult } from '../../models/patient-search-result.model';
import { PATIENT_SEARCH_DEBOUNCE_MS, PATIENT_SEARCH_PAGE_SIZE } from '../../utils/patient-search.constants';
import { PatientSearchPage } from './patient-search-page';

const updatedAt = '2026-06-25T20:00:00-04:00';

function createPatient(id: string): PatientRecord {
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
  };
}

function createSearchResult(page: number, ids: readonly string[]): PatientSearchResult {
  return {
    items: ids.map(createPatient),
    total: 40,
    page,
    pageSize: PATIENT_SEARCH_PAGE_SIZE,
    hasMore: page < 2,
    updatedAt,
  };
}

class TestPatientRepository extends PatientRepository {
  searchCalls = 0;
  lastQuery: PatientSearchQuery | null = null;

  override getHospitals(): Observable<readonly Hospital[]> {
    return of([]);
  }

  override getEstados(): Observable<readonly Estado[]> {
    return of([]);
  }

  override getMunicipios(_estadoId: string): Observable<readonly Municipio[]> {
    return of([]);
  }

  override getParroquias(_municipioId: string): Observable<readonly Parroquia[]> {
    return of([]);
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

  beforeEach(async () => {
    repository = new TestPatientRepository();

    await TestBed.configureTestingModule({
      imports: [PatientSearchPage],
      providers: [
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createPage(): PatientSearchPage {
    const fixture = TestBed.createComponent(PatientSearchPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

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
    expect(repository.searchCalls).toBe(1);
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

  it('debounces text search until the debounce window passes', () => {
    vi.useFakeTimers();
    const page = createPage();
    const store = page.store;
    const initialCalls = repository.searchCalls;

    store.updateQuery('Garcia');

    expect(repository.searchCalls).toBe(initialCalls);

    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);

    expect(repository.searchCalls).toBe(initialCalls + 1);
    expect(repository.lastQuery?.query).toBe('Garcia');
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
