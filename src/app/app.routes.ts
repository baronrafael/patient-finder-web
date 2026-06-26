import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/patient-search/patient-search.routes').then((m) => m.patientSearchRoutes),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
