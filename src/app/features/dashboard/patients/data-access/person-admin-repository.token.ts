import { InjectionToken } from '@angular/core';

import { PersonAdminRepository } from './person-admin.repository';

export const PERSON_ADMIN_REPOSITORY = new InjectionToken<PersonAdminRepository>(
  'PERSON_ADMIN_REPOSITORY',
);
