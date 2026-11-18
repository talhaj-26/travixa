import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';

export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED';
export interface TourPackageApiResponse {
  id: number; organizationId: number; destinationId: number; destinationName: string; name: string; slug: string;
  description: string | null; inclusions: string | null; exclusions: string | null; cancellationPolicy: string | null;
  bookingDeadlineHours: number | null; durationDays: number; maximumGroupSize: number; basePrice: number;
  currency: 'BDT' | 'USD' | 'EUR' | 'GBP'; listingStatus: ListingStatus;
}
export type TourPackageRequest = Omit<TourPackageApiResponse, 'id' | 'destinationName'>;
export interface PackageItineraryApiResponse { id: number; tourPackageId: number; dayNumber: number; title: string; description: string | null; locationName: string | null; }
export interface PackageDepartureApiResponse { id: number; tourPackageId: number; startsAt: string; endsAt: string; seatCapacity: number; seatsRemaining: number; priceOverride: number | null; currency: 'BDT' | 'USD' | 'EUR' | 'GBP'; status: 'SCHEDULED' | 'FULL' | 'CANCELLED' | 'COMPLETED'; }
export interface PackageImageApiResponse { id: number; tourPackageId: number; storageKey: string; publicUrl: string; altText: string | null; displayOrder: number; coverImage: boolean; }

@Injectable({ providedIn: 'root' })
export class TourPackageService {
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) private readonly apiConfig: ApiConfig) {}
  private get apiBaseUrl(): string { return `${this.apiConfig.baseUrl.replace(/\/+$/, '')}${this.apiConfig.apiPrefix}`; }

  getPublished(): Observable<TourPackageApiResponse[]> { return this.http.get<TourPackageApiResponse[]>(`${this.apiBaseUrl}/tours-packages`); }
  getPublishedById(id: number): Observable<TourPackageApiResponse> { return this.http.get<TourPackageApiResponse>(`${this.apiBaseUrl}/tours-packages/${id}`); }
  getAdminPackages(): Observable<TourPackageApiResponse[]> { return this.http.get<TourPackageApiResponse[]>(`${this.apiBaseUrl}/tours-packages/admin`); }
  create(request: TourPackageRequest): Observable<TourPackageApiResponse> { return this.http.post<TourPackageApiResponse>(`${this.apiBaseUrl}/tours-packages`, request); }
  update(id: number, request: TourPackageRequest): Observable<TourPackageApiResponse> { return this.http.put<TourPackageApiResponse>(`${this.apiBaseUrl}/tours-packages/${id}`, request); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiBaseUrl}/tours-packages/${id}`); }
  itineraries(id: number): Observable<PackageItineraryApiResponse[]> { return this.http.get<PackageItineraryApiResponse[]>(`${this.apiBaseUrl}/tours-packages/${id}/itineraries`); }
  departures(id: number): Observable<PackageDepartureApiResponse[]> { return this.http.get<PackageDepartureApiResponse[]>(`${this.apiBaseUrl}/tours-packages/${id}/departures`); }
  images(id: number): Observable<PackageImageApiResponse[]> { return this.http.get<PackageImageApiResponse[]>(`${this.apiBaseUrl}/tours-packages/${id}/images`); }
}
