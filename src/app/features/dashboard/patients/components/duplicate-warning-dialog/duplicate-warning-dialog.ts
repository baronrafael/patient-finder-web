import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { DuplicateCheckResult } from '../../models/duplicate-check-result.model';

@Component({
  selector: 'app-duplicate-warning-dialog',
  imports: [],
  templateUrl: './duplicate-warning-dialog.html',
  styleUrl: './duplicate-warning-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateWarningDialog {
  readonly open = input(false);
  readonly result = input.required<DuplicateCheckResult>();
  readonly confirmSubmit = input(false);

  readonly dismissed = output<void>();
  readonly continueRegistration = output<void>();
  readonly editMatch = output<string>();

  readonly isExact = computed(() => this.result().kind === 'exact');
  readonly title = computed(() =>
    this.isExact() ? 'Paciente ya registrado' : 'Posibles coincidencias',
  );
  readonly description = computed(() =>
    this.isExact()
      ? 'Encontramos un registro con la misma cédula. Edita el existente en lugar de crear uno nuevo.'
      : 'Encontramos registros parecidos. Revisa si ya existe antes de continuar.',
  );
  readonly matches = computed(() => this.result().matches);

  onDismiss(): void {
    this.dismissed.emit();
  }

  onContinue(): void {
    this.continueRegistration.emit();
  }

  onEdit(personId: string): void {
    this.editMatch.emit(personId);
  }
}
