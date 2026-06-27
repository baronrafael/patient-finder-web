import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { PermissionService } from '../../../../core/auth/permission.service';
import { PATIENT_REPOSITORY } from '../../../patient-search/data-access/patient-repository.token';

@Component({
  selector: 'app-center-selector',
  templateUrl: './center-selector.html',
  styleUrl: './center-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterSelector {
  private readonly permissions = inject(PermissionService);
  private readonly repository = inject(PATIENT_REPOSITORY);

  private readonly hospitals = toSignal(this.repository.getHospitals(), { initialValue: [] });

  readonly showSelector = this.permissions.hasMultipleCenters;
  readonly activeCenterId = this.permissions.activeCenterId;
  readonly canListAllCenters = this.permissions.canListAllCenters;

  readonly centerOptions = computed(() => {
    const labels = Object.fromEntries(this.hospitals().map((hospital) => [hospital.id, hospital.name]));

    return this.permissions.availableCenterIds().map((centerId) => ({
      id: centerId,
      name: labels[centerId] ?? centerId,
    }));
  });

  onCenterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.permissions.setActiveCenter(value || null);
  }
}
