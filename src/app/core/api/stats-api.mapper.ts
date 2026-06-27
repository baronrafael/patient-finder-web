import { PatientSearchStats } from '../../features/patient-search/models/patient-search-stats.model';
import { ApiStatsResponseDto } from './stats-api.dto';

export function mapStatsResponse(response: ApiStatsResponseDto): PatientSearchStats | null {
  const stats = response.data.stats;
  const lastUpdatedAt = stats.last_updated_at?.trim();

  if (!lastUpdatedAt) {
    return null;
  }

  return {
    totalPersons: stats.total_persons ?? 0,
    totalCenters: stats.total_centers ?? 0,
    lastUpdatedAt,
  };
}
