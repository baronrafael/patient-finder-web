import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionService } from '../../../../core/auth/permission.service';
import { PERSON_ADMIN_REPOSITORY } from '../data-access/person-admin-repository.token';
import { PersonListResult } from '../models/person-list-result.model';
import { PatientListStore } from './patient-list.store';

const emptyResult: PersonListResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('PatientListStore', () => {
  const activeCenterId = signal<string | null>('center-1');
  const hasMultipleCenters = signal(false);
  const canListAllCenters = signal(false);
  const list = vi.fn(() => of(emptyResult));
  const deleteFn = vi.fn(() => of(undefined));

  beforeEach(() => {
    activeCenterId.set('center-1');
    hasMultipleCenters.set(false);
    canListAllCenters.set(false);
    list.mockClear();
    deleteFn.mockClear();

    TestBed.configureTestingModule({
      providers: [
        PatientListStore,
        {
          provide: PERSON_ADMIN_REPOSITORY,
          useValue: { list, delete: deleteFn },
        },
        {
          provide: PermissionService,
          useValue: {
            activeCenterId: activeCenterId.asReadonly(),
            hasMultipleCenters: hasMultipleCenters.asReadonly(),
            canListAllCenters: canListAllCenters.asReadonly(),
            can: () => true,
          },
        },
      ],
    });
  });

  it('requires center selection when multiple centers are available', () => {
    hasMultipleCenters.set(true);
    activeCenterId.set(null);
    canListAllCenters.set(false);
    const store = TestBed.inject(PatientListStore);

    expect(store.needsCenterSelection()).toBe(true);
    expect(store.initialLoading()).toBe(false);
  });

  it('does not require center selection for global readers', () => {
    hasMultipleCenters.set(true);
    activeCenterId.set(null);
    canListAllCenters.set(true);
    const store = TestBed.inject(PatientListStore);

    expect(store.needsCenterSelection()).toBe(false);
  });

  it('applies trimmed filters on submit', () => {
    const store = TestBed.inject(PatientListStore);

    store.submitFilters({
      query: '  Garcia ',
      centerId: 'center-1',
      sex: 'm',
      status: 'hospitalized',
    });

    expect(store.appliedFiltersState()).toEqual({
      query: 'Garcia',
      centerId: 'center-1',
      sex: 'm',
      status: 'hospitalized',
    });
    expect(store.hasActiveFilters()).toBe(true);
  });

  it('clears applied filters but keeps locked center', () => {
    const store = TestBed.inject(PatientListStore);

    store.submitFilters({ query: 'Garcia', centerId: 'center-1', sex: null, status: null });
    store.clearFilters();

    expect(store.appliedFiltersState()).toEqual({
      query: '',
      centerId: 'center-1',
      sex: null,
      status: null,
    });
    expect(store.hasActiveFilters()).toBe(false);
  });

  it('reloads when submitting the same filters again', () => {
    const store = TestBed.inject(PatientListStore);
    const reloadSpy = vi.spyOn(store.listResource, 'reload');

    store.submitFilters({ query: 'Garcia', centerId: 'center-1', sex: null, status: null });
    store.submitFilters({ query: 'Garcia', centerId: 'center-1', sex: null, status: null });

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('deletes a person and reloads the list', async () => {
    const store = TestBed.inject(PatientListStore);
    const reloadSpy = vi.spyOn(store.listResource, 'reload');

    const deleted = await store.deletePerson('person-1');

    expect(deleted).toBe(true);
    expect(deleteFn).toHaveBeenCalledWith('person-1');
    expect(reloadSpy).toHaveBeenCalled();
    expect(store.deleteError()).toBeNull();
  });
});
