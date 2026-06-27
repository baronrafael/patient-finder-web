import { PersonFormValue } from '../models/person-form.model';
import { ApiPersonWriteDto } from '../../../../core/api/person-api.dto';
import { PersonSex } from '../../../../core/models/person-sex.model';
import { normalizePersonFormCedula } from '../utils/person-form.validation';
import { localDateTimeToIso } from '../utils/person-form.mapper';

export function mapPersonFormToWriteDto(value: PersonFormValue): ApiPersonWriteDto {
  const cedula = normalizePersonFormCedula(value.cedula);
  const sex = mapFormSexToApi(value.sex);

  return {
    ...(value.firstName ? { first_name: value.firstName } : {}),
    ...(value.lastName ? { last_name: value.lastName } : {}),
    ...(cedula ? { cedula } : {}),
    ...(sex ? { sex } : {}),
    ...(value.ageApprox != null ? { age_approx: value.ageApprox } : {}),
    status: value.status,
    admitted_at: localDateTimeToIso(value.admittedAt),
    rescue_estado_id: value.rescueEstadoId,
    rescue_municipio_id: value.rescueMunicipioId,
    ...(value.rescueParroquiaId ? { rescue_parroquia_id: value.rescueParroquiaId } : {}),
    center_id: value.centerId,
    ...(value.contacts ? { contacts: value.contacts } : {}),
    ...(value.notes ? { notes: value.notes } : {}),
  };
}

function mapFormSexToApi(sex: PersonSex | null): 'M' | 'F' | null {
  switch (sex) {
    case 'm':
      return 'M';
    case 'f':
      return 'F';
    default:
      return null;
  }
}
