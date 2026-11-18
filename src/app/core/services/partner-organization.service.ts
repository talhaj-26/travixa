import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface PartnerOrganizationApiResponse {
  id: number;
  name: string;
  slug: string;
  businessType: 'HOTEL' | 'RESTAURANT' | 'TRAVEL_AGENCY' | 'TOUR_GUIDE' | 'TRANSPORT_PROVIDER';
  legalName: string | null;
  registrationNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}

export type PartnerOrganizationRequest = Omit<PartnerOrganizationApiResponse, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class PartnerOrganizationService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  private get apiBaseUrl(): string {
    return `${this.apiConfig.baseUrl}${this.apiConfig.apiPrefix}`;
  }

  getAll(): Observable<PartnerOrganizationApiResponse[]> {
    return this.http.get<PartnerOrganizationApiResponse[]>(
      `${this.apiBaseUrl}/partners-organizations`,
    );
  }

  getById(id: number): Observable<PartnerOrganizationApiResponse> {
    return this.http.get<PartnerOrganizationApiResponse>(`${this.apiBaseUrl}/partners-organizations/${id}`);
  }

  create(request: PartnerOrganizationRequest): Observable<PartnerOrganizationApiResponse> {
    return this.http.post<PartnerOrganizationApiResponse>(`${this.apiBaseUrl}/partners-organizations`, request);
  }

  update(id: number, request: PartnerOrganizationRequest): Observable<PartnerOrganizationApiResponse> {
    return this.http.put<PartnerOrganizationApiResponse>(`${this.apiBaseUrl}/partners-organizations/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/partners-organizations/${id}`);
  }
}
