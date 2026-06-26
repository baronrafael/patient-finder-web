import { InjectionToken } from '@angular/core';

import { PatientRepository } from './patient.repository';

export const PATIENT_REPOSITORY = new InjectionToken<PatientRepository>('PATIENT_REPOSITORY');
