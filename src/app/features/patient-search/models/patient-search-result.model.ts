import { PatientRecord } from './patient-record.model';

export interface PatientSearchResult {
  readonly items: readonly PatientRecord[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly updatedAt: string;
}
