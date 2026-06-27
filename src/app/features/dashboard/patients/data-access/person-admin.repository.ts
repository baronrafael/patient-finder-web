import { Observable } from 'rxjs';

import { PersonAdminRecord } from '../models/person-admin-record.model';
import { PersonFormValue } from '../models/person-form.model';
import { PersonListQuery } from '../models/person-list-query.model';
import { PersonListResult } from '../models/person-list-result.model';

export abstract class PersonAdminRepository {
  abstract list(query: PersonListQuery): Observable<PersonListResult>;

  abstract getById(id: string): Observable<PersonAdminRecord>;

  abstract create(value: PersonFormValue): Observable<PersonAdminRecord>;

  abstract update(id: string, value: PersonFormValue): Observable<PersonAdminRecord>;
}
