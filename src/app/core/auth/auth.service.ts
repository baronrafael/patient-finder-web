import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  firstValueFrom,
  forkJoin,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { APP_CONFIG } from '../config/app-config.token';
import { AUTH_STORAGE, AUTH_STORAGE_KEYS } from './auth.constants';
import { buildAuthSession } from './auth.mapper';
import {
  AuthMeResponseDto,
  AuthTokensResponseDto,
  LoginRequestDto,
  RefreshAccessTokenRequestDto,
  RolesCatalogResponseDto,
  UserRolesResponseDto,
} from './models/auth-api.dto';
import { AuthSession } from './models/auth-session.model';

const EMPTY_ROLE_CATALOG: RolesCatalogResponseDto = { data: { roles: [] } };

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
    const accessToken = AUTH_STORAGE.getItem(AUTH_STORAGE_KEYS.accessToken);
    const refreshToken = AUTH_STORAGE.getItem(AUTH_STORAGE_KEYS.refreshToken);
    const expiresAt = Number(AUTH_STORAGE.getItem(AUTH_STORAGE_KEYS.expiresAt) ?? 0);

    if (!accessToken || !refreshToken || !expiresAt) {
      return Promise.resolve();
    }

    return firstValueFrom(this.loadSession(accessToken, refreshToken, expiresAt))
      .then(() => undefined)
      .catch(() => {
        this.clearSession();
      });
  }

  async login(email: string, password: string): Promise<void> {
    this.clearSession();
    this.loadingState.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<AuthTokensResponseDto>(`${this.config.apiBaseUrl}/auth/login`, {
          email,
          password,
        } satisfies LoginRequestDto),
      );

      await firstValueFrom(this.loadSessionFromTokens(response.data));
    } catch (error) {
      this.clearSession();
      throw error;
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
        switchMap((response) => this.loadSessionFromTokens(response.data)),
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

  private loadSessionFromTokens(tokens: AuthTokensResponseDto['data']): Observable<AuthSession> {
    return this.loadSession(
      tokens.access_token,
      tokens.refresh_token,
      Date.now() + tokens.expires_in * 1000,
    );
  }

  private loadSession(
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
  ): Observable<AuthSession> {
    this.stageTokens(accessToken, refreshToken, expiresAt);

    const baseUrl = this.config.apiBaseUrl;

    return forkJoin({
      me: this.http.get<AuthMeResponseDto>(`${baseUrl}/users/me`),
      userRoles: this.http.get<UserRolesResponseDto>(`${baseUrl}/users/me/roles`),
      roleCatalog: this.http
        .get<RolesCatalogResponseDto>(`${baseUrl}/roles`)
        .pipe(catchError(() => of(EMPTY_ROLE_CATALOG))),
    }).pipe(
      map(({ me, userRoles, roleCatalog }) =>
        buildAuthSession(
          accessToken,
          refreshToken,
          expiresAt,
          me,
          userRoles.data.roles ?? [],
          roleCatalog.data.roles ?? [],
        ),
      ),
      tap((session) => this.persistSession(session)),
    );
  }

  private stageTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    AUTH_STORAGE.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
    AUTH_STORAGE.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
    AUTH_STORAGE.setItem(AUTH_STORAGE_KEYS.expiresAt, String(expiresAt));

    const current = this.sessionState();
    if (current) {
      this.sessionState.set({
        ...current,
        accessToken,
        refreshToken,
        expiresAt,
      });
      return;
    }

    this.sessionState.set({
      accessToken,
      refreshToken,
      expiresAt,
      user: { id: '', email: '', name: '' },
      globalPermissions: [],
      centerPermissions: {},
    });
  }

  private persistSession(session: AuthSession): void {
    AUTH_STORAGE.setItem(AUTH_STORAGE_KEYS.accessToken, session.accessToken);
    AUTH_STORAGE.setItem(AUTH_STORAGE_KEYS.refreshToken, session.refreshToken);
    AUTH_STORAGE.setItem(AUTH_STORAGE_KEYS.expiresAt, String(session.expiresAt));
    this.sessionState.set(session);
  }

  private clearSession(): void {
    AUTH_STORAGE.removeItem(AUTH_STORAGE_KEYS.accessToken);
    AUTH_STORAGE.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    AUTH_STORAGE.removeItem(AUTH_STORAGE_KEYS.expiresAt);
    AUTH_STORAGE.removeItem(AUTH_STORAGE_KEYS.activeCenterId);
    this.sessionState.set(null);
  }
}
