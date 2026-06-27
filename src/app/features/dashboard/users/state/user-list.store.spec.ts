import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionService } from '../../../../core/auth/permission.service';
import { USER_ADMIN_REPOSITORY } from '../data-access/user-admin-repository.token';
import { UserListResult } from '../models/user-list-result.model';
import { UserListStore } from './user-list.store';

const emptyResult: UserListResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('UserListStore', () => {
  const list = vi.fn(() => of(emptyResult));
  const deleteFn = vi.fn(() => of(undefined));

  beforeEach(() => {
    list.mockClear();
    deleteFn.mockClear();

    TestBed.configureTestingModule({
      providers: [
        UserListStore,
        {
          provide: USER_ADMIN_REPOSITORY,
          useValue: { list, delete: deleteFn },
        },
        {
          provide: PermissionService,
          useValue: {
            can: () => true,
          },
        },
      ],
    });
  });

  it('maps row permissions from the current session', async () => {
    list.mockReturnValueOnce(
      of({
        items: [
          {
            id: 'user-1',
            fullName: 'Ana Pérez',
            email: 'ana@example.com',
            rolesLabel: 'Admin',
            isActive: true,
            statusLabel: 'Activo',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }),
    );

    const store = TestBed.inject(UserListStore);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.items()[0]?.canEdit).toBe(true);
    expect(store.items()[0]?.canDelete).toBe(true);
  });

  it('deletes a user and reloads the list', async () => {
    const store = TestBed.inject(UserListStore);
    const reloadSpy = vi.spyOn(store.listResource, 'reload');

    const deleted = await store.deleteUser('user-1');

    expect(deleted).toBe(true);
    expect(deleteFn).toHaveBeenCalledWith('user-1');
    expect(reloadSpy).toHaveBeenCalled();
  });
});
