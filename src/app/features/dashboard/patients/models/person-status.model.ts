export const PERSON_STATUSES = [
  'hospitalized',
  'discharged',
  'deceased',
  'transferred',
] as const;

export type PersonStatus = (typeof PERSON_STATUSES)[number];

export const DEFAULT_PERSON_STATUS: PersonStatus = 'hospitalized';

export function isPersonStatus(value: string): value is PersonStatus {
  return (PERSON_STATUSES as readonly string[]).includes(value);
}
