import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';

@Component({
  selector: 'app-profile-page',
  imports: [PageHeader, PageShell],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  readonly user = this.auth.user;
}
