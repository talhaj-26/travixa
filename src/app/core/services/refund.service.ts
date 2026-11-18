
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CreateRefundRequest,
  RefundRequest,
  RefundRequestStatus,
  RefundReviewRequest,
} from '../../shared/models/refund';
import { API_CONFIG, ApiConfig } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class RefundService {
  private readonly apiUrl: string;

  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) config: ApiConfig) {
    this.apiUrl = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}/refunds`;
  }

  getAll(): Observable<RefundRequest[]> {
    return this.http.get<RefundRequest[]>(this.apiUrl);
  }

  getById(id: number): Observable<RefundRequest> {
    return this.http.get<RefundRequest>(`${this.apiUrl}/${id}`);
  }

  requestRefund(request: CreateRefundRequest): Observable<RefundRequest> {
    return this.http.post<RefundRequest>(this.apiUrl, request);
  }

  updateStatus(
    id: number,
    status: RefundRequestStatus,
    _processorId?: number,
    _rejectionReason?: string,
  ): Observable<RefundRequest> {
    const request: RefundReviewRequest = {
      status: status as RefundReviewRequest['status'],
    };

    return this.http.put<RefundRequest>(
      `${this.apiUrl}/${id}/review`,
      request,
    );
  }

  completeDemo(id: number): Observable<RefundRequest> {
    return this.http.put<RefundRequest>(`${this.apiUrl}/${id}/complete-demo`, {});
  }
}
