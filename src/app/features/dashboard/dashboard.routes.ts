import { Routes } from '@angular/router';

import { authGuard, defaultDashboardGuard, guestGuard, permissionGuard } from '../../core/auth/auth.guards';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';
import { DashboardDefaultPage } from './layout/dashboard-default-page/dashboard-default-page';

export const dashboardRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login-page/login-page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: DashboardLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [defaultDashboardGuard],
        component: DashboardDefaultPage,
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./patients/patient-list-page/patient-list-page').then((m) => m.PatientListPage),
        canActivate: [permissionGuard('patients:read')],
      },
      {
        path: 'pacientes/nuevo',
        loadComponent: () =>
          import('./patients/patient-form-page/patient-form-page').then((m) => m.PatientFormPage),
        canActivate: [permissionGuard('patients:create')],
      },
      {
        path: 'pacientes/:id',
        loadComponent: () =>
          import('./patients/patient-form-page/patient-form-page').then((m) => m.PatientFormPage),
        canActivate: [permissionGuard('patients:update')],
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./users/user-list-page/user-list-page').then((m) => m.UserListPage),
        canActivate: [permissionGuard('users:read')],
      },
      {
        path: 'perfil',
        loadComponent: () => import('./profile/profile-page/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
];
