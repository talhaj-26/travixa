import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface MenuCategoryApiResponse {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
}

export interface MenuCategoryRequest {
  restaurantId: number;
  name: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
}

export interface MenuItemApiResponse {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  status: 'DRAFT' | 'AVAILABLE' | 'UNAVAILABLE' | 'ARCHIVED';
  vegetarian: boolean;
  imageUrl: string | null;
  dietaryInformation: string | null;
  allergenInformation: string | null;
}

export interface MenuItemRequest {
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  currency: 'BDT' | 'USD' | 'EUR' | 'GBP';
  status: 'DRAFT' | 'AVAILABLE' | 'UNAVAILABLE' | 'ARCHIVED';
  vegetarian: boolean;
  dietaryInformation: string | null;
  allergenInformation: string | null;
}

export interface RestaurantTableApiResponse {
  id: number;
  restaurantId: number;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'OUT_OF_SERVICE';
}

export interface RestaurantTableRequest {
  restaurantId: number;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'OUT_OF_SERVICE';
}

export interface TableAvailabilityApiResponse {
  id: number;
  restaurantId: number;
  tableId: number;
  tableNumber: string;
  availableOn: string;
  startsAt: string;
  endsAt: string;
  availableSeats: number;
}

export interface TableAvailabilityRequest {
  restaurantId: number;
  tableId: number;
  availableOn: string;
  startsAt: string;
  endsAt: string;
  availableSeats: number;
}

export interface RestaurantImageApiResponse {
  id: number;
  restaurantId: number;
  storageKey: string;
  publicUrl: string;
  altText: string | null;
  displayOrder: number;
  coverImage: boolean;
}

export interface RestaurantImageRequest {
  restaurantId: number;
  storageKey: string;
  altText: string | null;
  displayOrder: number;
  coverImage: boolean;
}

export interface RestaurantReservationApiResponse {
  id: number;
  restaurantId: number;
  tableId: number | null;
  startsAt: string;
  guestCount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  specialRequests: string | null;
}

export interface RestaurantReservationRequest {
  restaurantId: number;
  tableId: number | null;
  startsAt: string;
  guestCount: number;
  specialRequests: string | null;
}

export interface BuffetScheduleApiResponse {
  id: number;
  restaurantId: number;
  buffetDate: string;
  startsAt: string;
  endsAt: string;
  adultPrice: number;
  childPrice: number | null;
  currency: 'BDT' | 'USD' | 'EUR' | 'GBP';
  capacity: number;
  menuSummary: string | null;
  listingStatus: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED';
}

export type BuffetScheduleRequest = Omit<BuffetScheduleApiResponse, 'id'>;

