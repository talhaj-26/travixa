import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';
import {
  MenuCategoryApiResponse,
  MenuItemApiResponse,
  RestaurantTableApiResponse,
  RestaurantImageApiResponse,
  TableAvailabilityApiResponse,
  BuffetScheduleApiResponse,
} from './restaurant-catalog.service';

export type RestaurantListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface RestaurantApiResponse {
  id: number;
  organizationId: number;
  destinationId: number | null;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  contactEmail: string | null;
  contactPhone: string | null;
  cuisineType: string | null;
  openingHours: string | null;
  cancellationPolicy: string | null;
  listingStatus: RestaurantListingStatus;
}

export interface RestaurantRequest {
  organizationId: number;
  destinationId: number | null;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  contactEmail: string;
  contactPhone: string | null;
  cuisineType: string | null;
  openingHours: string | null;
  cancellationPolicy: string | null;
  listingStatus: RestaurantListingStatus;
}

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  private get apiBaseUrl(): string {
    return `${this.apiConfig.baseUrl.replace(/\/+$/, '')}${this.apiConfig.apiPrefix}`;
  }

  getPublished(): Observable<RestaurantApiResponse[]> {
    return this.http.get<RestaurantApiResponse[]>(
      `${this.apiBaseUrl}/restaurants`,
    );
  }

  getPublishedById(id: number): Observable<RestaurantApiResponse> {
    return this.http.get<RestaurantApiResponse>(
      `${this.apiBaseUrl}/restaurants/${id}`,
    );
  }

  getPublishedCategories(id: number): Observable<MenuCategoryApiResponse[]> {
    return this.http.get<MenuCategoryApiResponse[]>(
      `${this.apiBaseUrl}/restaurants/${id}/categories`,
    );
  }

  getPublishedMenuItems(id: number): Observable<MenuItemApiResponse[]> {
    return this.http.get<MenuItemApiResponse[]>(
      `${this.apiBaseUrl}/restaurants/${id}/menu-items`,
    );
  }

  getPublishedTables(id: number): Observable<RestaurantTableApiResponse[]> {
    return this.http.get<RestaurantTableApiResponse[]>(
      `${this.apiBaseUrl}/restaurants/${id}/tables`,
    );
  }

  getPublishedTableAvailability(id: number, date: string): Observable<TableAvailabilityApiResponse[]> {
    return this.http.get<TableAvailabilityApiResponse[]>(
      `${this.apiBaseUrl}/restaurants/${id}/table-availability`, { params: { date } },
    );
  }

  getPublishedBuffetSchedules(id: number): Observable<BuffetScheduleApiResponse[]> {
    return this.http.get<BuffetScheduleApiResponse[]>(`${this.apiBaseUrl}/restaurants/${id}/buffet-schedules`);
  }

  getPublishedImages(id: number): Observable<RestaurantImageApiResponse[]> {
    return this.http.get<RestaurantImageApiResponse[]>(
      `${this.apiBaseUrl}/restaurants/${id}/images`,
    );
  }

  getAdminRestaurants(): Observable<RestaurantApiResponse[]> {
    return this.http.get<RestaurantApiResponse[]>(
      `${this.apiBaseUrl}/restaurants/admin`,
    );
  }

  create(request: RestaurantRequest): Observable<RestaurantApiResponse> {
    return this.http.post<RestaurantApiResponse>(
      `${this.apiBaseUrl}/restaurants`,
      request,
    );
  }

  update(
    id: number,
    request: RestaurantRequest,
  ): Observable<RestaurantApiResponse> {
    return this.http.put<RestaurantApiResponse>(
      `${this.apiBaseUrl}/restaurants/${id}`,
      request,
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/restaurants/${id}`);
  }
}
