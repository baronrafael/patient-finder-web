import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import { AUTH_STORAGE, AUTH_STORAGE_KEYS } from './auth.constants';
import { AuthService } from './auth.service';
import { Permission, PERSON_PERMISSIONS, USER_PERMISSIONS } from './models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly auth = inject(AuthService);

  private readonly activeCenterIdState = signal<string | null>(this.readStoredCenterId());

  readonly activeCenterId = this.activeCenterIdState.asReadonly();

  readonly availableCenterIds = computed(() => {
    const session = this.auth.session();
    if (!session) {
      return [] as string[];
    }

    return Object.keys(session.centerPermissions).filter(
      (centerId) => session.centerPermissions[centerId]?.length,
    );
  });

  readonly hasMultipleCenters = computed(() => this.availableCenterIds().length > 1);

  readonly canListAllCenters = computed(
    () => this.auth.session()?.globalPermissions.includes('patients:read') ?? false,
  );

  readonly canAccessPatients = computed(() => this.canAny(PERSON_PERMISSIONS));
  readonly canAccessUsers = computed(() => this.canAny(USER_PERMISSIONS));

  constructor() {
    effect(() => {
      const session = this.auth.session();
      const centerIds = this.availableCenterIds();

      untracked(() => {
        if (!session) {
          if (this.activeCenterIdState() !== null) {
            this.setActiveCenter(null);
          }
          return;
        }

        const activeCenterId = this.activeCenterIdState();
        if (activeCenterId && !centerIds.includes(activeCenterId)) {
          this.setActiveCenter(centerIds.length === 1 ? centerIds[0] : null);
          return;
        }

        if (centerIds.length === 1 && !activeCenterId) {
          this.setActiveCenter(centerIds[0]);
        }
      });
    });
  }

  can(permission: Permission, centerId?: string | null): boolean {
    const session = this.auth.session();
    if (!session) {
      return false;
    }

    if (session.globalPermissions.includes(permission)) {
      return true;
    }

    const resolvedCenterId = centerId ?? this.activeCenterIdState();
    if (!resolvedCenterId) {
      return Object.values(session.centerPermissions).some((permissions) =>
        permissions.includes(permission),
      );
    }

    return session.centerPermissions[resolvedCenterId]?.includes(permission) ?? false;
  }

  canAny(permissions: readonly Permission[], centerId?: string | null): boolean {
    return permissions.some((permission) => this.can(permission, centerId));
  }

  setActiveCenter(centerId: string | null): void {
    this.activeCenterIdState.set(centerId);

    if (centerId) {
      AUTH_STORAGE.setItem(AUTH_STORAGE_KEYS.activeCenterId, centerId);
      return;
    }

    AUTH_STORAGE.removeItem(AUTH_STORAGE_KEYS.activeCenterId);
  }

  private readStoredCenterId(): string | null {
    return AUTH_STORAGE.getItem(AUTH_STORAGE_KEYS.activeCenterId);
  }
}
