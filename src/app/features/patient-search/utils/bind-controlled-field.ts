import { DestroyRef, Signal, WritableSignal, effect, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map } from 'rxjs';

export function bindControlledField<TModel, TValue>(config: {
  readonly destroyRef: DestroyRef;
  readonly parentValue: Signal<TValue>;
  readonly localModel: WritableSignal<TModel>;
  readonly selectValue: (model: TModel) => TValue;
  readonly patchValue: (model: TModel, value: TValue) => TModel;
  readonly emit: (value: TValue) => void;
  readonly equals?: (left: TValue, right: TValue) => boolean;
}): void {
  const equals = config.equals ?? ((left, right) => left === right);

  effect(() => {
    const parent = config.parentValue();
    untracked(() => {
      const local = config.selectValue(config.localModel());
      if (equals(local, parent)) {
        return;
      }
      config.localModel.set(config.patchValue(config.localModel(), parent));
    });
  });

  toObservable(config.localModel)
    .pipe(
      map((model) => config.selectValue(model)),
      distinctUntilChanged(),
      filter((value) => !equals(value, config.parentValue())),
      takeUntilDestroyed(config.destroyRef),
    )
    .subscribe((value) => config.emit(value));
}
