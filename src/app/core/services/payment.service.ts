import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, throwError } from 'rxjs';

import { BookingService } from './booking.service';
import { API_CONFIG, ApiConfig } from '../config/api.config';
import {
  Payment,
  PaymentMethod,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
} from '../../shared/models/payment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    private readonly bookingService: BookingService,
    @Inject(API_CONFIG) config: ApiConfig,
  ) { this.apiUrl = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}/payments`; }

  getAll(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.apiUrl);
  }

  getById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  initiate(
    request: PaymentInitiationRequest,
  ): Observable<PaymentInitiationResponse> {
    return this.http.post<PaymentInitiationResponse>(
      `${this.apiUrl}/initiate`,
      request,
    );
  }

  
confirmPayment(
  bookingReference: string,
  paymentMethod: PaymentMethod,
  _transactionId?: string,
): Observable<PaymentInitiationResponse> {
  return this.bookingService.getByReference(bookingReference).pipe(
    switchMap((booking) => {
      if (booking.bookingStatus === 'CANCELLED') {
        return throwError(
          () => new Error('A cancelled booking cannot be paid.'),
        );
      }

      const request: PaymentInitiationRequest = {
        bookingId: booking.id,
        method: paymentMethod,
        idempotencyKey: this.createIdempotencyKey(),
      };

      return this.initiate(request);
    }),
  );
}


  private createIdempotencyKey(): string {
    return `travixa-payment-${crypto.randomUUID()}`;
  }
}
