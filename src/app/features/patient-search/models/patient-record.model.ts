export type MatchConfidenceLevel = 'high' | 'medium' | 'low';

export interface PatientRecord {
  readonly id: string;
  readonly sourceRow: number;
  readonly fullName: string;
  readonly age: string | null;
  readonly identityDocument: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly observations: string | null;
  readonly hospitalId: string;
  readonly hospitalName: string;
  readonly sourceHospitalName: string;
  readonly score: number | null;
  readonly matchConfidence: MatchConfidenceLevel | null;
}
