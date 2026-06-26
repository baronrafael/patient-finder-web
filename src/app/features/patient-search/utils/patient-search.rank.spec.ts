import { PatientRecord } from '../models/patient-record.model';
import { PatientSearchQuery } from '../models/patient-search-query.model';
import { HOSPITAL_ALIASES, PATIENT_SEARCH_PAGE_SIZE } from './patient-search.constants';
import { searchPatients } from './patient-search.rank';

const updatedAt = '2026-06-25T20:00:00-04:00';

const patients: readonly PatientRecord[] = [
  createPatient({
    id: '1',
    fullName: 'GARCÍA MARÍA ELENA',
    identityDocument: '11.222.333',
    hospitalId: 'hospital-a',
    hospitalName: 'Hospital A',
  }),
  createPatient({
    id: '2',
    fullName: 'MARIA PÉREZ',
    identityDocument: null,
    hospitalId: 'hospital-b',
    hospitalName: 'Hospital B',
  }),
  createPatient({
    id: '3',
    fullName: 'MURILLO LANDAETA KELIZ',
    identityDocument: '28.443.736',
    hospitalId: 'hospital-a',
    hospitalName: 'Hospital A',
  }),
  createPatient({
    id: '4',
    fullName: 'GARCIA MARIO',
    identityDocument: '28-443-736',
    hospitalId: 'hospital-b',
    hospitalName: 'Hospital B',
  }),
];

describe('searchPatients', () => {
  it('finds names ignoring accents', () => {
    const result = searchPatients(patients, query('Garcia'), updatedAt);

    expect(result.items.map((patient) => patient.id)).toEqual(['1', '4']);
  });

  it('finds documents ignoring points and hyphens', () => {
    const result = searchPatients(patients, query('28443736'), updatedAt);

    expect(result.items.map((patient) => patient.id)).toEqual(['4', '3']);
  });

  it('finds multiple name tokens in any order', () => {
    const result = searchPatients(patients, query('perez maria'), updatedAt);

    expect(result.items.map((patient) => patient.id)).toEqual(['2']);
  });

  it('ranks exact document matches before name matches', () => {
    const result = searchPatients(patients, query('11222333'), updatedAt);

    expect(result.items[0].id).toBe('1');
  });

  it('filters by hospital before pagination', () => {
    const result = searchPatients(
      patients,
      { ...query('garcia'), hospitalId: 'hospital-b' },
      updatedAt,
    );

    expect(result.items.map((patient) => patient.id)).toEqual(['4']);
  });

  it('does not deduplicate matching records accidentally', () => {
    const result = searchPatients(patients, query('28443736'), updatedAt);

    expect(result.total).toBe(2);
  });

  it('handles null optional values', () => {
    const result = searchPatients(patients, query('maria perez'), updatedAt);

    expect(result.items[0].identityDocument).toBeNull();
  });

  it('keeps the required hospital alias explicit', () => {
    expect(HOSPITAL_ALIASES['Hospital Universitario de Carac']).toBe(
      'Hospital Universitario de Caracas',
    );
  });
});

function query(value: string): PatientSearchQuery {
  return {
    query: value,
    hospitalId: null,
    sex: null,
    estadoId: null,
    municipioId: null,
    parroquiaId: null,
    page: 1,
    pageSize: PATIENT_SEARCH_PAGE_SIZE,
  };
}

function createPatient(overrides: Partial<PatientRecord>): PatientRecord {
  const hospitalName = overrides.hospitalName ?? 'Hospital A';

  return {
    id: overrides.id ?? 'patient',
    sourceRow: overrides.sourceRow ?? 1,
    fullName: overrides.fullName ?? 'PACIENTE PRUEBA',
    age: overrides.age ?? null,
    identityDocument: overrides.identityDocument ?? null,
    phone: overrides.phone ?? null,
    address: overrides.address ?? null,
    observations: overrides.observations ?? null,
    hospitalId: overrides.hospitalId ?? 'hospital-a',
    hospitalName,
    sourceHospitalName: overrides.sourceHospitalName ?? hospitalName,
  };
}
