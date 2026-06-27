import { Observable, map, of, switchMap } from 'rxjs';

import { ApiPersonDto } from '../../../../core/api/person-api.dto';
import { formatPersonContacts } from '../../../../core/api/person-api.mapper';
import { PersonSex } from '../../../../core/models/person-sex.model';
import { normalizeSearchText } from '../../../../core/utils/normalize-search-text';
import { PatientRepository } from '../../../patient-search/data-access/patient.repository';
import { PersonFormValue } from '../models/person-form.model';
import { DEFAULT_PERSON_STATUS, isPersonStatus, PersonStatus } from '../models/person-status.model';
import { defaultAdmittedAtLocal } from '../utils/person-form.mapper';

export function resolvePersonFormValue(
  person: ApiPersonDto,
  catalog: PatientRepository,
): Observable<PersonFormValue> {
  return catalog.getEstados().pipe(
    switchMap((estados) => {
      const estado = findLocationByName(estados, person.rescue_estado);
      if (!estado) {
        return of(mapPersonDtoToFormValue(person, '', '', null));
      }

      return catalog.getMunicipios(estado.id).pipe(
        switchMap((municipios) => {
          const municipio = findLocationByName(municipios, person.rescue_municipio);
          if (!municipio) {
            return of(mapPersonDtoToFormValue(person, estado.id, '', null));
          }

          return catalog.getParroquias(municipio.id).pipe(
            map((parroquias) => {
              const parroquia = findLocationByName(parroquias, person.rescue_parroquia);
              return mapPersonDtoToFormValue(
                person,
                estado.id,
                municipio.id,
                parroquia?.id ?? null,
              );
            }),
          );
        }),
      );
    }),
  );
}

function findLocationByName<T extends { readonly id: string; readonly name: string }>(
  items: readonly T[],
  name: string | null | undefined,
): T | undefined {
  if (!name?.trim()) {
    return undefined;
  }

  const normalizedName = normalizeSearchText(name);
  return items.find((item) => normalizeSearchText(item.name) === normalizedName);
}

function mapPersonDtoToFormValue(
  person: ApiPersonDto,
  rescueEstadoId: string,
  rescueMunicipioId: string,
  rescueParroquiaId: string | null,
): PersonFormValue {
  const rawStatus = person.status?.trim() ?? '';
  const status: PersonStatus = isPersonStatus(rawStatus) ? rawStatus : DEFAULT_PERSON_STATUS;

  return {
    firstName: person.first_name?.trim() ?? '',
    lastName: person.last_name?.trim() ?? '',
    cedula: person.cedula?.trim() ?? '',
    sex: parseApiPersonSex(person.sex),
    ageApprox: person.age_approx ?? null,
    status,
    admittedAt: person.admitted_at
      ? defaultAdmittedAtLocal(new Date(person.admitted_at))
      : defaultAdmittedAtLocal(),
    rescueEstadoId,
    rescueMunicipioId,
    rescueParroquiaId,
    centerId: person.center?.id ?? '',
    contacts: formatPersonContacts(person.contacts) ?? '',
    notes: person.notes?.trim() ?? '',
  };
}

function parseApiPersonSex(sex: string | null | undefined): PersonSex | null {
  switch (sex?.trim().toUpperCase()) {
    case 'M':
      return 'm';
    case 'F':
      return 'f';
    default:
      return null;
  }
}
