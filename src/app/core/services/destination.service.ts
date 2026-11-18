
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface DestinationApiResponse {
  id: number;
  name: string;
  slug: string;
  countryCode: string;
  region: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  imageUrl: string | null;
  featured: boolean;
  published: boolean;
}

export type DestinationRequest = Omit<DestinationApiResponse, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class DestinationService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  getPublishedFromApi(): Observable<DestinationApiResponse[]> {
    const url = `${this.apiConfig.baseUrl}${this.apiConfig.apiPrefix}/destinations`;
    return this.http.get<DestinationApiResponse[]>(url);
  }

  getAdminFromApi(): Observable<DestinationApiResponse[]> {
  const url = `${this.apiConfig.baseUrl}${this.apiConfig.apiPrefix}/destinations/admin`;
  return this.http.get<DestinationApiResponse[]>(url);
}

  create(request: DestinationRequest): Observable<DestinationApiResponse> {
    return this.http.post<DestinationApiResponse>(`${this.apiConfig.baseUrl}${this.apiConfig.apiPrefix}/destinations`, request);
  }

  update(id: number, request: DestinationRequest): Observable<DestinationApiResponse> {
    return this.http.put<DestinationApiResponse>(`${this.apiConfig.baseUrl}${this.apiConfig.apiPrefix}/destinations/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiConfig.baseUrl}${this.apiConfig.apiPrefix}/destinations/${id}`);
  }

}
