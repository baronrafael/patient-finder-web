import { API_BASE_URL } from './api.constants';

export const environment = {
  production: true,
  appConfig: {
    useMockData: false,
    mockDataUrl: '/data/patients.mock.json',
    locationsMockUrl: '/data/locations.mock.json',
    apiBaseUrl: API_BASE_URL,
  },
} as const;
