import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { APP_CONFIG } from '../config/app-config.token';
import { AuthService } from './auth.service';
import { DASHBOARD_PATHS } from '../routing/dashboard.paths';

function isApiRequest(url: string, apiBaseUrl: string): boolean {
  return url.startsWith(apiBaseUrl);
}

function isAuthExempt(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const config = inject(APP_CONFIG);
  const router = inject(Router);

  if (!isApiRequest(req.url, config.apiBaseUrl) || isAuthExempt(req.url)) {
    return next(req);
  }

  const token = auth.accessToken();
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthExempt(req.url)) {
        return throwError(() => error);
      }

      if (!auth.isAuthenticated()) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap((session) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${session.accessToken}` },
            }),
          ),
        ),
        catchError((refreshError) => {
          auth.logout();
          if (router.url.startsWith('/admin')) {
            void router.navigate([DASHBOARD_PATHS.login]);
          }
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