@Injectable({ providedIn: 'root' })
export class RestaurantCatalogService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  private get apiBaseUrl(): string {
    return `${this.apiConfig.baseUrl.replace(/\/+$/, '')}${this.apiConfig.apiPrefix}`;
  }

  categories(restaurantId: number): Observable<MenuCategoryApiResponse[]> {
    return this.http.get<MenuCategoryApiResponse[]>(`${this.apiBaseUrl}/restaurant-catalog/${restaurantId}/categories`);
  }
  createCategory(request: MenuCategoryRequest): Observable<MenuCategoryApiResponse> {
    return this.http.post<MenuCategoryApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/categories`, request);
  }
  updateCategory(id: number, request: MenuCategoryRequest): Observable<MenuCategoryApiResponse> {
    return this.http.put<MenuCategoryApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/categories/${id}`, request);
  }
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/restaurant-catalog/categories/${id}`);
  }

  menuItems(restaurantId: number): Observable<MenuItemApiResponse[]> {
    return this.http.get<MenuItemApiResponse[]>(`${this.apiBaseUrl}/restaurant-catalog/${restaurantId}/menu-items`);
  }
  createMenuItem(request: MenuItemRequest): Observable<MenuItemApiResponse> {
    return this.http.post<MenuItemApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/menu-items`, request);
  }
  updateMenuItem(id: number, request: MenuItemRequest): Observable<MenuItemApiResponse> {
    return this.http.put<MenuItemApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/menu-items/${id}`, request);
  }
  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/restaurant-catalog/menu-items/${id}`);
  }

  tables(restaurantId: number): Observable<RestaurantTableApiResponse[]> {
    return this.http.get<RestaurantTableApiResponse[]>(`${this.apiBaseUrl}/restaurant-catalog/${restaurantId}/tables`);
  }
  createTable(request: RestaurantTableRequest): Observable<RestaurantTableApiResponse> {
    return this.http.post<RestaurantTableApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/tables`, request);
  }
  updateTable(id: number, request: RestaurantTableRequest): Observable<RestaurantTableApiResponse> {
    return this.http.put<RestaurantTableApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/tables/${id}`, request);
  }
  deleteTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/restaurant-catalog/tables/${id}`);
  }

  tableAvailability(restaurantId: number): Observable<TableAvailabilityApiResponse[]> {
    return this.http.get<TableAvailabilityApiResponse[]>(`${this.apiBaseUrl}/restaurant-catalog/${restaurantId}/table-availability`);
  }
  createTableAvailability(request: TableAvailabilityRequest): Observable<TableAvailabilityApiResponse> {
    return this.http.post<TableAvailabilityApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/table-availability`, request);
  }
  updateTableAvailability(id: number, request: TableAvailabilityRequest): Observable<TableAvailabilityApiResponse> {
    return this.http.put<TableAvailabilityApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/table-availability/${id}`, request);
  }
  deleteTableAvailability(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/restaurant-catalog/table-availability/${id}`);
  }

  images(restaurantId: number): Observable<RestaurantImageApiResponse[]> {
    return this.http.get<RestaurantImageApiResponse[]>(`${this.apiBaseUrl}/restaurant-catalog/${restaurantId}/images`);
  }
  createImage(request: RestaurantImageRequest): Observable<RestaurantImageApiResponse> {
    return this.http.post<RestaurantImageApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/images`, request);
  }
  updateImage(id: number, request: RestaurantImageRequest): Observable<RestaurantImageApiResponse> {
    return this.http.put<RestaurantImageApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/images/${id}`, request);
  }
  deleteImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/restaurant-catalog/images/${id}`);
  }

  reservations(): Observable<RestaurantReservationApiResponse[]> {
    return this.http.get<RestaurantReservationApiResponse[]>(`${this.apiBaseUrl}/restaurant-reservations`);
  }
  createReservation(request: RestaurantReservationRequest): Observable<RestaurantReservationApiResponse> {
    return this.http.post<RestaurantReservationApiResponse>(`${this.apiBaseUrl}/restaurant-reservations`, request);
  }
  updateReservationStatus(id: number, status: RestaurantReservationApiResponse['status']): Observable<RestaurantReservationApiResponse> {
    return this.http.patch<RestaurantReservationApiResponse>(`${this.apiBaseUrl}/restaurant-reservations/${id}/status`, { status });
  }
  buffetSchedules(restaurantId: number): Observable<BuffetScheduleApiResponse[]> {
    return this.http.get<BuffetScheduleApiResponse[]>(`${this.apiBaseUrl}/restaurant-catalog/${restaurantId}/buffet-schedules`);
  }
  createBuffetSchedule(request: BuffetScheduleRequest): Observable<BuffetScheduleApiResponse> {
    return this.http.post<BuffetScheduleApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/buffet-schedules`, request);
  }
  updateBuffetSchedule(id: number, request: BuffetScheduleRequest): Observable<BuffetScheduleApiResponse> {
    return this.http.put<BuffetScheduleApiResponse>(`${this.apiBaseUrl}/restaurant-catalog/buffet-schedules/${id}`, request);
  }
  deleteBuffetSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/restaurant-catalog/buffet-schedules/${id}`);
  }
}
