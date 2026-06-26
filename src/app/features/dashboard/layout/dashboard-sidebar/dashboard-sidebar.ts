import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PermissionService } from '../../../../core/auth/permission.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { CenterSelector } from '../center-selector/center-selector';

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [RouterLink, RouterLinkActive, CenterSelector],
  templateUrl: './dashboard-sidebar.html',
  styleUrl: './dashboard-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebar {
  private readonly permissions = inject(PermissionService);

  readonly paths = DASHBOARD_PATHS;
  readonly showPatients = this.permissions.canAccessPatients;
  readonly showUsers = this.permissions.canAccessUsers;
}
