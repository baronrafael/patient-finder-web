import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { ApiUserAdminRepository } from './api-user-admin.repository';

describe('ApiUserAdminRepository', () => {
  let repository: ApiUserAdminRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiUserAdminRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'https://api.test' } },
      ],
    });

    repository = TestBed.inject(ApiUserAdminRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists users with pagination params', async () => {
    const listPromise = firstValueFrom(
      repository.list({
        page: 2,
        pageSize: 20,
      }),
    );

    const request = httpMock.expectOne(
      (req) => req.url === 'https://api.test/users' && req.params.get('page') === '2',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        users: [
          {
            id: 'user-1',
            email: 'ana@example.com',
            name: 'Ana',
            is_active: true,
          },
        ],
      },
      pagination: {
        current_page: 2,
        page_size: 20,
        total_records: 21,
        last_page: 2,
      },
    });

    const result = await listPromise;
    expect(result.items).toHaveLength(1);
    expect(result.page).toBe(2);
  });

  it('deletes a user with DELETE', async () => {
    const deletePromise = firstValueFrom(repository.delete('user-1'));

    const request = httpMock.expectOne('https://api.test/users/user-1');
    expect(request.request.method).toBe('DELETE');
    request.flush({});

    await expect(deletePromise).resolves.toBeUndefined();
  });

  it('lists role catalog options', async () => {
    const listPromise = firstValueFrom(repository.listRoles());

    const request = httpMock.expectOne('https://api.test/roles');
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        roles: [
          {
            id: 'role-1',
            name: 'admin',
            display_name: 'Administrador',
            is_global: true,
          },
        ],
      },
    });

    const roles = await listPromise;
    expect(roles).toEqual([
      {
        id: 'role-1',
        name: 'admin',
        displayName: 'Administrador',
        isGlobal: true,
      },
    ]);
  });

  it('loads a user with roles from GET /users/:id and /roles', async () => {
    const getPromise = firstValueFrom(repository.getById('user-1'));

    const userRequest = httpMock.expectOne('https://api.test/users/user-1');
    expect(userRequest.request.method).toBe('GET');
    userRequest.flush({
      data: {
        user: {
          id: 'user-1',
          email: 'ana@example.com',
          name: 'Ana',
          last_name: 'Pérez',
          is_active: true,
        },
      },
    });

    const rolesRequest = httpMock.expectOne('https://api.test/users/user-1/roles');
    expect(rolesRequest.request.method).toBe('GET');
    rolesRequest.flush({
      data: {
        roles: [
          {
            user_id: 'user-1',
            role_id: 'role-1',
            role_name: 'admin',
            is_global: true,
            center_id: null,
          },
        ],
      },
    });

    const record = await getPromise;
    expect(record.email).toBe('ana@example.com');
    expect(record.roles[0]?.roleId).toBe('role-1');
  });

  it('creates a user with POST', async () => {
    const createPromise = firstValueFrom(
      repository.create({
        email: 'new@example.com',
        name: 'Nuevo',
        lastName: '',
        password: 'secret123',
        isActive: true,
        roles: [
          {
            roleId: 'role-1',
            isGlobal: true,
            centerId: null,
          },
        ],
      }),
    );

    const request = httpMock.expectOne('https://api.test/users');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'new@example.com',
      name: 'Nuevo',
      password: 'secret123',
      is_active: true,
      roles: [{ role_id: 'role-1', center_id: null }],
    });
    request.flush({
      data: {
        user: {
          id: 'user-2',
          email: 'new@example.com',
          name: 'Nuevo',
          is_active: true,
        },
      },
    });

    const record = await createPromise;
    expect(record.id).toBe('user-2');
  });
});
