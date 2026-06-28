import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { disabled, form, FormField } from '@angular/forms/signals';
import { of } from 'rxjs';

import { SelectField } from '../../../../../shared/components/select-field/select-field';
import { TextField } from '../../../../../shared/components/text-field/text-field';
import { PATIENT_REPOSITORY } from '../../../../patient-search/data-access/patient-repository.token';
import { Estado, Municipio, Parroquia } from '../../../../patient-search/models/location.model';
import {
  PersonFormErrors,
  PersonFormField,
  PersonFormValue,
} from '../../models/person-form.model';
import { PERSON_SEX_FORM_OPTIONS, PERSON_STATUS_FORM_OPTIONS } from '../../utils/person-form.constants';
import { buildDuplicateSearchQuery } from '../../utils/person-duplicate.utils';
import {
  createEmptyPersonFormModel,
  personFormModelToValue,
  personFormValueToModel,
  PersonFormModel,
} from '../../utils/person-form.mapper';
import { isPersonFormValid, validatePersonForm } from '../../utils/person-form.validation';

export interface PersonFormCenterOption {
  readonly id: string;
  readonly name: string;
}

@Component({
  selector: 'app-person-form',
  imports: [TextField, SelectField, FormField],
  templateUrl: './person-form.html',
  styleUrl: './person-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonForm {
  private readonly repository = inject(PATIENT_REPOSITORY);

  readonly initialValue = input<PersonFormValue | null>(null);
  readonly disabled = input(false);
  readonly lockCenter = input(false);
  readonly submitLabel = input('Guardar paciente');
  readonly centerOptions = input.required<readonly PersonFormCenterOption[]>();

  readonly submitted = output<PersonFormValue>();
  readonly identityChanged = output<PersonFormValue>();
  readonly identityBlurred = output<PersonFormValue>();

  readonly sexOptions = PERSON_SEX_FORM_OPTIONS;
  readonly statusOptions = PERSON_STATUS_FORM_OPTIONS;

  readonly formModel = signal<PersonFormModel>(createEmptyPersonFormModel());
  readonly formErrors = signal<PersonFormErrors>({});
  readonly showErrors = signal(false);

  readonly form = form(this.formModel, (path) => {
    disabled(path.firstName, () => this.disabled());
    disabled(path.lastName, () => this.disabled());
    disabled(path.cedula, () => this.disabled());
    disabled(path.sex, () => this.disabled());
    disabled(path.ageApprox, () => this.disabled());
    disabled(path.status, () => this.disabled());
    disabled(path.admittedAt, () => this.disabled());
    disabled(path.rescueEstadoId, () => this.disabled());
    disabled(path.rescueMunicipioId, ({ valueOf }) => !valueOf(path.rescueEstadoId) || this.disabled());
    disabled(path.rescueParroquiaId, ({ valueOf }) => !valueOf(path.rescueMunicipioId) || this.disabled());
    disabled(path.centerId, () => this.disabled() || this.lockCenter());
    disabled(path.contacts, () => this.disabled());
    disabled(path.notes, () => this.disabled());
  });

  readonly estadosResource = rxResource({
    stream: () => this.repository.getEstados(),
    defaultValue: [] as readonly Estado[],
  });

  readonly municipiosResource = rxResource({
    params: () => this.formModel().rescueEstadoId,
    stream: ({ params: estadoId }) =>
      estadoId ? this.repository.getMunicipios(estadoId) : of([] as readonly Municipio[]),
    defaultValue: [] as readonly Municipio[],
  });

  readonly parroquiasResource = rxResource({
    params: () => this.formModel().rescueMunicipioId,
    stream: ({ params: municipioId }) =>
      municipioId ? this.repository.getParroquias(municipioId) : of([] as readonly Parroquia[]),
    defaultValue: [] as readonly Parroquia[],
  });

  readonly estados = computed(() => this.estadosResource.value());
  readonly municipios = computed(() => this.municipiosResource.value());
  readonly parroquias = computed(() => this.parroquiasResource.value());

  readonly municipioDisabled = computed(() => this.disabled() || !this.formModel().rescueEstadoId);
  readonly parroquiaDisabled = computed(() => this.disabled() || !this.formModel().rescueMunicipioId);

  private previousEstadoId = '';
  private previousMunicipioId = '';

  constructor() {
    effect(() => {
      const initial = this.initialValue();
      if (!initial) {
        return;
      }

      untracked(() => {
        const nextModel = personFormValueToModel(initial);
        const current = this.formModel();
        if (personFormModelsEqual(current, nextModel)) {
          return;
        }

        this.formModel.set(nextModel);
        this.previousEstadoId = nextModel.rescueEstadoId;
        this.previousMunicipioId = nextModel.rescueMunicipioId;
      });
    });

    effect(() => {
      const estadoId = this.formModel().rescueEstadoId;

      untracked(() => {
        if (this.previousEstadoId && this.previousEstadoId !== estadoId) {
          this.formModel.update((model) => ({
            ...model,
            rescueMunicipioId: '',
            rescueParroquiaId: '',
          }));
          this.previousMunicipioId = '';
        }

        this.previousEstadoId = estadoId;
      });
    });

    effect(() => {
      const municipioId = this.formModel().rescueMunicipioId;

      untracked(() => {
        if (this.previousMunicipioId && this.previousMunicipioId !== municipioId) {
          this.formModel.update((model) => ({
            ...model,
            rescueParroquiaId: '',
          }));
        }

        this.previousMunicipioId = municipioId;
      });
    });

  }

  onIdentityInput(): void {
    if (this.disabled()) {
      return;
    }

    this.identityChanged.emit(personFormModelToValue(this.formModel()));
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.disabled()) {
      return;
    }

    const value = personFormModelToValue(this.formModel());
    const errors = validatePersonForm(value);
    this.formErrors.set(errors);
    this.showErrors.set(true);

    if (isPersonFormValid(errors)) {
      this.submitted.emit(value);
    }
  }

  fieldError(field: PersonFormField): string | null {
    if (!this.showErrors()) {
      return null;
    }

    return this.formErrors()[field] ?? null;
  }

  fieldErrorMarkup(field: PersonFormField): { readonly visible: boolean; readonly text: string } {
    if (!this.showErrors() || field === 'identity') {
      return { visible: false, text: '' };
    }

    const message = this.formErrors()[field];
    return {
      visible: Boolean(message),
      text: message ?? '\u00a0',
    };
  }

  hasIdentityError(): boolean {
    return Boolean(this.fieldError('identity'));
  }

  onIdentityBlur(): void {
    this.emitIdentityBlurIfSearchable();
  }

  private emitIdentityBlurIfSearchable(): void {
    if (this.disabled()) {
      return;
    }

    const value = personFormModelToValue(this.formModel());
    if (buildDuplicateSearchQuery(value)) {
      this.identityBlurred.emit(value);
    }
  }
}

function personFormModelsEqual(left: PersonFormModel, right: PersonFormModel): boolean {
  return (
    left.firstName === right.firstName &&
    left.lastName === right.lastName &&
    left.cedula === right.cedula &&
    left.sex === right.sex &&
    left.ageApprox === right.ageApprox &&
    left.status === right.status &&
    left.admittedAt === right.admittedAt &&
    left.rescueEstadoId === right.rescueEstadoId &&
    left.rescueMunicipioId === right.rescueMunicipioId &&
    left.rescueParroquiaId === right.rescueParroquiaId &&
    left.centerId === right.centerId &&
    left.contacts === right.contacts &&
    left.notes === right.notes
  );
}
