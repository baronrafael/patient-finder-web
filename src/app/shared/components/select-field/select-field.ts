import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-select-field',
  imports: [FormField],
  templateUrl: './select-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectField {
  readonly label = input.required<string>();
  readonly selectId = input.required<string>();
  readonly field = input.required<Field<string>>();
  readonly hint = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
}
