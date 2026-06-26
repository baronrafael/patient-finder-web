import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { PATIENT_REPOSITORY } from '../../data-access/patient-repository.token';
import { PatientRepository } from '../../data-access/patient.repository';
import { Hospital } from '../../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../../models/location.model';
import { PatientSearchQuery } from '../../models/patient-search-query.model';
import { PatientSearchResult } from '../../models/patient-search-result.model';
import { PATIENT_SEARCH_DEBOUNCE_MS } from '../../utils/patient-search.constants';
import { PatientSearchPage } from './patient-search-page';

const emptyResult: PatientSearchResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  hasMore: false,
  updatedAt: '2026-06-25T20:00:00-04:00',
};

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
    return of(emptyResult);
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

    page.updateFilters({
      sex: null,
      estadoId: 'miranda',
      municipioId: 'chacao',
      parroquiaId: null,
    });
    page.updateQuery('G');

    expect(page.selectedEstadoId()).toBe('miranda');
    expect(page.selectedMunicipioId()).toBe('chacao');
    expect(repository.searchCalls).toBe(1);
  });

  it('resets filters only when the query becomes empty', () => {
    const page = createPage();

    page.updateFilters({
      sex: null,
      estadoId: 'miranda',
      municipioId: null,
      parroquiaId: null,
    });
    page.updateQuery('');

    expect(page.selectedEstadoId()).toBeNull();
    expect(page.query()).toBe('');
  });

  it('debounces text search until the debounce window passes', () => {
    vi.useFakeTimers();
    const page = createPage();
    const initialCalls = repository.searchCalls;

    page.updateQuery('Garcia');

    expect(repository.searchCalls).toBe(initialCalls);

    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);

    expect(repository.searchCalls).toBe(initialCalls + 1);
    expect(repository.lastQuery?.query).toBe('Garcia');
  });

  it('runs submit immediately and cancels a pending debounced search', () => {
    vi.useFakeTimers();
    const page = createPage();
    const initialCalls = repository.searchCalls;

    page.updateQuery('Garcia');
    page.submitSearch();

    expect(repository.searchCalls).toBe(initialCalls + 1);

    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);

    expect(repository.searchCalls).toBe(initialCalls + 1);
  });

  it('applies pending filters when the query becomes active', () => {
    vi.useFakeTimers();
    const page = createPage();

    page.updateFilters({
      sex: 'f',
      estadoId: 'miranda',
      municipioId: null,
      parroquiaId: null,
    });
    page.updateQuery('Garcia');

    vi.advanceTimersByTime(PATIENT_SEARCH_DEBOUNCE_MS);

    expect(repository.lastQuery).toEqual(
      expect.objectContaining({
        query: 'Garcia',
        sex: 'f',
        estadoId: 'miranda',
      }),
    );
  });
});
