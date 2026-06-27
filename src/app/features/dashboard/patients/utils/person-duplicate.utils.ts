import { normalizeDocument } from '../../../../core/utils/normalize-document';
import { normalizeSearchText } from '../../../../core/utils/normalize-search-text';
import { PatientRecord } from '../../../patient-search/models/patient-record.model';
import { MIN_NAME_QUERY_LENGTH } from '../../../patient-search/utils/patient-search.constants';
import { PersonFormValue } from '../models/person-form.model';
import {
  DuplicateCheckResult,
  DuplicateMatch,
  DuplicateMatchKind,
  emptyDuplicateCheckResult,
} from '../models/duplicate-check-result.model';
import { MIN_PERSON_CEDULA_DIGITS } from './person-form.constants';
import { normalizePersonFormCedula } from './person-form.validation';

export function buildDuplicateSearchQuery(form: PersonFormValue): string | null {
  const cedula = normalizePersonFormCedula(form.cedula);
  if (cedula.length >= MIN_PERSON_CEDULA_DIGITS) {
    return cedula;
  }

  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return null;
}

export function classifyPersonDuplicate(
  form: PersonFormValue,
  candidate: PatientRecord,
): DuplicateMatchKind | null {
  if (isExactDuplicateMatch(form, candidate)) {
    return 'exact';
  }

  if (isSimilarDuplicateMatch(form, candidate)) {
    return 'similar';
  }

  return null;
}

export function classifyDuplicateMatches(
  form: PersonFormValue,
  candidates: readonly PatientRecord[],
  query: string,
): DuplicateCheckResult {
  const matches: DuplicateMatch[] = [];

  for (const patient of candidates) {
    const kind = classifyPersonDuplicate(form, patient);
    if (kind) {
      matches.push({ patient, kind });
    }
  }

  matches.sort((left, right) => {
    if (left.kind === right.kind) {
      return left.patient.fullName.localeCompare(right.patient.fullName, 'es-VE');
    }

    return left.kind === 'exact' ? -1 : 1;
  });

  const exactMatches = matches.filter((match) => match.kind === 'exact');
  if (exactMatches.length > 0) {
    return {
      kind: 'exact',
      query,
      matches: exactMatches,
      primaryMatch: exactMatches[0] ?? null,
      searchFailed: false,
    };
  }

  const similarMatches = matches.filter((match) => match.kind === 'similar');
  if (similarMatches.length > 0) {
    return {
      kind: 'similar',
      query,
      matches: similarMatches,
      primaryMatch: similarMatches[0] ?? null,
      searchFailed: false,
    };
  }

  return emptyDuplicateCheckResult(query);
}

export function isExactDuplicateMatch(form: PersonFormValue, candidate: PatientRecord): boolean {
  const formCedula = normalizePersonFormCedula(form.cedula);
  const candidateCedula = candidate.identityDocument
    ? normalizeDocument(candidate.identityDocument)
    : '';

  if (formCedula.length >= MIN_PERSON_CEDULA_DIGITS && candidateCedula === formCedula) {
    return true;
  }

  return (
    formCedula.length >= MIN_PERSON_CEDULA_DIGITS &&
    candidateCedula === formCedula &&
    personNamesMatch(form, candidate)
  );
}

export function isSimilarDuplicateMatch(form: PersonFormValue, candidate: PatientRecord): boolean {
  if (isExactDuplicateMatch(form, candidate)) {
    return false;
  }

  const formName = normalizePersonFullName(form);
  const candidateName = normalizeSearchText(candidate.fullName);

  if (formName.length < MIN_NAME_QUERY_LENGTH || candidateName.length < MIN_NAME_QUERY_LENGTH) {
    return false;
  }

  if (formName === candidateName) {
    return true;
  }

  if (candidateName.startsWith(formName) || formName.startsWith(candidateName)) {
    return true;
  }

  const tokens = formName.split(' ').filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => candidateName.includes(token));
}

function personNamesMatch(form: PersonFormValue, candidate: PatientRecord): boolean {
  const formName = normalizePersonFullName(form);
  const candidateName = normalizeSearchText(candidate.fullName);
  return formName.length > 0 && formName === candidateName;
}

function normalizePersonFullName(form: PersonFormValue): string {
  return normalizeSearchText(`${form.firstName} ${form.lastName}`);
}
