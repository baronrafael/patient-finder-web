export const PATIENT_FIELD_EMPTY_LABELS = {
  identityDocument: 'No registrada en esta lista',
  age: 'No registrada',
  address: 'No registrada',
  observations: 'Sin observaciones',
} as const;

export function hasPatientFieldValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}
