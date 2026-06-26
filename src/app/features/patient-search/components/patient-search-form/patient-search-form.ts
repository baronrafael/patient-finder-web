import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, disabled, form } from '@angular/forms/signals';
import { distinctUntilChanged, filter, map } from 'rxjs';

import { isSearchActive } from '../../utils/patient-search.matcher';

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
  readonly disabled = input(false);
  readonly pending = input(false);
  readonly slowSearch = input(false);

  readonly queryChange = output<string>();
  readonly searchSubmit = output<void>();
  readonly clear = output<void>();

  readonly searchModel = signal({ query: '' });
  readonly searchForm = form(this.searchModel, (path) => {
    disabled(path.query, () => this.disabled());
  });

  readonly canSubmit = computed(() => isSearchActive(this.searchModel().query));

  constructor() {
    afterNextRender(() => {
      if (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(min-width: 1024px)').matches
      ) {
        document.getElementById('patient-search-query')?.focus();
      }
    });

    effect(() => {
      const query = this.query();
      untracked(() => {
        if (this.searchModel().query === query) {
          return;
        }
        this.searchModel.set({ query });
      });
    });

    toObservable(this.searchModel)
      .pipe(
        map((model) => model.query),
        distinctUntilChanged(),
        filter((query) => query !== this.query()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => this.queryChange.emit(query));
  }

  onClear(): void {
    this.searchModel.set({ query: '' });
    this.queryChange.emit('');
    this.clear.emit();
  }

  onSubmit(): void {
    const query = this.searchModel().query;
    if (query !== this.query()) {
      this.queryChange.emit(query);
    }
    this.searchSubmit.emit();
  }
}
