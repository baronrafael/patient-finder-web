import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { PermissionService } from '../../../../core/auth/permission.service';
import { mapHttpError } from '../../../../core/http/http-error.mapper';
import { PERSON_ADMIN_REPOSITORY } from '../data-access/person-admin-repository.token';
import {
  EMPTY_PATIENT_LIST_FILTERS,
  PatientListFiltersValue,
} from '../models/patient-list-filters.model';
import { PersonListQuery } from '../models/person-list-query.model';
import { ADMIN_PERSON_PAGE_SIZE } from '../utils/patient-list.constants';

@Injectable()
export class PatientListStore {
  private readonly repository = inject(PERSON_ADMIN_REPOSITORY);
  private readonly permissions = inject(PermissionService);

  private readonly appliedFilters = signal<PatientListFiltersValue>(EMPTY_PATIENT_LIST_FILTERS);
  readonly page = signal(1);
  private readonly errorState = signal<string | null>(null);

  readonly needsCenterSelection = computed(
    () => this.permissions.hasMultipleCenters() && !this.permissions.activeCenterId(),
  );

  private readonly listQuery = computed<PersonListQuery | null>(() => {
    if (this.needsCenterSelection()) {
      return null;
    }

    const filters = this.appliedFilters();
    return {
      query: filters.query,
      centerId: this.permissions.activeCenterId(),
      sex: filters.sex,
      status: filters.status,
      page: this.page(),
      pageSize: ADMIN_PERSON_PAGE_SIZE,
    };
  });

  readonly listResource = rxResource({
    params: () => this.listQuery(),
    stream: ({ params }) => {
      if (!params) {
        return of(null);
      }

      return this.repository.list(params).pipe(
        catchError((error) => {
          this.errorState.set(mapHttpError(error));
          return of(null);
        }),
      );
    },
    defaultValue: null,
  });

  readonly appliedFiltersState = this.appliedFilters.asReadonly();

  readonly hasActiveFilters = computed(() => {
    const filters = this.appliedFilters();
    return Boolean(filters.query || filters.sex || filters.status);
  });

  readonly loading = computed(() => !this.needsCenterSelection() && this.listResource.isLoading());
  readonly error = this.errorState.asReadonly();
  readonly result = computed(() => this.listResource.value());
  readonly initialLoading = computed(
    () => !this.needsCenterSelection() && this.listResource.isLoading() && this.result() === null,
  );
  readonly refreshing = computed(
    () => !this.needsCenterSelection() && this.listResource.isLoading() && this.result() !== null,
  );
  readonly items = computed(() =>
    (this.result()?.items ?? []).map((row) => ({
      ...row,
      canEdit: this.permissions.can('patients:update', row.centerId),
      canDelete: this.permissions.can('patients:delete', row.centerId),
    })),
  );
  readonly total = computed(() => this.result()?.total ?? 0);
  readonly totalPages = computed(() => this.result()?.totalPages ?? 1);
  readonly currentPage = computed(() => this.result()?.page ?? this.page());
  readonly hasItems = computed(() => this.items().length > 0);
  readonly isEmpty = computed(
    () =>
      !this.needsCenterSelection() &&
      !this.initialLoading() &&
      !this.error() &&
      this.result() !== null &&
      !this.hasItems(),
  );

  readonly pageSummary = computed(() => {
    const result = this.result();
    if (!result || result.total === 0) {
      return 'Sin registros';
    }

    const start = (result.page - 1) * result.pageSize + 1;
    const end = Math.min(result.page * result.pageSize, result.total);
    return `${start}–${end} de ${result.total} · Página ${result.page} de ${result.totalPages}`;
  });

  constructor() {
    effect(() => {
      this.permissions.activeCenterId();
      untracked(() => {
        this.resetToFirstPage();
      });
    });
  }

  submitFilters(value: PatientListFiltersValue): void {
    const nextFilters: PatientListFiltersValue = {
      query: value.query.trim(),
      sex: value.sex,
      status: value.status,
    };

    if (filtersEqual(nextFilters, this.appliedFilters())) {
      this.resetToFirstPage();
      if (!this.needsCenterSelection()) {
        this.listResource.reload();
      }
      return;
    }

    this.appliedFilters.set(nextFilters);
    this.resetToFirstPage();
  }

  clearFilters(): void {
    this.appliedFilters.set(EMPTY_PATIENT_LIST_FILTERS);
    this.resetToFirstPage();
  }

  goToPage(page: number): void {
    const totalPages = this.totalPages();
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === this.page()) {
      return;
    }

    this.page.set(nextPage);
    this.errorState.set(null);
  }

  retry(): void {
    this.errorState.set(null);
    this.listResource.reload();
  }

  private resetToFirstPage(): void {
    this.page.set(1);
    this.errorState.set(null);
  }
}

function filtersEqual(left: PatientListFiltersValue, right: PatientListFiltersValue): boolean {
  return left.query === right.query && left.sex === right.sex && left.status === right.status;
}
