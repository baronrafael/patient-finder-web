# Buscador de Pacientes Venezuela

MVP público para buscar personas registradas en listas consolidadas de hospitales y centros de atención después del sismo de Venezuela de junio de 2026.

La función principal es permitir buscar por nombre, apellido, nombre completo o cédula y ver en qué hospital o centro aparece registrada la persona.

## Stack

- Angular 22 con standalone components, routing y strict mode.
- TypeScript estricto.
- Signals para estado local de la página.
- SCSS para estilos propios.
- Tailwind CSS 4 mediante `src/tailwind.css`.
- daisyUI 5 con tema claro.
- `HttpClient` para datos mock/API.
- Vitest mediante el test runner generado por Angular CLI.
- `xlsx` solo para el script de importación en Node.

## Requisitos

- Node.js compatible con Angular 22. Probado con `v24.18.0`.
- npm.
- Angular CLI `22.0.4` o compatible.

## Instalación

```bash
npm install
```

## Fuente de Datos

Coloca el Excel en:

```text
data-source/25JUN26 8PM Pacientes Consolidados Hospitales Venezuela.xlsx
```

La hoja importada es:

```text
🔍 BUSCAR PACIENTES
```

El archivo actual contiene 972 registros y fecha indicada `25JUN26 20:00`, hora de Venezuela.

## Importar Datos Mock

```bash
npm run data:import
```

Esto genera:

```text
public/data/patients.mock.json
```

El script valida encabezados, registros, hospitales y normaliza el alias truncado `Hospital Universitario de Carac` a `Hospital Universitario de Caracas`.

## Ejecutar En Desarrollo

```bash
npm start
```

Abre la URL local que indique Angular CLI.

## Pruebas

```bash
npm run test
```

## Lint

```bash
npm run lint
```

## Build

```bash
npm run build
```

## Formato

```bash
npm run format:check
npm run format
```

## Estructura Principal

```text
src/app/core
src/app/shared
src/app/features/patient-search
public/data/patients.mock.json
tools/import-patients.mjs
data-source/
```

## Mock Vs API

La configuración está en:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

Para usar mock:

```ts
useMockData: true;
```

Cuando el backend esté listo:

```ts
useMockData: false;
```

La UI consume `PatientRepository`, por lo que no debe reescribirse al cambiar de mock a API.

## Limitación Del JSON Público

Mientras se use `patients.mock.json`, el navegador descarga el dataset completo. Esto sirve para desarrollo, demo o salida temporal consciente de esa limitación.

En producción con backend, la búsqueda debe ser server-side para no descargar toda la base al cliente.

El sitio incluye `robots.txt` y meta `noindex,nofollow,noarchive` para reducir indexación accidental por buscadores.

## Contrato Backend Esperado

```http
GET /patients/search?q=garcia&hospitalId=hospital-domingo-luciani&page=1&pageSize=20
GET /hospitals
```

La implementación `ApiPatientRepository` ya contiene DTOs y mappers básicos para ese contrato.

## Decisiones Técnicas

- No se usa Angular Material, Bootstrap, NgRx ni librerías de búsqueda fuzzy.
- La búsqueda local normaliza tildes, mayúsculas, espacios y signos comunes.
- La búsqueda por documento ignora puntos y guiones.
- No se deduplican registros automáticamente.
- No se persisten búsquedas en storage.
- No se registran datos personales en consola.
- `xlsx` no se importa desde Angular, solo desde `tools/import-patients.mjs`.

## Trabajo Futuro

- Conectar `ApiPatientRepository` con el backend de César.
- Agregar `/admin/login`, `/admin/records` y `/admin/centers` como feature lazy-loaded cuando exista backend.
- Migrar búsqueda a server-side en producción.
- Definir proceso operativo de actualización de datos.

## Dataset Actual

- Fuente: `25JUN26 8PM Pacientes Consolidados Hospitales Venezuela.xlsx`.
- Hoja: `🔍 BUSCAR PACIENTES`.
- Registros importados: 972.
- Actualizado: `2026-06-25T20:00:00-04:00`.
