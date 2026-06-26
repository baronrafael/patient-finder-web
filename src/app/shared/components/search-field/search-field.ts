import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-search-field',
  imports: [FormField],
  templateUrl: './search-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchField {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly field = input.required<Field<string>>();
  readonly placeholder = input<string | null>(null);
  readonly autocomplete = input('off');
  readonly inputmode = input<string | null>('search');
}
