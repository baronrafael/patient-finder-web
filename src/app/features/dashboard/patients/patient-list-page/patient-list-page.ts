import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../../core/auth/permission.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';
import { providePersonAdminRepository } from '../data-access/person-admin-repository.provider';
import { PatientListFilters } from '../components/patient-list-filters/patient-list-filters';
import { PatientListTable } from '../components/patient-list-table/patient-list-table';
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
}
