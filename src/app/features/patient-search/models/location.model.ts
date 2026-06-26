export interface Parroquia {
  readonly id: string;
  readonly name: string;
}

export interface Municipio {
  readonly id: string;
  readonly name: string;
  readonly parroquias?: readonly Parroquia[];
}

export interface Estado {
  readonly id: string;
  readonly name: string;
  readonly municipios?: readonly Municipio[];
}
