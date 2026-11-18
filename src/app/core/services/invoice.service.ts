import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface InvoiceRecord {
  id: number;
  bookingId: number;
  invoiceNumber: string;
  issuedOn: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'ISSUED' | 'PAID' | 'VOID';
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly apiUrl: string;

  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) config: ApiConfig) {
    this.apiUrl = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}/invoices`;
  }

  getAll(): Observable<InvoiceRecord[]> { return this.http.get<InvoiceRecord[]>(this.apiUrl); }
  getById(id: number): Observable<InvoiceRecord> { return this.http.get<InvoiceRecord>(`${this.apiUrl}/${id}`); }
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
