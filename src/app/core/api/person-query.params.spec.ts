import { describe, expect, it } from 'vitest';

import { buildPersonQueryHttpParams } from './person-query.params';

describe('buildPersonQueryHttpParams', () => {
  it('always includes page_size', () => {
    const params = buildPersonQueryHttpParams({ query: '', page: 1, pageSize: 20 });

    expect(params.get('page_size')).toBe('20');
    expect(params.get('page')).toBeNull();
  });

  it('normalizes document queries before sending q', () => {
    const params = buildPersonQueryHttpParams({
      query: '4.567.890',
      page: 1,
      pageSize: 20,
    });

    expect(params.get('q')).toBe('4567890');
  });

  it('includes optional filters and pagination', () => {
    const params = buildPersonQueryHttpParams({
      query: 'Garcia',
      page: 2,
      pageSize: 20,
      sex: 'f',
      centerId: 'center-1',
      status: 'hospitalized',
      estadoId: 'miranda',
      municipioId: 'chacao',
      parroquiaId: 'altamira',
    });

    expect(params.get('q')).toBe('Garcia');
    expect(params.get('page')).toBe('2');
    expect(params.get('sex')).toBe('f');
    expect(params.get('center_id')).toBe('center-1');
    expect(params.get('status')).toBe('hospitalized');
    expect(params.get('estado_id')).toBe('miranda');
    expect(params.get('municipio_id')).toBe('chacao');
    expect(params.get('parroquia_id')).toBe('altamira');
  });
});
