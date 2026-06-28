import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  DuplicateCheckResult,
  emptyDuplicateCheckResult,
} from '../../models/duplicate-check-result.model';
import { RegistrationMatchStatus } from '../../models/registration-match-status.model';

@Component({
  selector: 'app-person-match-panel',
  imports: [],
  templateUrl: './person-match-panel.html',
  styleUrl: './person-match-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonMatchPanel {
  readonly status = input<RegistrationMatchStatus>('idle');
  readonly result = input<DuplicateCheckResult>(emptyDuplicateCheckResult());
  readonly error = input<string | null>(null);

  readonly retryRequested = output<void>();
  readonly viewMatch = output<string>();

  readonly matches = computed(() => this.result().matches);
  readonly hasMatches = computed(() => this.matches().length > 0);

  readonly title = computed(() => {
    switch (this.status()) {
      case 'exact':
        return 'Paciente ya registrado';
      case 'similar':
        return 'Posibles coincidencias';
      case 'none':
        return 'Sin coincidencias';
      case 'error':
        return 'Verificación no disponible';
      case 'pending':
      case 'loading':
        return 'Buscando coincidencias';
      default:
        return 'Coincidencias';
    }
  });

  readonly description = computed(() => {
    switch (this.status()) {
      case 'idle':
        return 'Completa la cédula o nombres y apellidos para buscar registros existentes.';
      case 'pending':
        return 'Preparando búsqueda…';
      case 'loading':
        return 'Consultando el directorio de pacientes…';
      case 'none':
        return 'No encontramos registros parecidos con los datos ingresados.';
      case 'exact':
        return 'Hay un registro con la misma identidad. Revisa antes de crear uno nuevo.';
      case 'similar':
        return 'Encontramos registros parecidos. Confirma que no sea el mismo paciente.';
      case 'error':
        return this.error() ?? 'No pudimos verificar coincidencias.';
      default:
        return '';
    }
  });

  readonly isBusy = computed(() => {
    const status = this.status();
    return status === 'pending' || status === 'loading';
  });

  readonly showSkeleton = computed(() => this.isBusy() && !this.hasMatches());

  onRetry(): void {
    this.retryRequested.emit();
  }

  onViewMatch(personId: string): void {
    this.viewMatch.emit(personId);
  }

  matchBadge(kind: 'exact' | 'similar'): string {
    return kind === 'exact' ? 'Coincidencia exacta' : 'Posible coincidencia';
  }
}
