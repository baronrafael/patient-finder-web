import { describe, expect, it } from 'vitest';

import { mapStatsResponse } from './stats-api.mapper';

describe('mapStatsResponse', () => {
  it('maps stats totals and last updated timestamp', () => {
    const stats = mapStatsResponse({
      data: {
        stats: {
          total_centers: 13,
          total_persons: 3133,
          total_volunteers: 0,
          last_updated_at: '2026-06-27T11:23:23.716419-04:00',
        },
      },
    });

    expect(stats).toEqual({
      totalCenters: 13,
      totalPersons: 3133,
      lastUpdatedAt: '2026-06-27T11:23:23.716419-04:00',
    });
  });

  it('returns null when last_updated_at is missing', () => {
    expect(
      mapStatsResponse({
        data: {
          stats: {
            total_centers: 13,
            total_persons: 3133,
          },
        },
      }),
    ).toBeNull();
  });
});
