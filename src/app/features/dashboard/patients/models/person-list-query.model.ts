import { PersonSex } from '../../../../core/models/person-sex.model';

export interface PersonListQuery {
  readonly query: string;
  readonly centerId: string | null;
  readonly sex: PersonSex | null;
  readonly status: string | null;
  readonly page: number;
  readonly pageSize: number;
}
