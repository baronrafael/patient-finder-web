import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { DASHBOARD_PATHS } from '../routing/dashboard.paths';
import { AuthService } from './auth.service';
import { Permission } from './models/permission.model';
import { PermissionService } from './permission.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.createUrlTree([DASHBOARD_PATHS.login]);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree([DASHBOARD_PATHS.patients]) : true;
};

export function permissionGuard(...permissions: Permission[]): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);
    const allowed =
      permissions.length === 1
        ? permissionService.can(permissions[0])
        : permissionService.canAny(permissions);

    return allowed ? true : router.createUrlTree([DASHBOARD_PATHS.patients]);
  };
}
