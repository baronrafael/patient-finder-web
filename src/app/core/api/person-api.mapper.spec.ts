import { describe, expect, it } from 'vitest';

import { parseApiPagination } from './person-api.mapper';

describe('parseApiPagination', () => {
  it('uses API pagination when present', () => {
    expect(
      parseApiPagination(
        {
          current_page: 2,
          page_size: 20,
          total_records: 45,
          last_page: 3,
        },
        1,
        20,
        20,
      ),
    ).toEqual({
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it('falls back to request values and item count', () => {
    expect(parseApiPagination(undefined, 1, 20, 3)).toEqual({
      page: 1,
      pageSize: 20,
      total: 3,
      totalPages: 1,
    });
  });

  it('calculates totalPages when last_page is missing', () => {
    expect(
      parseApiPagination(
        {
          total_records: 45,
        },
        1,
        20,
        20,
      ).totalPages,
    ).toBe(3);
  });
});
