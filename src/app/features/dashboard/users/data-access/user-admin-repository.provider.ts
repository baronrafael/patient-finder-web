import { Provider, inject } from '@angular/core';

import { ApiUserAdminRepository } from './api-user-admin.repository';
import { USER_ADMIN_REPOSITORY } from './user-admin-repository.token';

export function provideUserAdminRepository(): Provider {
  return {
    provide: USER_ADMIN_REPOSITORY,
    useFactory: () => inject(ApiUserAdminRepository),
  };
}
