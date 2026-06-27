import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, of } from 'rxjs';

import { PermissionService } from '../../../../core/auth/permission.service';
import { mapHttpError } from '../../../../core/http/http-error.mapper';
import { USER_ADMIN_REPOSITORY } from '../data-access/user-admin-repository.token';
import { UserListQuery } from '../models/user-list-query.model';
import { ADMIN_USER_PAGE_SIZE } from '../utils/user-list.constants';

@Injectable()
export class UserListStore {
  private readonly repository = inject(USER_ADMIN_REPOSITORY);
  private readonly permissions = inject(PermissionService);

  readonly page = signal(1);
  private readonly errorState = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  private readonly listQuery = computed<UserListQuery>(() => ({
    page: this.page(),
    pageSize: ADMIN_USER_PAGE_SIZE,
  }));

  readonly listResource = rxResource({
    params: () => this.listQuery(),
    stream: ({ params }) =>
      this.repository.list(params).pipe(
        catchError((error) => {
          this.errorState.set(mapHttpError(error));
          return of(null);
        }),
      ),
    defaultValue: null,
  });

  readonly loading = computed(() => this.listResource.isLoading());
  readonly error = this.errorState.asReadonly();
  readonly result = computed(() => this.listResource.value());
  readonly initialLoading = computed(
    () => this.listResource.isLoading() && this.result() === null,
  );
  readonly refreshing = computed(
    () => this.listResource.isLoading() && this.result() !== null,
  );
  readonly items = computed(() =>
    (this.result()?.items ?? []).map((row) => ({
      ...row,
      canEdit: this.permissions.can('users:update'),
      canDelete: this.permissions.can('users:delete'),
    })),
  );
  readonly total = computed(() => this.result()?.total ?? 0);
  readonly totalPages = computed(() => this.result()?.totalPages ?? 1);
  readonly currentPage = computed(() => this.result()?.page ?? this.page());
  readonly hasItems = computed(() => this.items().length > 0);
  readonly isEmpty = computed(
    () => !this.initialLoading() && !this.error() && this.result() !== null && !this.hasItems(),
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

  async deleteUser(id: string): Promise<boolean> {
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
}
