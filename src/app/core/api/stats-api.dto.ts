export interface ApiStatsDto {
  readonly total_centers?: number;
  readonly total_persons?: number;
  readonly total_volunteers?: number;
  readonly last_updated_at?: string;
}

export interface ApiStatsResponseDto {
  readonly data: {
    readonly stats: ApiStatsDto;
  };
}
