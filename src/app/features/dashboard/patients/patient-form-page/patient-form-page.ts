import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, firstValueFrom, map, of } from 'rxjs';

import { PermissionService } from '../../../../core/auth/permission.service';
import { mapHttpError } from '../../../../core/http/http-error.mapper';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';
import { PATIENT_REPOSITORY } from '../../../patient-search/data-access/patient-repository.token';
import { DuplicateWarningDialog } from '../components/duplicate-warning-dialog/duplicate-warning-dialog';
import { PersonForm } from '../components/person-form/person-form';
import { DuplicateCheckService } from '../data-access/duplicate-check.service';
import { providePersonAdminRepository } from '../data-access/person-admin-repository.provider';
import { PERSON_ADMIN_REPOSITORY } from '../data-access/person-admin-repository.token';
import {
  DuplicateCheckResult,
  emptyDuplicateCheckResult,
} from '../models/duplicate-check-result.model';
import { PersonFormValue } from '../models/person-form.model';
import { defaultAdmittedAtLocal } from '../utils/person-form.mapper';

const DUPLICATE_CHECK_DEBOUNCE_MS = 400;

@Component({
  selector: 'app-patient-form-page',
  imports: [
    RouterLink,
    PageHeader,
    PageShell,
    PersonForm,
    LoadingSkeleton,
    ErrorState,
    DuplicateWarningDialog,
  ],
  providers: [providePersonAdminRepository()],
  templateUrl: './patient-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly repository = inject(PATIENT_REPOSITORY);
  private readonly adminRepository = inject(PERSON_ADMIN_REPOSITORY);
  private readonly duplicateCheck = inject(DuplicateCheckService);

  private duplicateCheckTimer: ReturnType<typeof setTimeout> | null = null;

  readonly paths = DASHBOARD_PATHS;
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly duplicateDialogOpen = signal(false);
  readonly duplicateResult = signal<DuplicateCheckResult>(emptyDuplicateCheckResult());
  readonly pendingSubmit = signal<PersonFormValue | null>(null);
  readonly duplicateCheckWarning = signal<string | null>(null);

  readonly personId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  readonly isEditMode = computed(() => Boolean(this.personId()));
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar paciente' : 'Nuevo paciente'));
  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Actualiza los datos del registro seleccionado.'
      : 'Digitaliza un paciente de la lista manuscrita.',
  );
  readonly submitLabel = computed(() => {
    if (this.saving()) {
      return this.isEditMode() ? 'Guardando…' : 'Registrando…';
    }

    return this.isEditMode() ? 'Guardar cambios' : 'Registrar paciente';
  });

  readonly hospitals = toSignal(this.repository.getHospitals(), { initialValue: [] });

  readonly centerOptions = computed(() => {
    const activeCenterId = this.permissions.activeCenterId();
    const centers = this.hospitals().map((hospital) => ({
      id: hospital.id,
      name: hospital.name,
    }));

    if (activeCenterId && !this.permissions.canListAllCenters()) {
      return centers.filter((center) => center.id === activeCenterId);
    }

    return centers;
  });

  readonly lockCenter = computed(
    () => Boolean(this.permissions.activeCenterId() && !this.permissions.canListAllCenters()),
  );

  readonly personResource = rxResource({
    params: () => this.personId(),
    stream: ({ params: id }) => {
      if (!id) {
        return of(null);
      }

      this.loadError.set(null);

      return this.adminRepository.getById(id).pipe(
        map((record) => record.formValue),
        catchError((error) => {
          this.loadError.set(mapHttpError(error));
          return of(null);
        }),
      );
    },
    defaultValue: null as PersonFormValue | null,
  });

  readonly loadingPerson = computed(() => this.isEditMode() && this.personResource.isLoading());

  readonly initialValue = computed((): PersonFormValue | null => {
    if (this.isEditMode()) {
      return this.personResource.value();
    }

    return this.createDefaultValue();
  });

  reloadPerson(): void {
    this.loadError.set(null);
    this.personResource.reload();
  }

  onIdentityBlurred(value: PersonFormValue): void {
    if (this.duplicateCheckTimer) {
      clearTimeout(this.duplicateCheckTimer);
    }

    this.duplicateCheckTimer = setTimeout(() => {
      void this.runDuplicateCheck(value, { openDialog: true });
    }, DUPLICATE_CHECK_DEBOUNCE_MS);
  }

  async onSubmitted(value: PersonFormValue): Promise<void> {
    this.saveError.set(null);
    this.duplicateCheckWarning.set(null);
    this.pendingSubmit.set(null);

    const duplicateResult = await firstValueFrom(
      this.duplicateCheck.checkDuplicates(value, this.personId()),
    );

    if (duplicateResult.searchFailed) {
      this.duplicateCheckWarning.set(
        'No pudimos verificar duplicados en este momento. Revisa manualmente antes de continuar.',
      );
    }

    if (duplicateResult.kind === 'exact') {
      this.openDuplicateDialog(duplicateResult);
      return;
    }

    if (duplicateResult.kind === 'similar') {
      this.pendingSubmit.set(value);
      this.openDuplicateDialog(duplicateResult);
      return;
    }

    await this.persist(value);
  }

  onDuplicateDismissed(): void {
    this.duplicateDialogOpen.set(false);
    this.pendingSubmit.set(null);
  }

  onDuplicateContinue(): void {
    const value = this.pendingSubmit();
    this.duplicateDialogOpen.set(false);
    this.pendingSubmit.set(null);

    if (value) {
      void this.persist(value);
    }
  }

  onDuplicateEdit(personId: string): void {
    this.duplicateDialogOpen.set(false);
    this.pendingSubmit.set(null);
    void this.router.navigate([this.paths.patientDetail(personId)]);
  }

  private async runDuplicateCheck(
    value: PersonFormValue,
    options: { openDialog: boolean },
  ): Promise<void> {
    const result = await firstValueFrom(
      this.duplicateCheck.checkDuplicates(value, this.personId()),
    );

    if (options.openDialog && result.kind !== 'none') {
      if (result.kind === 'similar') {
        this.pendingSubmit.set(null);
      }

      this.openDuplicateDialog(result);
    }
  }

  private openDuplicateDialog(result: DuplicateCheckResult): void {
    this.duplicateResult.set(result);
    this.duplicateDialogOpen.set(true);
  }

  private async persist(value: PersonFormValue): Promise<void> {
    this.saveError.set(null);
    this.saving.set(true);

    try {
      if (this.isEditMode() && this.personId()) {
        await firstValueFrom(this.adminRepository.update(this.personId()!, value));
      } else {
        await firstValueFrom(this.adminRepository.create(value));
      }

      this.duplicateCheck.clearCache();
      await this.router.navigate([this.paths.patients]);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        const cached = this.duplicateCheck.cachedResult();
        if (cached?.kind === 'exact') {
          this.openDuplicateDialog(cached);
          return;
        }
      }

      this.saveError.set(mapHttpError(error));
    } finally {
      this.saving.set(false);
    }
  }

  private createDefaultValue(): PersonFormValue {
    return {
      firstName: '',
      lastName: '',
      cedula: '',
      sex: null,
      ageApprox: null,
      status: 'hospitalized',
      admittedAt: defaultAdmittedAtLocal(),
      rescueEstadoId: '',
      rescueMunicipioId: '',
      rescueParroquiaId: null,
      centerId: this.permissions.activeCenterId() ?? '',
      contacts: '',
      notes: '',
    };
  }
}
