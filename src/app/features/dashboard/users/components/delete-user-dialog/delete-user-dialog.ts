import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-user-dialog',
  imports: [],
  templateUrl: './delete-user-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteUserDialog {
  readonly open = input(false);
  readonly userName = input.required<string>();
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly confirmed = output<void>();
  readonly dismissed = output<void>();

  onConfirm(): void {
    if (this.loading()) {
      return;
    }

    this.confirmed.emit();
  }

  onDismiss(): void {
    if (this.loading()) {
      return;
    }

    this.dismissed.emit();
  }
}
