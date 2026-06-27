import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { PATIENT_REPOSITORY } from '../../../patient-search/data-access/patient-repository.token';
import {
  DuplicateCheckResult,
  emptyDuplicateCheckResult,
} from '../models/duplicate-check-result.model';
import { PersonFormValue } from '../models/person-form.model';
import {
  buildDuplicateSearchQuery,
  classifyDuplicateMatches,
} from '../utils/person-duplicate.utils';

export const DUPLICATE_CHECK_PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class DuplicateCheckService {
  private readonly patientRepository = inject(PATIENT_REPOSITORY);
  private readonly lastResult = signal<DuplicateCheckResult | null>(null);

  readonly cachedResult = this.lastResult.asReadonly();

  checkDuplicates(
    form: PersonFormValue,
    excludePersonId?: string | null,
  ): Observable<DuplicateCheckResult> {
    const searchQuery = buildDuplicateSearchQuery(form);
    if (!searchQuery) {
      const empty = emptyDuplicateCheckResult();
      this.lastResult.set(empty);
      return of(empty);
    }

    return this.patientRepository
      .search({
        query: searchQuery,
        hospitalId: null,
        sex: null,
        estadoId: null,
        municipioId: null,
        parroquiaId: null,
        page: 1,
        pageSize: DUPLICATE_CHECK_PAGE_SIZE,
      })
      .pipe(
        map((result) => {
          const candidates = excludePersonId
            ? result.items.filter((item) => item.id !== excludePersonId)
            : result.items;
          const classified = classifyDuplicateMatches(form, candidates, searchQuery);
          this.lastResult.set(classified);
          return classified;
        }),
        catchError(() => {
          const failed = emptyDuplicateCheckResult(searchQuery, true);
          this.lastResult.set(failed);
          return of(failed);
        }),
      );
  }

  clearCache(): void {
    this.lastResult.set(null);
  }
}
