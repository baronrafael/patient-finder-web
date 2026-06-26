import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { APP_CONFIG } from '../config/app-config.token';
import { AUTH_STORAGE_KEYS } from './auth.constants';
import { buildAuthSession } from './auth.mapper';
import {
  AuthMeResponseDto,
  AuthTokensResponseDto,
  LoginRequestDto,
  RefreshAccessTokenRequestDto,
} from './models/auth-api.dto';
import { AuthSession } from './models/auth-session.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly loadingState = signal(false);
  private refreshInFlight: Observable<AuthSession> | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);

  restoreSession(): Promise<void> {
    const accessToken = sessionStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
    const refreshToken = sessionStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
    const expiresAt = Number(sessionStorage.getItem(AUTH_STORAGE_KEYS.expiresAt) ?? 0);

    if (!accessToken || !refreshToken || !expiresAt) {
      return Promise.resolve();
    }

    return firstValueFrom(this.loadMe(accessToken, refreshToken, expiresAt))
      .then(() => undefined)
      .catch(() => {
        this.clearSession();
      });
  }

  async login(email: string, password: string): Promise<void> {
    this.loadingState.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<AuthTokensResponseDto>(`${this.config.apiBaseUrl}/auth/login`, {
          email,
          password,
        } satisfies LoginRequestDto),
      );

      await firstValueFrom(this.loadMeFromTokens(response.data));
    } finally {
      this.loadingState.set(false);
    }
  }

  logout(): void {
    this.clearSession();
  }

  refreshSession(): Observable<AuthSession> {
    const current = this.sessionState();
    if (!current?.refreshToken) {
      return throwError(() => new Error('missing_refresh_token'));
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const body: RefreshAccessTokenRequestDto = { refresh_token: current.refreshToken };

    this.refreshInFlight = this.http
      .post<AuthTokensResponseDto>(`${this.config.apiBaseUrl}/auth/refresh`, body)
      .pipe(
        switchMap((response) => this.loadMeFromTokens(response.data)),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight;
  }

  private loadMeFromTokens(tokens: AuthTokensResponseDto['data']): Observable<AuthSession> {
    return this.loadMe(
      tokens.access_token,
      tokens.refresh_token,
      Date.now() + tokens.expires_in * 1000,
    );
  }

  private loadMe(
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
  ): Observable<AuthSession> {
    return this.http
      .get<AuthMeResponseDto>(`${this.config.apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .pipe(
        map((response) => buildAuthSession(accessToken, refreshToken, expiresAt, response)),
        tap((session) => this.persistSession(session)),
      );
  }

  private persistSession(session: AuthSession): void {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.accessToken, session.accessToken);
    sessionStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, session.refreshToken);
    sessionStorage.setItem(AUTH_STORAGE_KEYS.expiresAt, String(session.expiresAt));
    this.sessionState.set(session);
  }

  private clearSession(): void {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.expiresAt);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.activeCenterId);
    this.sessionState.set(null);
  }
}
