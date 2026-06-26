export const DASHBOARD_PATHS = {
  login: '/admin/login',
  patients: '/admin/pacientes',
  patientNew: '/admin/pacientes/nuevo',
  patientDetail: (id: string) => `/admin/pacientes/${id}`,
  users: '/admin/usuarios',
  profile: '/admin/perfil',
} as const;
