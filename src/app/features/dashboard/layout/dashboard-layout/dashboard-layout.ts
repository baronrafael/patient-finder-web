import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { DashboardHeader } from '../dashboard-header/dashboard-header';
import { DashboardSidebar } from '../dashboard-sidebar/dashboard-sidebar';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, DashboardHeader, DashboardSidebar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigate([DASHBOARD_PATHS.login]);
  }
}
