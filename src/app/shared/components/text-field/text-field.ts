import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-text-field',
  imports: [FormField],
  templateUrl: './text-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly field = input.required<Field<string>>();
  readonly type = input<'text' | 'email' | 'password' | 'search' | 'tel'>('text');
  readonly autocomplete = input<string | null>(null);
}
