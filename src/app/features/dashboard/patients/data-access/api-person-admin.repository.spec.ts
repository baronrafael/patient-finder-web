import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, afterEach, beforeEach } from 'vitest';

import { APP_CONFIG } from '../../../../core/config/app-config.token';
import { PATIENT_REPOSITORY } from '../../../patient-search/data-access/patient-repository.token';
import { EMPTY_PERSON_FORM } from '../models/person-form.model';
import { ApiPersonAdminRepository } from './api-person-admin.repository';

describe('ApiPersonAdminRepository', () => {
  let repository: ApiPersonAdminRepository;
  let httpMock: HttpTestingController;

  const catalog = {
    getEstados: () => {
      throw new Error('not used');
    },
    getMunicipios: () => {
      throw new Error('not used');
    },
    getParroquias: () => {
      throw new Error('not used');
    },
    getHospitals: () => {
      throw new Error('not used');
    },
    search: () => {
      throw new Error('not used');
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiPersonAdminRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'https://api.test' } },
        { provide: PATIENT_REPOSITORY, useValue: catalog },
      ],
    });

    repository = TestBed.inject(ApiPersonAdminRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('updates a person with PATCH', async () => {
    const value = {
      ...EMPTY_PERSON_FORM,
      firstName: 'Ana',
      lastName: 'Pérez',
      cedula: '28443736',
      admittedAt: '2026-06-26T10:00',
      rescueEstadoId: 'estado-1',
      rescueMunicipioId: 'municipio-1',
      centerId: 'center-1',
    };

    const updatePromise = firstValueFrom(repository.update('person-1', value));

    const request = httpMock.expectOne('https://api.test/persons/person-1');
    expect(request.request.method).toBe('PATCH');
    request.flush({
      data: {
        person: {
          id: 'person-1',
          first_name: 'Ana',
          last_name: 'Pérez',
        },
      },
    });

    const result = await updatePromise;
    expect(result.id).toBe('person-1');
    expect(result.formValue).toEqual(value);
  });

  it('deletes a person with DELETE', async () => {
    const deletePromise = firstValueFrom(repository.delete('person-1'));

    const request = httpMock.expectOne('https://api.test/persons/person-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(deletePromise).resolves.toBeUndefined();
  });
});
