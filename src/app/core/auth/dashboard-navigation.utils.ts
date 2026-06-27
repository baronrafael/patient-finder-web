import { DASHBOARD_PATHS } from '../routing/dashboard.paths';

export interface DashboardAccess {
  canAccessPatients(): boolean;
  canAccessUsers(): boolean;
}

export function resolveDefaultDashboardPath(access: DashboardAccess): string {
  if (access.canAccessPatients()) {
    return DASHBOARD_PATHS.patients;
  }

  if (access.canAccessUsers()) {
    return DASHBOARD_PATHS.users;
  }

  return DASHBOARD_PATHS.profile;
}
