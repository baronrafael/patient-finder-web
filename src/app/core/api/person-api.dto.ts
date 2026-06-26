export interface ApiStateDto {
  readonly id: string;
  readonly name: string;
}

export interface ApiMunicipalityDto {
  readonly id: string;
  readonly name: string;
  readonly estado_id?: string;
}

export interface ApiParishDto {
  readonly id: string;
  readonly name: string;
  readonly municipio_id?: string;
}

export interface ApiStatesResponseDto {
  readonly data: {
    readonly states: readonly ApiStateDto[];
  };
}

export interface ApiMunicipalitiesResponseDto {
  readonly data: {
    readonly municipalities: readonly ApiMunicipalityDto[];
  };
}

export interface ApiParishesResponseDto {
  readonly data: {
    readonly parishes: readonly ApiParishDto[];
  };
}

export interface ApiCenterDto {
  readonly id: string;
  readonly name: string;
  readonly type?: string;
  readonly estado_id?: string | null;
  readonly municipio_id?: string | null;
  readonly parroquia_id?: string | null;
  readonly address?: string | null;
  readonly is_active?: boolean;
  readonly contacts?: unknown;
}

export interface ApiCentersResponseDto {
  readonly data: {
    readonly centers: readonly ApiCenterDto[];
  };
  readonly pagination?: ApiPaginationDto;
}

export interface ApiPersonDto {
  readonly id: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly cedula?: string | null;
  readonly sex?: string | null;
  readonly age_approx?: number | null;
  readonly status?: string | null;
  readonly admitted_at?: string | null;
  readonly rescue_estado?: string | null;
  readonly rescue_municipio?: string | null;
  readonly rescue_parroquia?: string | null;
  readonly center?: ApiCenterDto | null;
  readonly notes?: string | null;
  readonly contacts?: unknown;
  readonly created_at?: string | null;
}

export interface ApiPaginationDto {
  readonly current_page?: number;
  readonly page_size?: number;
  readonly first_page?: number;
  readonly last_page?: number;
  readonly total_records?: number;
}

export interface ApiPersonListResponseDto {
  readonly data: {
    readonly persons: readonly ApiPersonDto[];
  };
  readonly pagination?: ApiPaginationDto;
}
