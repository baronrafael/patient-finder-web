import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, take } from 'rxjs';

import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Hospital } from '../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../models/location.model';
import { PatientDataset } from '../models/patient-dataset.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSearchResult } from '../models/patient-search-result.model';
import { searchPatients } from '../utils/patient-search.rank';
import { PatientRepository } from './patient.repository';

interface LocationsDataset {
  readonly data: readonly Estado[];
}

@Injectable({ providedIn: 'root' })
export class MockPatientRepository extends PatientRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly dataset$ = this.http
    .get<PatientDataset>(this.config.mockDataUrl)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  private readonly estados$ = this.http
    .get<LocationsDataset>(this.config.locationsMockUrl)
    .pipe(
      map((dataset) => dataset.data),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  override getHospitals(): Observable<readonly Hospital[]> {
    return this.dataset$.pipe(map((dataset) => dataset.hospitals));
  }

  override getEstados(): Observable<readonly Estado[]> {
    return this.estados$;
  }

  override getMunicipios(estadoId: string): Observable<readonly Municipio[]> {
    return this.estados$.pipe(
      map((estados) => estados.find((estado) => estado.id === estadoId)?.municipios ?? []),
      take(1),
    );
  }

  override getParroquias(municipioId: string): Observable<readonly Parroquia[]> {
    return this.estados$.pipe(
      map((estados) => {
        for (const estado of estados) {
          const municipio = estado.municipios?.find((item) => item.id === municipioId);
          if (municipio) {
            return municipio.parroquias ?? [];
          }
        }
        return [];
      }),
      take(1),
    );
  }

  override search(query: PatientSearchQuery): Observable<PatientSearchResult> {
    return this.dataset$.pipe(
      map((dataset) => searchPatients(dataset.patients, query, dataset.metadata.updatedAt)),
    );
  }
}
