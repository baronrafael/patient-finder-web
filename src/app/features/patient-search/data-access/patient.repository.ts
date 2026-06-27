import { Observable } from 'rxjs';

import { Hospital } from '../models/hospital.model';
import { Estado, Municipio, Parroquia } from '../models/location.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSearchResult } from '../models/patient-search-result.model';
import { PatientSearchStats } from '../models/patient-search-stats.model';

export abstract class PatientRepository {
  abstract getHospitals(): Observable<readonly Hospital[]>;
  abstract getEstados(): Observable<readonly Estado[]>;
  abstract getMunicipios(estadoId: string): Observable<readonly Municipio[]>;
  abstract getParroquias(municipioId: string): Observable<readonly Parroquia[]>;
  abstract search(query: PatientSearchQuery): Observable<PatientSearchResult>;
  abstract getStats(): Observable<PatientSearchStats | null>;
}
