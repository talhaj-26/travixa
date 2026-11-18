import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface TourGuideApi { id: number; userName: string; organizationId: number | null; biography: string | null; licenseNumber: string | null; languageCodes: string | null; status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'; }
export interface TourGuideRequest { userName: string; organizationId: number; biography: string | null; licenseNumber: string | null; languageCodes: string | null; status: TourGuideApi['status']; }
export interface GuideAvailabilityApi { id: number; guideProfileId: number; startsAt: string; endsAt: string; status: string; }
export interface GuideAvailabilityRequest { guideProfileId: number; startsAt: string; endsAt: string; status: GuideAvailabilityApi['status']; }
export interface GuideOfferingApi { id: number; guideProfileId: number; userName: string; organizationId: number | null; organizationName: string | null; biography: string | null; languageCodes: string | null; name: string; description: string | null; pricePerHour: number; currency: 'BDT' | 'USD' | 'EUR' | 'GBP'; active: boolean; }
export interface GuideOfferingRequest { guideProfileId: number; name: string; description: string | null; pricePerHour: number; currency: GuideOfferingApi['currency']; active: boolean; }

@Injectable({ providedIn: 'root' })
export class TourGuideService {
  private readonly base: string;
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) config: ApiConfig) {
    this.base = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}`;
  }
  getGuides(): Observable<TourGuideApi[]> { return this.http.get<TourGuideApi[]>(`${this.base}/tours-guides`); }
  getGuide(id: number): Observable<TourGuideApi> { return this.http.get<TourGuideApi>(`${this.base}/tours-guides/${id}`); }
  getPublicOfferings(): Observable<GuideOfferingApi[]> { return this.http.get<GuideOfferingApi[]>(`${this.base}/guide-offerings/public`); }
  getOfferings(): Observable<GuideOfferingApi[]> { return this.http.get<GuideOfferingApi[]>(`${this.base}/guide-offerings`); }
  createOffering(request: GuideOfferingRequest): Observable<GuideOfferingApi> { return this.http.post<GuideOfferingApi>(`${this.base}/guide-offerings`, request); }
  updateOffering(id: number, request: GuideOfferingRequest): Observable<GuideOfferingApi> { return this.http.put<GuideOfferingApi>(`${this.base}/guide-offerings/${id}`, request); }
  deleteOffering(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/guide-offerings/${id}`); }
  createGuide(request: TourGuideRequest): Observable<TourGuideApi> { return this.http.post<TourGuideApi>(`${this.base}/tours-guides`, request); }
  updateGuide(id: number, request: TourGuideRequest): Observable<TourGuideApi> { return this.http.put<TourGuideApi>(`${this.base}/tours-guides/${id}`, request); }
  deleteGuide(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/tours-guides/${id}`); }
  getAvailability(): Observable<GuideAvailabilityApi[]> { return this.http.get<GuideAvailabilityApi[]>(`${this.base}/tours/guide-availability`); }
  getGuideAvailability(id: number): Observable<GuideAvailabilityApi> { return this.http.get<GuideAvailabilityApi>(`${this.base}/tours/guide-availability/${id}`); }
  createAvailability(request: GuideAvailabilityRequest): Observable<GuideAvailabilityApi> { return this.http.post<GuideAvailabilityApi>(`${this.base}/tours/guide-availability`, request); }
  updateAvailability(id: number, request: GuideAvailabilityRequest): Observable<GuideAvailabilityApi> { return this.http.put<GuideAvailabilityApi>(`${this.base}/tours/guide-availability/${id}`, request); }
  deleteAvailability(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/tours/guide-availability/${id}`); }
}
