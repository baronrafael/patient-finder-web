import { PatientRecord } from '../../../patient-search/models/patient-record.model';

export type DuplicateMatchKind = 'exact' | 'similar';

export interface DuplicateMatch {
  readonly patient: PatientRecord;
  readonly kind: DuplicateMatchKind;
}

export type DuplicateCheckKind = 'none' | 'exact' | 'similar';

export interface DuplicateCheckResult {
  readonly kind: DuplicateCheckKind;
  readonly query: string;
  readonly matches: readonly DuplicateMatch[];
  readonly primaryMatch: DuplicateMatch | null;
  readonly searchFailed: boolean;
}

export function emptyDuplicateCheckResult(query = '', searchFailed = false): DuplicateCheckResult {
  return {
    kind: 'none',
    query,
    matches: [],
    primaryMatch: null,
    searchFailed,
  };
}
