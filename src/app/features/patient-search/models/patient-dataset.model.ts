import { Hospital } from './hospital.model';
import { PatientRecord } from './patient-record.model';

export interface PatientDatasetMetadata {
  readonly sourceFile: string;
  readonly sourceSheet: string;
  readonly updatedAt: string;
  readonly generatedAt: string;
  readonly totalRecords: number;
}

export interface PatientDataset {
  readonly metadata: PatientDatasetMetadata;
  readonly hospitals: readonly Hospital[];
  readonly patients: readonly PatientRecord[];
}
