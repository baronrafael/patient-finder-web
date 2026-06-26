import { PatientRecord } from '../models/patient-record.model';

export function buildPatientContactSummary(patient: PatientRecord): string {
  return [
    patient.fullName,
    patient.hospitalName,
    patient.identityDocument ? `Cédula: ${patient.identityDocument}` : null,
    patient.phone ? `Teléfono: ${patient.phone}` : null,
    patient.address ? `Dirección: ${patient.address}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

export function buildPatientShareSummary(patient: PatientRecord): string {
  return [
    patient.fullName,
    patient.hospitalName,
    patient.identityDocument ? `Cédula: ${patient.identityDocument}` : null,
    patient.phone ? `Teléfono: ${patient.phone}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}
