import { bootstrapApplication } from '@angular/platform-browser';

import { initCloudflareWebAnalytics } from './app/core/analytics/cloudflare-web-analytics';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

initCloudflareWebAnalytics(environment.cloudflareWebAnalyticsToken);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
