import { Provider, inject } from '@angular/core';

import { ApiPersonAdminRepository } from './api-person-admin.repository';
import { PERSON_ADMIN_REPOSITORY } from './person-admin-repository.token';

export function providePersonAdminRepository(): Provider {
  return {
    provide: PERSON_ADMIN_REPOSITORY,
    useFactory: () => inject(ApiPersonAdminRepository),
  };
}
