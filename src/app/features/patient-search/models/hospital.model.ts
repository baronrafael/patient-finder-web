export interface Hospital {
  readonly id: string;
  readonly name: string;
  readonly sourceNames: readonly string[];
  readonly recordCount: number;
}
