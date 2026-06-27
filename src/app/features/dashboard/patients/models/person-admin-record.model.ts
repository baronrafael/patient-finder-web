import { PersonFormValue } from '../models/person-form.model';

export interface PersonAdminRecord {
  readonly id: string;
  readonly formValue: PersonFormValue;
}
