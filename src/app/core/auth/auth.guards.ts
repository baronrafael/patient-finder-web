import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { DASHBOARD_PATHS } from '../routing/dashboard.paths';
import { resolveDefaultDashboardPath } from './dashboard-navigation.utils';
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
  const permissions = inject(PermissionService);

  return auth.isAuthenticated()
    ? router.createUrlTree([resolveDefaultDashboardPath(permissions)])
    : true;
};

export const defaultDashboardGuard: CanActivateFn = () => {
  const router = inject(Router);
  const permissions = inject(PermissionService);

  return router.createUrlTree([resolveDefaultDashboardPath(permissions)]);
};

export function permissionGuard(...permissions: Permission[]): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);
    const allowed =
      permissions.length === 1
        ? permissionService.can(permissions[0])
        : permissionService.canAny(permissions);

    if (allowed) {
      return true;
    }

    const fallback = resolveDefaultDashboardPath(permissionService);
    if (fallback === DASHBOARD_PATHS.profile) {
      return router.createUrlTree([DASHBOARD_PATHS.profile]);
    }

    return router.createUrlTree([fallback]);
  };
}
