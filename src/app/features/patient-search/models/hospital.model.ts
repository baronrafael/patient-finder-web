export interface Hospital {
  readonly id: string;
  readonly name: string;
  readonly sourceNames: readonly string[];
  readonly recordCount: number;
  readonly estadoId?: string | null;
  readonly municipioId?: string | null;
  readonly parroquiaId?: string | null;
}
