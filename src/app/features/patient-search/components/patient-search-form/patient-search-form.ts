import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { isSearchActive } from '../../utils/patient-search.matcher';
import { PATIENT_SEARCH_MESSAGES } from '../../utils/patient-search.messages';
import { bindControlledField } from '../../utils/bind-controlled-field';
import { FormField, form } from '@angular/forms/signals';

@Component({
  selector: 'app-patient-search-form',
  imports: [FormField],
  templateUrl: './patient-search-form.html',
  styleUrl: './patient-search-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientSearchForm {
  private readonly destroyRef = inject(DestroyRef);

  readonly query = input.required<string>();
  readonly loading = input(false);
  readonly pending = input(false);
  readonly slowSearch = input(false);

  readonly queryChange = output<string>();
  readonly searchSubmit = output<void>();
  readonly clear = output<void>();

  readonly searchModel = signal({ query: '' });
  readonly searchForm = form(this.searchModel);

  readonly canSubmit = computed(() => isSearchActive(this.searchModel().query));

  readonly searchHint = PATIENT_SEARCH_MESSAGES.searchHint;
  readonly preparingSearchMessage = PATIENT_SEARCH_MESSAGES.preparingSearch;
  readonly loadingResultsMessage = PATIENT_SEARCH_MESSAGES.loadingResults;
  readonly slowSearchMessage = PATIENT_SEARCH_MESSAGES.slowConnection;

  constructor() {
    afterNextRender(() => {
      if (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(min-width: 1024px)').matches
      ) {
        document.getElementById('patient-search-query')?.focus();
      }
    });

    bindControlledField({
      destroyRef: this.destroyRef,
      parentValue: this.query,
      localModel: this.searchModel,
      selectValue: (model) => model.query,
      patchValue: (_model, query) => ({ query }),
      emit: (query) => this.queryChange.emit(query),
    });
  }

  onClear(): void {
    this.searchModel.set({ query: '' });
    this.queryChange.emit('');
    this.clear.emit();
    this.focusQueryInput();
  }

  onSubmit(): void {
    const query = this.searchModel().query;
    if (query !== this.query()) {
      this.queryChange.emit(query);
    }
    this.searchSubmit.emit();
    this.focusQueryInput();
  }

  private focusQueryInput(): void {
    requestAnimationFrame(() => {
      document.getElementById('patient-search-query')?.focus({ preventScroll: true });
    });
  }
}
