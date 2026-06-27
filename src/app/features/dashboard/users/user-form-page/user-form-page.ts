import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, firstValueFrom, map, of } from 'rxjs';

import { mapHttpError } from '../../../../core/http/http-error.mapper';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';
import { PATIENT_REPOSITORY } from '../../../patient-search/data-access/patient-repository.token';
import { UserForm } from '../components/user-form/user-form';
import { provideUserAdminRepository } from '../data-access/user-admin-repository.provider';
import { USER_ADMIN_REPOSITORY } from '../data-access/user-admin-repository.token';
import { UserFormValue } from '../models/user-form.model';
import {
  createDefaultUserFormValue,
  mapAdminUserRecordToFormValue,
  mapUserFormValueToWriteValue,
} from '../utils/user-form.mapper';

@Component({
  selector: 'app-user-form-page',
  imports: [
    RouterLink,
    PageHeader,
    PageShell,
    UserForm,
    LoadingSkeleton,
    ErrorState,
  ],
  providers: [provideUserAdminRepository()],
  templateUrl: './user-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminRepository = inject(USER_ADMIN_REPOSITORY);
  private readonly catalog = inject(PATIENT_REPOSITORY);

  readonly paths = DASHBOARD_PATHS;
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly catalogError = signal<string | null>(null);

  readonly userId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  readonly isEditMode = computed(() => Boolean(this.userId()));
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar voluntario' : 'Nuevo voluntario',
  );
  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Actualiza la cuenta, roles y estado del voluntario.'
      : 'Crea una cuenta con acceso al dashboard.',
  );
  readonly submitLabel = computed(() => {
    if (this.saving()) {
      return this.isEditMode() ? 'Guardando…' : 'Creando…';
    }

    return this.isEditMode() ? 'Guardar cambios' : 'Crear voluntario';
  });

  readonly hospitals = toSignal(this.catalog.getHospitals(), { initialValue: [] });

  readonly centerOptions = computed(() =>
    this.hospitals().map((hospital) => ({
      id: hospital.id,
      name: hospital.name,
    })),
  );

  readonly rolesResource = rxResource({
    stream: () =>
      this.adminRepository.listRoles().pipe(
        catchError((error) => {
          this.catalogError.set(mapHttpError(error));
          return of([]);
        }),
      ),
    defaultValue: [],
  });

  readonly roleOptions = computed(() => this.rolesResource.value());

  readonly userResource = rxResource({
    params: () => this.userId(),
    stream: ({ params: id }) => {
      if (!id) {
        return of(null);
      }

      this.loadError.set(null);

      return this.adminRepository.getById(id).pipe(
        map((record) => mapAdminUserRecordToFormValue(record)),
        catchError((error) => {
          this.loadError.set(mapHttpError(error));
          return of(null);
        }),
      );
    },
    defaultValue: null as UserFormValue | null,
  });

  readonly loadingUser = computed(() => this.isEditMode() && this.userResource.isLoading());
  readonly loadingCatalog = computed(() => this.rolesResource.isLoading());
  readonly loading = computed(() => this.loadingUser() || this.loadingCatalog());

  readonly initialValue = computed((): UserFormValue | null => {
    if (this.isEditMode()) {
      return this.userResource.value();
    }

    return createDefaultUserFormValue();
  });

  reloadUser(): void {
    this.loadError.set(null);
    this.userResource.reload();
  }

  retryCatalog(): void {
    this.catalogError.set(null);
    this.rolesResource.reload();
  }

  async onSubmitted(value: UserFormValue): Promise<void> {
    this.saveError.set(null);
    this.saving.set(true);

    try {
      const writeValue = mapUserFormValueToWriteValue(value, this.roleOptions());

      if (this.isEditMode() && this.userId()) {
        await firstValueFrom(this.adminRepository.update(this.userId()!, writeValue));
      } else {
        await firstValueFrom(this.adminRepository.create(writeValue));
      }

      await this.router.navigate([this.paths.users]);
    } catch (error) {
      this.saveError.set(mapHttpError(error));
    } finally {
      this.saving.set(false);
    }
  }
}
