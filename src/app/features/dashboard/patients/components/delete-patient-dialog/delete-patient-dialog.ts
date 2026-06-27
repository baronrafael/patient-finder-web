import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-patient-dialog',
  imports: [],
  templateUrl: './delete-patient-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePatientDialog {
  readonly open = input(false);
  readonly patientName = input.required<string>();
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
