import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, of } from 'rxjs';

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
  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  readonly needsCenterSelection = computed(() => {
    if (this.permissions.canListAllCenters()) {
      return false;
    }

    if (!this.permissions.hasMultipleCenters()) {
      return false;
    }

    return !this.resolvedCenterId();
  });

  readonly resolvedCenterId = computed(() => {
    const filterCenterId = this.appliedFilters().centerId;
    if (filterCenterId) {
      return filterCenterId;
    }

    return this.permissions.activeCenterId();
  });

  private readonly listQuery = computed<PersonListQuery | null>(() => {
    if (this.needsCenterSelection()) {
      return null;
    }

    const filters = this.appliedFilters();
    return {
      query: filters.query,
      centerId: this.resolvedCenterId(),
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
    const hasOptionalCenterFilter =
      Boolean(filters.centerId) &&
      (this.permissions.canListAllCenters() || this.permissions.hasMultipleCenters());

    return Boolean(filters.query || filters.sex || filters.status || hasOptionalCenterFilter);
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
      this.permissions.canListAllCenters();
      untracked(() => {
        this.syncLockedCenterFilter();
        this.resetToFirstPage();
      });
    });
  }

  submitFilters(value: PatientListFiltersValue): void {
    const nextFilters: PatientListFiltersValue = {
      query: value.query.trim(),
      centerId: value.centerId,
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
    this.appliedFilters.set(this.createDefaultFilters());
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

  clearDeleteError(): void {
    this.deleteError.set(null);
  }

  async deletePerson(id: string): Promise<boolean> {
    if (this.deletingId()) {
      return false;
    }

    this.deleteError.set(null);
    this.deletingId.set(id);

    try {
      await firstValueFrom(this.repository.delete(id));

      const wasOnlyItemOnPage = this.items().length === 1;
      const currentPage = this.currentPage();

      if (wasOnlyItemOnPage && currentPage > 1) {
        this.page.set(currentPage - 1);
      } else {
        this.listResource.reload();
      }

      return true;
    } catch (error) {
      this.deleteError.set(mapHttpError(error));
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }

  private resetToFirstPage(): void {
    this.page.set(1);
    this.errorState.set(null);
  }

  private createDefaultFilters(): PatientListFiltersValue {
    const lockedCenterId = this.defaultCenterId();
    return {
      ...EMPTY_PATIENT_LIST_FILTERS,
      ...(lockedCenterId ? { centerId: lockedCenterId } : {}),
    };
  }

  private defaultCenterId(): string | null {
    if (this.permissions.canListAllCenters()) {
      return null;
    }

    return this.permissions.activeCenterId();
  }

  private syncLockedCenterFilter(): void {
    const lockedCenterId = this.defaultCenterId();
    if (!lockedCenterId) {
      return;
    }

    const current = this.appliedFilters();
    if (current.centerId === lockedCenterId) {
      return;
    }

    this.appliedFilters.set({
      ...current,
      centerId: lockedCenterId,
    });
  }
}

function filtersEqual(left: PatientListFiltersValue, right: PatientListFiltersValue): boolean {
  return (
    left.query === right.query &&
    left.centerId === right.centerId &&
    left.sex === right.sex &&
    left.status === right.status
  );
}
