import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DASHBOARD_PATHS } from '../../../core/routing/dashboard.paths';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  readonly updatedAt = input<string | null>(null);
  readonly adminPath = DASHBOARD_PATHS.login;
}
