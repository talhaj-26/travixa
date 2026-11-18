
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import {
  API_CONFIG,
  ApiConfig,
} from '../../core/config/api.config';

import {
  UserCreateRequest,
  UserResponse,
  UserStatusUpdateRequest,
  UserUpdateRequest,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
    const apiPrefix = this.config.apiPrefix.replace(/^\/+|\/+$/g, '');

    this.apiUrl = `${baseUrl}/${apiPrefix}/users`;
  }

  private ensureBackendReady(): Observable<never> | null {
    if (!this.config.backendReady) {
      return throwError(
        () => new Error('TRAVIXA backend is not enabled in API_CONFIG.'),
      );
    }

    return null;
  }

  getAll(): Observable<UserResponse[]> {
    const error = this.ensureBackendReady();
    if (error) return error;

    return this.http.get<UserResponse[]>(this.apiUrl);
  }

  getById(username: string): Observable<UserResponse> {
    const error = this.ensureBackendReady();
    if (error) return error;

    return this.http.get<UserResponse>(
      `${this.apiUrl}/${encodeURIComponent(username)}`,
    );
  }

  add(request: UserCreateRequest): Observable<UserResponse> {
    const error = this.ensureBackendReady();
    if (error) return error;

    return this.http.post<UserResponse>(this.apiUrl, request);
  }

  update(
    username: string,
    request: UserUpdateRequest,
  ): Observable<UserResponse> {
    const error = this.ensureBackendReady();
    if (error) return error;

    return this.http.put<UserResponse>(
      `${this.apiUrl}/${encodeURIComponent(username)}`,
      request,
    );
  }

  updateStatus(
    username: string,
    request: UserStatusUpdateRequest,
  ): Observable<UserResponse> {
    const error = this.ensureBackendReady();
    if (error) return error;

    return this.http.patch<UserResponse>(
      `${this.apiUrl}/${encodeURIComponent(username)}/status`,
      request,
    );
  }

  delete(username: string): Observable<void> {
    const error = this.ensureBackendReady();
    if (error) return error;

    return this.http.delete<void>(
      `${this.apiUrl}/${encodeURIComponent(username)}`,
    );
  }
}
