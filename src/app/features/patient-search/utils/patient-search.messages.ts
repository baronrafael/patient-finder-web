export const PATIENT_SEARCH_MESSAGES = {
  searchHint: 'Escribe al menos dos letras del nombre o cuatro dígitos de la cédula.',
  searchHintNoBrowse:
    'Escribe al menos dos letras del nombre o cuatro dígitos de la cédula. No mostramos todos los registros al entrar.',
  filtersReady: 'Filtros listos. Escribe para buscar.',
  noActiveSearch: 'Sin búsqueda activa.',
  preparingSearch: 'Preparando búsqueda...',
  loadingResults: 'Cargando resultados...',
  slowConnection: 'La conexión parece lenta. Seguimos buscando...',
  filtersWithQueryPending:
    'Tienes filtros seleccionados. Escribe al menos dos letras del nombre o cuatro dígitos de la cédula para buscar.',
  noResultsBase: 'Revisa la escritura o prueba solo con un apellido.',
  optionalFiltersHint: 'Hospital, sexo y ubicación',
  disclaimer:
    'Información consolidada de listados hospitalarios. Confirma directamente con el centro correspondiente antes de tomar decisiones.',
} as const;

export const PATIENT_SEX_LABELS = {
  m: 'Masculino',
  f: 'Femenino',
} as const;
