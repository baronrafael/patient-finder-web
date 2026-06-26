import { PatientRecord } from '../models/patient-record.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { PatientSearchResult } from '../models/patient-search-result.model';
import { isSearchActive, matchPatient } from './patient-search.matcher';

export function searchPatients(
  patients: readonly PatientRecord[],
  query: PatientSearchQuery,
  updatedAt: string,
): PatientSearchResult {
  if (!isSearchActive(query.query)) {
    return {
      items: [],
      total: 0,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: false,
      updatedAt,
    };
  }

  const filtered = patients.filter(
    (patient) => !query.hospitalId || patient.hospitalId === query.hospitalId,
  );
  const ranked = filtered
    .map((patient) => matchPatient(patient, query.query))
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort(
      (a, b) => a.rank - b.rank || a.patient.fullName.localeCompare(b.patient.fullName, 'es-VE'),
    );

  const visibleCount = query.page * query.pageSize;
  const items = ranked.slice(0, visibleCount).map((match) => match.patient);

  return {
    items,
    total: ranked.length,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: ranked.length > visibleCount,
    updatedAt,
  };
}
