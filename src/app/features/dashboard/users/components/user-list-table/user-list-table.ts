import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminUserListItem } from '../../models/admin-user-list-item.model';

@Component({
  selector: 'app-user-list-table',
  imports: [RouterLink],
  templateUrl: './user-list-table.html',
  styleUrl: './user-list-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListTable {
  readonly items = input.required<readonly AdminUserListItem[]>();
  readonly userDetailPath = input.required<(id: string) => string>();
  readonly deletingId = input<string | null>(null);

  readonly deleteRequested = output<AdminUserListItem>();
}
