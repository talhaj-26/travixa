import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';

export type TripCurrency = 'BDT' | 'USD' | 'EUR' | 'GBP';
export type CustomTripStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';

export interface CustomTripRequest {
  destinationId: number;
  travelerCount: number;
  startDate: string;
  endDate: string;
  targetBudget: number | null;
  currency: TripCurrency;
  requirements: string | null;
}

export interface CustomTripResponse extends CustomTripRequest {
  id: number;
  status: CustomTripStatus;
}

@Injectable({ providedIn: 'root' })
export class CustomTripService {
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) private readonly config: ApiConfig) {}
  private get baseUrl(): string { return `${this.config.baseUrl}${this.config.apiPrefix}/custom-trips`; }
  getMine(): Observable<CustomTripResponse[]> { return this.http.get<CustomTripResponse[]>(`${this.baseUrl}/my`); }
  create(request: CustomTripRequest): Observable<CustomTripResponse> { return this.http.post<CustomTripResponse>(this.baseUrl, request); }
}
