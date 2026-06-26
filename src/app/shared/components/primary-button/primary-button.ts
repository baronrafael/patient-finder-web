import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  templateUrl: './primary-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryButton {
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly loadingLabel = input('Cargando...');
  readonly fullWidth = input(false);
}
