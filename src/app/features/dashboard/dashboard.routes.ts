import { Routes } from '@angular/router';

import { authGuard, guestGuard, permissionGuard } from '../../core/auth/auth.guards';
import { USER_PERMISSIONS } from '../../core/auth/models/permission.model';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';

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
        redirectTo: 'pacientes',
        pathMatch: 'full',
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./patients/patient-list-page/patient-list-page').then((m) => m.PatientListPage),
      },
      {
        path: 'pacientes/nuevo',
        loadComponent: () =>
          import('./patients/patient-form-page/patient-form-page').then((m) => m.PatientFormPage),
        canActivate: [permissionGuard('persons.create')],
      },
      {
        path: 'pacientes/:id',
        loadComponent: () =>
          import('./patients/patient-form-page/patient-form-page').then((m) => m.PatientFormPage),
        canActivate: [permissionGuard('persons.edit')],
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./users/user-list-page/user-list-page').then((m) => m.UserListPage),
        canActivate: [permissionGuard(...USER_PERMISSIONS)],
      },
      {
        path: 'perfil',
        loadComponent: () => import('./profile/profile-page/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
];
