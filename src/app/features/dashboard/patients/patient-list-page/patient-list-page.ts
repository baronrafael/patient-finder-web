import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../../core/auth/permission.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';
import { DeletePatientDialog } from '../components/delete-patient-dialog/delete-patient-dialog';
import { providePersonAdminRepository } from '../data-access/person-admin-repository.provider';
import { PatientListFilters } from '../components/patient-list-filters/patient-list-filters';
import { PatientListTable } from '../components/patient-list-table/patient-list-table';
import { AdminPersonListItem } from '../models/admin-person-list-item.model';
import { PatientListStore } from '../state/patient-list.store';

@Component({
  selector: 'app-patient-list-page',
  imports: [
    RouterLink,
    PageHeader,
    PageShell,
    PatientListFilters,
    PatientListTable,
    LoadingSkeleton,
    EmptyState,
    ErrorState,
    DeletePatientDialog,
  ],
  providers: [providePersonAdminRepository(), PatientListStore],
  templateUrl: './patient-list-page.html',
  styleUrl: './patient-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientListPage {
  readonly store = inject(PatientListStore);
  readonly permissions = inject(PermissionService);
  readonly paths = DASHBOARD_PATHS;

  readonly deleteTarget = signal<AdminPersonListItem | null>(null);
  readonly deleteDialogOpen = computed(() => this.deleteTarget() !== null);

  onDeleteRequested(person: AdminPersonListItem): void {
    this.store.clearDeleteError();
    this.deleteTarget.set(person);
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

    const deleted = await this.store.deletePerson(target.id);
    if (deleted) {
      this.deleteTarget.set(null);
    }
  }
}
