import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-text-field',
  imports: [FormField],
  templateUrl: './text-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class TextField {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly field = input.required<Field<string>>();
  readonly type = input<'text' | 'email' | 'password' | 'search' | 'tel' | 'datetime-local' | 'number'>('text');
  readonly autocomplete = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly refinedBorder = input(false);

  readonly blurred = output<void>();
  readonly inputted = output<void>();
}
