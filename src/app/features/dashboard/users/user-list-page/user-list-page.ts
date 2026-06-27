import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../../core/auth/permission.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';
import { DeleteUserDialog } from '../components/delete-user-dialog/delete-user-dialog';
import { UserListTable } from '../components/user-list-table/user-list-table';
import { provideUserAdminRepository } from '../data-access/user-admin-repository.provider';
import { AdminUserListItem } from '../models/admin-user-list-item.model';
import { UserListStore } from '../state/user-list.store';

@Component({
  selector: 'app-user-list-page',
  imports: [
    RouterLink,
    PageHeader,
    PageShell,
    UserListTable,
    LoadingSkeleton,
    EmptyState,
    ErrorState,
    DeleteUserDialog,
  ],
  providers: [provideUserAdminRepository(), UserListStore],
  templateUrl: './user-list-page.html',
  styleUrl: './user-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPage {
  readonly store = inject(UserListStore);
  readonly permissions = inject(PermissionService);
  readonly paths = DASHBOARD_PATHS;

  readonly deleteTarget = signal<AdminUserListItem | null>(null);
  readonly deleteDialogOpen = computed(() => this.deleteTarget() !== null);

  onDeleteRequested(user: AdminUserListItem): void {
    this.store.clearDeleteError();
    this.deleteTarget.set(user);
  }

  onDeleteDismissed(): void {
    this.deleteTarget.set(null);
    this.store.clearDeleteError();
  }

  async onDeleteConfirmed(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) {
      return;
    }

    const deleted = await this.store.deleteUser(target.id);
    if (deleted) {
      this.deleteTarget.set(null);
    }
  }
}
