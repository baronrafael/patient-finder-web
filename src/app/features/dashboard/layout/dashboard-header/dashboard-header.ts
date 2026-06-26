import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';

@Component({
  selector: 'app-dashboard-header',
  imports: [RouterLink],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeader {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly paths = DASHBOARD_PATHS;
  readonly logout = output<void>();
}
