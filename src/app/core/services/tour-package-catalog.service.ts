import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config/api.config';
import { PackageDepartureApiResponse, PackageImageApiResponse, PackageItineraryApiResponse } from './tour-package.service';

export type PackageItineraryRequest = Omit<PackageItineraryApiResponse, 'id'>;
export type PackageDepartureRequest = Omit<PackageDepartureApiResponse, 'id' | 'seatsRemaining'>;
export type PackageImageRequest = Omit<PackageImageApiResponse, 'id'>;
@Injectable({ providedIn: 'root' })
export class TourPackageCatalogService {
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) private readonly apiConfig: ApiConfig) {}
  private get apiBaseUrl(): string { return `${this.apiConfig.baseUrl.replace(/\/+$/, '')}${this.apiConfig.apiPrefix}/tour-package-catalog`; }
  itineraries(packageId: number): Observable<PackageItineraryApiResponse[]> { return this.http.get<PackageItineraryApiResponse[]>(`${this.apiBaseUrl}/${packageId}/itineraries`); }
  createItinerary(request: PackageItineraryRequest): Observable<PackageItineraryApiResponse> { return this.http.post<PackageItineraryApiResponse>(`${this.apiBaseUrl}/itineraries`, request); }
  updateItinerary(id: number, request: PackageItineraryRequest): Observable<PackageItineraryApiResponse> { return this.http.put<PackageItineraryApiResponse>(`${this.apiBaseUrl}/itineraries/${id}`, request); }
  deleteItinerary(id: number): Observable<void> { return this.http.delete<void>(`${this.apiBaseUrl}/itineraries/${id}`); }
  departures(packageId: number): Observable<PackageDepartureApiResponse[]> { return this.http.get<PackageDepartureApiResponse[]>(`${this.apiBaseUrl}/${packageId}/departures`); }
  createDeparture(request: PackageDepartureRequest): Observable<PackageDepartureApiResponse> { return this.http.post<PackageDepartureApiResponse>(`${this.apiBaseUrl}/departures`, request); }
  updateDeparture(id: number, request: PackageDepartureRequest): Observable<PackageDepartureApiResponse> { return this.http.put<PackageDepartureApiResponse>(`${this.apiBaseUrl}/departures/${id}`, request); }
  deleteDeparture(id: number): Observable<void> { return this.http.delete<void>(`${this.apiBaseUrl}/departures/${id}`); }
  images(packageId: number): Observable<PackageImageApiResponse[]> { return this.http.get<PackageImageApiResponse[]>(`${this.apiBaseUrl}/${packageId}/images`); }
  createImage(request: PackageImageRequest): Observable<PackageImageApiResponse> { return this.http.post<PackageImageApiResponse>(`${this.apiBaseUrl}/images`, request); }
  updateImage(id: number, request: PackageImageRequest): Observable<PackageImageApiResponse> { return this.http.put<PackageImageApiResponse>(`${this.apiBaseUrl}/images/${id}`, request); }
  deleteImage(id: number): Observable<void> { return this.http.delete<void>(`${this.apiBaseUrl}/images/${id}`); }
}
