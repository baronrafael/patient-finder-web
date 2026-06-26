import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const SOURCE_FILE = '25JUN26 8PM Pacientes Consolidados Hospitales Venezuela.xlsx';
const SOURCE_SHEET = '🔍 BUSCAR PACIENTES';
const sourcePath = join(projectRoot, 'data-source', SOURCE_FILE);
const outputPath = join(projectRoot, 'public', 'data', 'patients.mock.json');

const EXPECTED_INITIAL_TOTAL = 972;
const REQUIRED_HEADERS = [
  'N°',
  'HOSPITAL',
  'APELLIDOS Y NOMBRES',
  'EDAD',
  'CÉDULA / ID',
  'TELÉFONO',
  'DIRECCIÓN',
  'OBSERVACIONES',
];

const HOSPITAL_ALIASES = {
  'Hospital Universitario de Carac': 'Hospital Universitario de Caracas',
};

if (!existsSync(sourcePath)) {
  fail(`No existe el Excel esperado: ${sourcePath}`);
}

const workbook = XLSX.readFile(sourcePath, { cellDates: false, raw: false });
const sheetName = workbook.SheetNames.find(
  (name) => normalizeSheetName(name) === normalizeSheetName(SOURCE_SHEET),
);

if (!sheetName) {
  fail(
    `No existe la hoja maestra "${SOURCE_SHEET}". Hojas encontradas: ${workbook.SheetNames.join(', ')}`,
  );
}

const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: null,
  raw: false,
  blankrows: false,
});
const headerIndex = findHeaderIndex(rows);
const headerRow = rows[headerIndex].map(toCleanString);
const indexes = mapHeaderIndexes(headerRow);
const warnings = [];
const patients = [];
let omittedRows = 0;

for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
  const row = rows[rowIndex];
  if (!row || row.every((cell) => toCleanString(cell) === null)) {
    continue;
  }

  const sourceRow = rowIndex + 1;
  const rowNumber = toCleanString(row[indexes['N°']]);
  const sourceHospitalName = toCleanString(row[indexes.HOSPITAL]);
  const fullName = toCleanString(row[indexes['APELLIDOS Y NOMBRES']]);

  if (!rowNumber && !sourceHospitalName && !fullName) {
    omittedRows += 1;
    continue;
  }

  if (!sourceHospitalName || !fullName) {
    fail(`Fila ${sourceRow}: falta nombre u hospital en una fila que parece ser registro.`);
  }

  const hospitalName = HOSPITAL_ALIASES[sourceHospitalName] ?? sourceHospitalName;
  const hospitalId = slugify(hospitalName);
  const identityDocument = toCleanString(row[indexes['CÉDULA / ID']]);
  const patient = {
    id: createPatientId(sourceRow, hospitalName, fullName, identityDocument),
    sourceRow,
    fullName,
    age: toCleanString(row[indexes.EDAD]),
    identityDocument,
    phone: toCleanString(row[indexes['TELÉFONO']]),
    address: toCleanString(row[indexes['DIRECCIÓN']]),
    observations: toCleanString(row[indexes.OBSERVACIONES]),
    hospitalId,
    hospitalName,
    sourceHospitalName,
  };

  if (!patient.identityDocument) {
    warnings.push(`Fila ${sourceRow}: sin cédula/ID.`);
  }

  patients.push(patient);
}

if (patients.length === 0) {
  fail('La importación no produjo registros.');
}

const hospitalMap = new Map();
for (const patient of patients) {
  const current = hospitalMap.get(patient.hospitalId) ?? {
    id: patient.hospitalId,
    name: patient.hospitalName,
    sourceNames: new Set(),
    recordCount: 0,
  };
  current.sourceNames.add(patient.sourceHospitalName);
  current.recordCount += 1;
  hospitalMap.set(patient.hospitalId, current);
}

const hospitals = [...hospitalMap.values()]
  .map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    sourceNames: [...hospital.sourceNames].sort((a, b) => a.localeCompare(b, 'es-VE')),
    recordCount: hospital.recordCount,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es-VE'));

if (!hospitals.some((hospital) => hospital.id === 'hospital-universitario-de-caracas')) {
  fail('No se encontró el hospital normalizado Hospital Universitario de Caracas.');
}

const metadata = {
  sourceFile: SOURCE_FILE,
  sourceSheet: SOURCE_SHEET,
  updatedAt: findUpdatedAt(rows),
  generatedAt: new Date().toISOString(),
  totalRecords: patients.length,
};

const dataset = { metadata, hospitals, patients };

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

console.log(`Total importado: ${patients.length}`);
console.log(`Hospitales normalizados: ${hospitals.length}`);
console.log(`Registros omitidos: ${omittedRows}`);
console.log(`Advertencias: ${warnings.length}`);
if (patients.length !== EXPECTED_INITIAL_TOTAL) {
  console.warn(
    `Advertencia: se esperaban ${EXPECTED_INITIAL_TOTAL} registros para la fuente inicial, se importaron ${patients.length}.`,
  );
}
for (const warning of warnings.slice(0, 20)) {
  console.warn(warning);
}
if (warnings.length > 20) {
  console.warn(`... ${warnings.length - 20} advertencias adicionales omitidas en consola.`);
}

function findHeaderIndex(tableRows) {
  const index = tableRows.findIndex((row) => {
    const values = row.map(toCleanString);
    return REQUIRED_HEADERS.every((header) => values.includes(header));
  });

  if (index === -1) {
    fail(`No se encontraron los encabezados esperados: ${REQUIRED_HEADERS.join(', ')}`);
  }

  return index;
}

function mapHeaderIndexes(headers) {
  const indexes = {};
  for (const header of REQUIRED_HEADERS) {
    const index = headers.indexOf(header);
    if (index === -1) {
      fail(`Falta encabezado requerido: ${header}`);
    }
    indexes[header] = index;
  }
  return indexes;
}

function toCleanString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : null;
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createPatientId(sourceRow, hospitalName, fullName, identityDocument) {
  const input = `${sourceRow}|${hospitalName}|${fullName}|${identityDocument ?? ''}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function normalizeSheetName(value) {
  return value.replace(/^\?\?\s*/, '').normalize('NFC');
}

function findUpdatedAt(tableRows) {
  const allText = tableRows.flat().map(toCleanString).filter(Boolean).join(' ');
  const match = /Actualizado:\s*(\d{2})JUN(\d{2})\s+(\d{1,2}):(\d{2})/i.exec(allText);
  if (!match) {
    return '2026-06-25T20:00:00-04:00';
  }

  const [, day, year, hour, minute] = match;
  return `20${year}-06-${day}T${hour.padStart(2, '0')}:${minute}:00-04:00`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
