import { InjectionToken } from '@angular/core';

import { UserAdminRepository } from './user-admin.repository';

export const USER_ADMIN_REPOSITORY = new InjectionToken<UserAdminRepository>(
  'USER_ADMIN_REPOSITORY',
);
