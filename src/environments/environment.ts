import { API_BASE_URL } from './api.constants';

/** Token from Cloudflare Dashboard → Web Analytics → Manage site. */
export const CLOUDFLARE_WEB_ANALYTICS_TOKEN = '57b501b89bc640af8bf77db974458e81';

export const environment = {
  production: true,
  cloudflareWebAnalyticsToken: CLOUDFLARE_WEB_ANALYTICS_TOKEN,
  appConfig: {
    useMockData: false,
    mockDataUrl: '/data/patients.mock.json',
    locationsMockUrl: '/data/locations.mock.json',
    apiBaseUrl: API_BASE_URL,
  },
} as const;
