
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inject } from '@angular/core';
import { API_CONFIG, ApiConfig } from '../config/api.config';

export type CartStatus = 'ACTIVE' | 'CHECKED_OUT' | 'EXPIRED' | 'ABANDONED';

export interface Cart {
  id: number;
  username: string;
  status: CartStatus;
  expiresAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiUrl: string;

  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) config: ApiConfig) {
    this.apiUrl = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}/carts`;
  }

  getAll(): Observable<Cart[]> {
    return this.http.get<Cart[]>(this.apiUrl);
  }

  getById(id: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/${id}`);
  }
}
