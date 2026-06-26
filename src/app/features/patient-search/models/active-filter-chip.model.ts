export type ActiveFilterKey = 'hospital' | 'sex' | 'estado' | 'municipio' | 'parroquia';

export interface ActiveFilterChip {
  readonly key: ActiveFilterKey;
  readonly label: string;
}
