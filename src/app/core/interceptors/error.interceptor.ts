import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toast = inject(ToastService);
  return next(request).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status !== 0 && error.status !== 401) {
      const message = typeof error.error?.message === 'string' ? error.error.message : 'Please try again in a moment.';
      toast.error('Request could not be completed', message);
    }
    return throwError(() => error);
  }));
};
