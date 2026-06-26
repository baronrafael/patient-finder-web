import { Provider, inject } from '@angular/core';

import { APP_CONFIG } from '../../../core/config/app-config.token';
import { ApiPatientRepository } from './api-patient.repository';
import { MockPatientRepository } from './mock-patient.repository';
import { PATIENT_REPOSITORY } from './patient-repository.token';

export function providePatientRepository(): Provider {
  return {
    provide: PATIENT_REPOSITORY,
    useFactory: () => {
      const config = inject(APP_CONFIG);
      return config.useMockData ? inject(MockPatientRepository) : inject(ApiPatientRepository);
    },
  };
}
