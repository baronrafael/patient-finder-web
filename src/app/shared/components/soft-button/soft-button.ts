import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-soft-button',
  templateUrl: './soft-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoftButton {
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);
}
