
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  tap,
  throwError,
} from 'rxjs';

import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenResponse,
} from '../models/auth.model';

import { User, UserProfileResponse, UserProfileUpdateRequest, UserRole } from '../models/user.model';
import { TokenService } from './token.service';
import { API_CONFIG, ApiConfig } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly apiConfig = inject(API_CONFIG);

  // Configure an Angular development proxy or replace with your API URL.
  private get apiBaseUrl(): string { return `${this.apiConfig.baseUrl.replace(/\/+$/, '')}${this.apiConfig.apiPrefix}`; }
  private get apiUrl(): string { return `${this.apiBaseUrl}/auth`; }
  private readonly userKey = 'travixa-user';

  private readonly currentUserSubject =
    new BehaviorSubject<User | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();


  getUserProfile(username: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(
      `${this.apiBaseUrl}/users/${encodeURIComponent(username)}`,
    );
  }

  updateUserProfile(
    username: string,
    request: UserProfileUpdateRequest,
  ): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(
      `${this.apiBaseUrl}/users/${encodeURIComponent(username)}`,
      request,
    );
  }


  /**
   * Register a customer.
   * The backend assigns the role; the client does not submit a role.
   */

  register(request: RegisterRequest): Observable<AuthResponse> {
    const payload: RegisterRequest = {
      username: request.username.trim(),
      email: request.email.trim().toLowerCase(),
      password: request.password,
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
    };

    return this.http.post<TokenResponse>(`${this.apiUrl}/register`, payload).pipe(
      map((response) => this.toAuthResponse(response)),
      tap((response) => this.saveSession(response)),
      catchError((error) => this.authError(error)),
    );
  }




  /**
   * Authenticate with username and password.
   */
  login(credentials: LoginRequest, rememberMe = false): Observable<AuthResponse> {
    const payload: LoginRequest = {
      username: credentials.username.trim(),
      password: credentials.password,
    };

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/signin`, payload)
      .pipe(
        map((response) => this.toAuthResponse(response)),
        tap((response) => this.saveSession(response, rememberMe)),
        catchError((error) => this.authError(error)),
      );
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, { email: email.trim().toLowerCase() })
      .pipe(catchError((error) => this.authError(error)));
  }

  validatePasswordReset(resetToken: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/validate-reset-token`, { resetToken })
      .pipe(catchError((error) => this.authError(error)));
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, request)
      .pipe(catchError((error) => this.authError(error)));
  }

  /**
   * Exchange the refresh token for a new token pair.
   */
  refreshToken(): Observable<string> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      return throwError(
        () => new Error('Refresh token not found. Please sign in again.'),
      );
    }

    const payload: RefreshTokenRequest = { refreshToken };

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/refresh`, payload)
      .pipe(
        tap((response) => {
          this.tokenService.save(
            response.accessToken,
            response.refreshToken,
          );
        }),
        map((response) => response.accessToken),
        catchError((error) => {
          // Do not keep a session when refresh fails.
          this.clearLocalSession();
          return throwError(() => error);
        }),
      );
  }

  /**
   * Revoke the refresh token on the backend, then clear local state.
   */
  logout(): Observable<void> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      this.clearLocalSession();
      return new Observable<void>((subscriber) => {
        subscriber.next();
        subscriber.complete();
      });
    }

    const payload: RefreshTokenRequest = { refreshToken };

    return this.http
      .post<void>(`${this.apiUrl}/logout`, payload)
      .pipe(
        catchError((error) => {
          // Clear local credentials even if the server is unavailable.
          return throwError(() => error);
        }),
        finalize(() => this.clearLocalSession()),
      );
  }

  isLoggedIn(): boolean {
    return Boolean(
      this.tokenService.getAccessToken() &&
      this.currentUserSubject.value
    );
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentRole(): UserRole | null {
    return this.getCurrentUser()?.role ?? null;
  }

  hasRole(roles: readonly UserRole[]): boolean {
    const role = this.getCurrentRole();
    return role !== null && roles.includes(role);
  }

  getRoleHome(): string {
    switch (this.getCurrentRole()) {
      case 'SUPER_ADMIN':
        return '/super-admin';

      case 'ADMIN':
        return '/admin-dashboard';

      default:
        return '/dashboard';
    }
  }

  /**
   * The backend response contains no user ID or profile fields.
   * This adapter supplies compatibility fields for the existing UI.
   * Replace it with a real /api/users/me response when available.
   */
  private toAuthResponse(response: TokenResponse): AuthResponse {
    const roles = response.roles.map((role) =>
      role.replace(/^ROLE_/, ''),
    );

    const role = this.resolveRole(roles);
    const now = new Date().toISOString();

    const user = {
      id: 0,
      username: response.username,
      usersid: '',
      name: response.username,
      email: response.email,
      age: 0,
      dateOfBirth: '',
      gender: 'Other',
      department: '',
      skills: [],
      phone: '',
      active: true,
      status: 'ACTIVE',
      address: '',
      role,
      createdAt: now,
      updatedAt: now,
    } as User;

    return {
      ...response,
      roles,
      user,
    };
  }

  private resolveRole(roles: string[]): UserRole {
    const normalizedRoles = roles.map((role) =>
      role.replace(/^ROLE_/, '').trim().toUpperCase(),
    );

    const rolePriority: UserRole[] = [
      'SUPER_ADMIN',
      'ADMIN',
      'CONTENT_MANAGER',
      'FINANCE_ACCOUNTANT',
      'SUPPORT_EXECUTIVE',
      'HOTEL_PARTNER',
      'HOTEL_STAFF',
      'RESTAURANT_PARTNER',
      'RESTAURANT_STAFF',
      'TRAVEL_AGENCY_PARTNER',
      'TRAVEL_AGENCY_STAFF',
      'TOUR_GUIDE',
      'TRANSPORT_PROVIDER',
      'DRIVER',
      'PARTNER',
      'STAFF',
      'CUSTOMER',
    ];

    return (
      rolePriority.find((role) => normalizedRoles.includes(role)) ??
      'CUSTOMER'
    );
  }

  private saveSession(response: AuthResponse, rememberMe = false): void {
    this.tokenService.save(
      response.accessToken,
      response.refreshToken,
      rememberMe,
    );

    const store = rememberMe ? localStorage : sessionStorage;
    (rememberMe ? sessionStorage : localStorage).removeItem(this.userKey);
    store.setItem(this.userKey, JSON.stringify(response.user));

    this.currentUserSubject.next(response.user);
  }

  private clearLocalSession(): void {
    this.tokenService.clear();
    sessionStorage.removeItem(this.userKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  private readStoredUser(): User | null {
    try {
      const raw = (localStorage.getItem(this.userKey) ?? sessionStorage.getItem(this.userKey));
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      sessionStorage.removeItem(this.userKey);
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private authError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const message = error.status === 0
        ? 'Cannot connect to TRAVIXA. Check that the backend is running.'
        : error.status === 409
          ? 'That username or email address is already registered.'
          : error.status === 503
            ? 'Password recovery email is not configured or is temporarily unavailable.'
            : error.error?.message ?? error.error?.detail ?? `Authentication request failed (${error.status}).`;
      return throwError(() => new Error(message));
    }
    return throwError(() => error instanceof Error ? error : new Error('Authentication request failed.'));
  }
}
