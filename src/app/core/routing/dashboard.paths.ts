export const DASHBOARD_PATHS = {
  login: '/admin/login',
  patients: '/admin/pacientes',
  patientNew: '/admin/pacientes/nuevo',
  patientDetail: (id: string) => `/admin/pacientes/${id}`,
  users: '/admin/usuarios',
  userNew: '/admin/usuarios/nuevo',
  userDetail: (id: string) => `/admin/usuarios/${id}`,
  profile: '/admin/perfil',
} as const;
