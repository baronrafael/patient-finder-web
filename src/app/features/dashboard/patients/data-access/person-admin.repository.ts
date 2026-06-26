import { Observable } from 'rxjs';

import { PersonListQuery } from '../models/person-list-query.model';
import { PersonListResult } from '../models/person-list-result.model';

export abstract class PersonAdminRepository {
  abstract list(query: PersonListQuery): Observable<PersonListResult>;
}
