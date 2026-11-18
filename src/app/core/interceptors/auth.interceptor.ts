import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { AuthService } from '../services/auth.service';

let refreshInFlight: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(API_CONFIG);
  const auth = inject(AuthService);

  const token = auth.getAccessToken();

  const apiPrefix = config.apiPrefix.startsWith('/')
    ? config.apiPrefix
    : `/${config.apiPrefix}`;

  const requestUrl = new URL(req.url, config.baseUrl);

  const isApiRequest =
    requestUrl.origin === new URL(config.baseUrl).origin &&
    (
      requestUrl.pathname === apiPrefix ||
      requestUrl.pathname.startsWith(`${apiPrefix}/`)
    );

  if (!isApiRequest) return next(req);

  const request = token && !req.headers.has('Authorization')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(catchError((error) => {
    const isRefreshRequest = requestUrl.pathname.endsWith(`${apiPrefix}/auth/refresh`);
    if (error.status !== 401 || !token || isRefreshRequest) return throwError(() => error);

    if (!refreshInFlight) {
      refreshInFlight = auth.refreshToken().pipe(
        finalize(() => { refreshInFlight = null; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return refreshInFlight.pipe(
      switchMap((freshToken) => next(request.clone({ setHeaders: { Authorization: `Bearer ${freshToken}` } }))),
    );
  }));
};
