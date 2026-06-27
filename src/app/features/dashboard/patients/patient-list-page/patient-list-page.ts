import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../../core/auth/permission.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';
import { PATIENT_REPOSITORY } from '../../../patient-search/data-access/patient-repository.token';
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
  private readonly catalog = inject(PATIENT_REPOSITORY);
  readonly paths = DASHBOARD_PATHS;

  readonly hospitals = toSignal(this.catalog.getHospitals(), { initialValue: [] });

  readonly centerOptions = computed(() => {
    const activeCenterId = this.permissions.activeCenterId();
    const centers = this.hospitals().map((hospital) => ({
      id: hospital.id,
      name: hospital.name,
    }));

    if (this.permissions.canListAllCenters()) {
      return centers;
    }

    const allowedCenterIds = new Set(this.permissions.availableCenterIds());
    const scopedCenters = centers.filter((center) => allowedCenterIds.has(center.id));

    if (activeCenterId && !this.permissions.canListAllCenters()) {
      return scopedCenters.filter((center) => center.id === activeCenterId);
    }

    return scopedCenters;
  });

  readonly lockCenter = computed(
    () => Boolean(this.permissions.activeCenterId() && !this.permissions.canListAllCenters()),
  );

  readonly showAllCentersOption = computed(() => this.permissions.canListAllCenters());

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
