import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, finalize, map, of, switchMap } from 'rxjs';

import { PATIENT_SEARCH_DEBOUNCE_MS } from '../../../patient-search/utils/patient-search.constants';
import { DuplicateCheckService } from '../data-access/duplicate-check.service';
import {
  DuplicateCheckResult,
  emptyDuplicateCheckResult,
} from '../models/duplicate-check-result.model';
import { PersonFormValue } from '../models/person-form.model';
import { RegistrationMatchStatus } from '../models/registration-match-status.model';
import { buildDuplicateSearchQuery } from '../utils/person-duplicate.utils';

const MATCH_LOOKUP_ERROR_MESSAGE =
  'No pudimos verificar coincidencias en este momento. Intenta de nuevo.';

interface LookupRequest {
  readonly form: PersonFormValue;
  readonly excludePersonId: string | null;
  readonly searchQuery: string;
}

@Injectable()
export class PatientRegistrationMatchStore {
  private readonly duplicateCheck = inject(DuplicateCheckService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lookupRequest$ = new Subject<LookupRequest>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSearchedQuery = '';
  private scheduledQuery = '';
  private lookupGeneration = 0;

  readonly formValue = signal<PersonFormValue | null>(null);
  readonly excludePersonId = signal<string | null>(null);
  readonly pending = signal(false);
  readonly loading = signal(false);
  readonly result = signal<DuplicateCheckResult>(emptyDuplicateCheckResult());
  readonly error = signal<string | null>(null);

  readonly searchQuery = computed(() => {
    const form = this.formValue();
    return form ? buildDuplicateSearchQuery(form) : null;
  });

  readonly canSearch = computed(() => this.searchQuery() !== null);

  readonly status = computed((): RegistrationMatchStatus => {
    if (!this.canSearch()) {
      return 'idle';
    }

    if (this.pending()) {
      return 'pending';
    }

    if (this.loading()) {
      return 'loading';
    }

    const current = this.result();
    if (this.error() || current.searchFailed) {
      return 'error';
    }

    if (current.kind === 'exact') {
      return 'exact';
    }

    if (current.kind === 'similar') {
      return 'similar';
    }

    return 'none';
  });

  constructor() {
    this.setupLookupPipeline();
    this.destroyRef.onDestroy(() => this.clearDebounce());
  }

  updateIdentity(form: PersonFormValue, excludePersonId?: string | null): void {
    this.setIdentity(form, excludePersonId);
    this.scheduleLookup();
  }

  lookupNow(form: PersonFormValue, excludePersonId?: string | null): void {
    this.setIdentity(form, excludePersonId);

    const searchQuery = this.searchQuery();
    if (!searchQuery) {
      this.resetWhenNotSearchable();
      return;
    }

    this.clearDebounce();
    this.pending.set(false);
    this.emitLookup({
      form,
      excludePersonId: this.excludePersonId(),
      searchQuery,
    });
  }

  retry(): void {
    this.error.set(null);
    this.lastSearchedQuery = '';

    const form = this.formValue();
    if (form) {
      this.lookupNow(form, this.excludePersonId());
    }
  }

  clear(): void {
    this.clearDebounce();
    this.formValue.set(null);
    this.excludePersonId.set(null);
    this.pending.set(false);
    this.loading.set(false);
    this.error.set(null);
    this.result.set(emptyDuplicateCheckResult());
    this.lastSearchedQuery = '';
    this.scheduledQuery = '';
    this.duplicateCheck.clearCache();
  }

  private setIdentity(form: PersonFormValue, excludePersonId?: string | null): void {
    this.formValue.set(form);

    if (excludePersonId !== undefined) {
      this.excludePersonId.set(excludePersonId);
    }
  }

  private scheduleLookup(): void {
    const form = this.formValue();
    const searchQuery = this.searchQuery();

    if (!form || !searchQuery) {
      this.resetWhenNotSearchable();
      return;
    }

    if (searchQuery === this.lastSearchedQuery) {
      this.pending.set(false);
      return;
    }

    if (searchQuery === this.scheduledQuery && this.debounceTimer !== null) {
      return;
    }

    this.clearDebounce();
    this.scheduledQuery = searchQuery;
    this.pending.set(true);
    this.error.set(null);

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.scheduledQuery = '';
      this.pending.set(false);

      const latestForm = this.formValue();
      const latestQuery = this.searchQuery();
      if (!latestForm || !latestQuery || latestQuery !== searchQuery) {
        return;
      }

      this.emitLookup({
        form: latestForm,
        excludePersonId: this.excludePersonId(),
        searchQuery: latestQuery,
      });
    }, PATIENT_SEARCH_DEBOUNCE_MS);
  }

  private resetWhenNotSearchable(): void {
    this.clearDebounce();
    this.pending.set(false);
    this.loading.set(false);
    this.error.set(null);
    this.result.set(emptyDuplicateCheckResult());
    this.lastSearchedQuery = '';
    this.scheduledQuery = '';
  }

  private emitLookup(request: LookupRequest): void {
    if (request.searchQuery === this.lastSearchedQuery && !this.result().searchFailed) {
      this.pending.set(false);
      return;
    }

    this.lookupRequest$.next(request);
  }

  private setupLookupPipeline(): void {
    this.lookupRequest$
      .pipe(
        switchMap((request) => {
          const generation = ++this.lookupGeneration;
          this.loading.set(true);
          this.error.set(null);

          return this.duplicateCheck.checkDuplicates(request.form, request.excludePersonId).pipe(
            map((result) => ({ result, searchQuery: request.searchQuery, generation })),
            catchError(() => {
              const failed = emptyDuplicateCheckResult(request.searchQuery, true);
              this.error.set(MATCH_LOOKUP_ERROR_MESSAGE);
              return of({ result: failed, searchQuery: request.searchQuery, generation });
            }),
            finalize(() => {
              if (generation === this.lookupGeneration) {
                this.loading.set(false);
              }
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ result, searchQuery, generation }) => {
        if (generation !== this.lookupGeneration) {
          return;
        }

        this.lastSearchedQuery = searchQuery;
        this.result.set(result);

        if (result.searchFailed) {
          this.error.set(MATCH_LOOKUP_ERROR_MESSAGE);
        }
      });
  }

  private clearDebounce(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.scheduledQuery = '';
  }
}
