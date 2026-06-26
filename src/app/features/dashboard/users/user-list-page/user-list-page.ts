import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';

@Component({
  selector: 'app-user-list-page',
  imports: [PageHeader, PageShell],
  templateUrl: './user-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPage {}
