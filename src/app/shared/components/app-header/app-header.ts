import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { resolveDefaultDashboardPath } from '../../../core/auth/dashboard-navigation.utils';
import { PermissionService } from '../../../core/auth/permission.service';
import { formatUserInteger } from '../../../core/i18n/format-user-integer.util';
import { DASHBOARD_PATHS } from '../../../core/routing/dashboard.paths';
import { PatientSearchStats } from '../../../features/patient-search/models/patient-search-stats.model';

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
  readonly stats = input<PatientSearchStats | null>(null);
  readonly formattedStats = computed(() => {
    const stats = this.stats();
    if (!stats) {
      return null;
    }

    return {
      totalPersons: formatUserInteger(stats.totalPersons),
      totalCenters: formatUserInteger(stats.totalCenters),
    };
  });
  readonly adminPath = computed(() =>
    this.auth.isAuthenticated()
      ? resolveDefaultDashboardPath(this.permissions)
      : DASHBOARD_PATHS.login,
  );
}
