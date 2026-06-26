import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../../core/auth/permission.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';

@Component({
  selector: 'app-patient-list-page',
  imports: [RouterLink, PageHeader, PageShell],
  templateUrl: './patient-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientListPage {
  readonly permissions = inject(PermissionService);
  readonly paths = DASHBOARD_PATHS;
}
