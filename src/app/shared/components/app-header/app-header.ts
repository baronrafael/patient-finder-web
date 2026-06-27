import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { resolveDefaultDashboardPath } from '../../../core/auth/dashboard-navigation.utils';
import { PermissionService } from '../../../core/auth/permission.service';
import { DASHBOARD_PATHS } from '../../../core/routing/dashboard.paths';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionService);

  readonly updatedAt = input<string | null>(null);
  readonly adminPath = computed(() =>
    this.auth.isAuthenticated()
      ? resolveDefaultDashboardPath(this.permissions)
      : DASHBOARD_PATHS.login,
  );
}
