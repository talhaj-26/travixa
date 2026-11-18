import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface HotelRoomAvailabilityResponse {
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  requestedRooms: number;
  availableUnits: number;
  nights: number;
  available: boolean;
  nightlyRate: number;
  totalRoomCost: number;
  currency: string;
  dailyRates: {
    date: string;
    nightlyRate: number;
    currency: string;
  }[];
  message: string;
}

export interface HotelApiResponse {
  id: number;
  organizationId: number;
  destinationId: number;
  destinationName: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  contactEmail: string;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  starRating: number;
  listingStatus:
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'PUBLISHED'
    | 'SUSPENDED'
    | 'ARCHIVED';
  checkInTime: string | null;
  checkOutTime: string | null;
  cancellationPolicy: string | null;
  childPolicy: string | null;
  additionalCharges: string | null;
}

export interface HotelImageApiResponse {
  id: number;
  hotelId: number;
  storageKey: string;
  publicUrl: string;
  altText: string | null;
  displayOrder: number;
  coverImage: boolean;
}

export interface HotelAmenityApiResponse {
  id: number;
  hotelId: number;
  name: string;
  description: string | null;
  included: boolean;
}

export interface HotelAmenityRequest {
  hotelId: number;
  name: string;
  description: string | null;
  included: boolean;
}

export interface HotelRequest {
  organizationId: number;
  destinationId: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  contactEmail: string;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  starRating: number;
  listingStatus:
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'PUBLISHED'
    | 'SUSPENDED'
    | 'ARCHIVED';
  checkInTime: string | null;
  checkOutTime: string | null;
  cancellationPolicy: string | null;
  childPolicy: string | null;
  additionalCharges: string | null;
}

export interface AdminRoomTypeApiResponse {
  id: number;
  hotelId: number;
  name: string;
  category: string;
  bedType: string;
  maxOccupancy: number;
  sizeSquareMeters: number | null;
  airConditioned: boolean | null;
  description: string | null;
  amenities: string[];
  listingStatus: string;
  images?: RoomTypeImageApiResponse[];
}

export interface RoomTypeImageApiResponse {
  id: number;
  roomTypeId: number;
  storageKey: string;
  publicUrl: string;
  altText: string | null;
  displayOrder: number;
  coverImage: boolean;
}

export interface HotelRoomTypeApiResponse {
  id: number;
  name: string;
  category: string;
  bedType: string;
  maxOccupancy: number;
  sizeSquareMeters: number | null;
  airConditioned: boolean | null;
  description: string | null;
  amenities: string[];
  images: RoomTypeImageApiResponse[];
  nightlyRate: number | null;
  currency: string | null;
  ratePlanType: string | null;
}

export interface RoomTypeRequest {
  hotelId: number;
  name: string;
  category: string;
  bedType: string;
  maxOccupancy: number;
  sizeSquareMeters: number | null;
  airConditioned: boolean;
  description: string | null;
  amenities: string[];
  listingStatus: string;
}

export interface RoomRateApiResponse {
  id: number;
  roomTypeId: number;
  ratePlanType: string;
  nightlyRate: number;
  currency: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export interface RoomRateRequest {
  roomTypeId: number;
  ratePlanType: string;
  nightlyRate: number;
  currency: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export interface RoomApiResponse {
  id: number;
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  status: string;
  floorLabel: string | null;
  viewDescription: string | null;
  images: RoomImageApiResponse[];
}

export interface RoomImageApiResponse {
  id: number;
  listingType: 'ROOM';
  listingId: number;
  storageKey: string;
  publicUrl: string;
  altText: string | null;
  displayOrder: number;
  coverImage: boolean;
}
export interface RoomRequest {
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  status: string;
  floorLabel: string | null;
  viewDescription: string | null;
}

export interface RoomAvailabilityApiResponse {
  id: number;
  roomId: number;
  availableOn: string;
  availableUnits: number;
}

export interface RoomAvailabilityRequest {
  roomId: number;
  availableOn: string;
  availableUnits: number;
}

@Injectable({
  providedIn: 'root',
})
export class HotelService {
  constructor(
    private http: HttpClient,
    @Inject(API_CONFIG) private apiConfig: ApiConfig,
  ) {}

  private get apiBaseUrl(): string {
    return `${this.apiConfig.baseUrl}${this.apiConfig.apiPrefix}`;
  }

  resolveMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    const base = this.apiConfig.baseUrl.replace(/\/+$/, '') + '/';
    return new URL(url.replace(/^\/+/, ''), base).toString();
  }

  getAdminHotels(): Observable<HotelApiResponse[]> {
    return this.http.get<HotelApiResponse[]>(`${this.apiBaseUrl}/hotels/admin`);
  }
  createHotel(request: HotelRequest): Observable<HotelApiResponse> {
    return this.http.post<HotelApiResponse>(
      `${this.apiBaseUrl}/hotels`,
      request,
    );
  }
  updateHotel(id: number, request: HotelRequest): Observable<HotelApiResponse> {
    return this.http.put<HotelApiResponse>(
      `${this.apiBaseUrl}/hotels/${id}`,
      request,
    );
  }
  deleteHotel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/hotels/${id}`);
  }

  getAdminRoomTypes(): Observable<AdminRoomTypeApiResponse[]> {
    return this.http.get<AdminRoomTypeApiResponse[]>(
      `${this.apiBaseUrl}/hotel-inventory/room-types`,
    );
  }
  createRoomType(
    request: RoomTypeRequest,
  ): Observable<AdminRoomTypeApiResponse> {
    return this.http.post<AdminRoomTypeApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/room-types`,
      request,
    );
  }
  getAdminRoomTypeImages(id: number): Observable<RoomTypeImageApiResponse[]> {
    return this.http.get<RoomTypeImageApiResponse[]>(
      `${this.apiBaseUrl}/media/ROOM_TYPE/${id}/images`,
    );
  }
  updateRoomType(
    id: number,
    request: RoomTypeRequest,
  ): Observable<AdminRoomTypeApiResponse> {
    return this.http.put<AdminRoomTypeApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/room-types/${id}`,
      request,
    );
  }
  deleteRoomType(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/hotel-inventory/room-types/${id}`,
    );
  }
  getAdminRooms(): Observable<RoomApiResponse[]> {
    return this.http.get<RoomApiResponse[]>(
      `${this.apiBaseUrl}/hotel-inventory/rooms`,
    );
  }
  createRoom(request: RoomRequest): Observable<RoomApiResponse> {
    return this.http.post<RoomApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/rooms`,
      request,
    );
  }
  updateRoom(id: number, request: RoomRequest): Observable<RoomApiResponse> {
    return this.http.put<RoomApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/rooms/${id}`,
      request,
    );
  }
  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/hotel-inventory/rooms/${id}`,
    );
  }

  getPublishedFromApi(): Observable<HotelApiResponse[]> {
    return this.http.get<HotelApiResponse[]>(`${this.apiBaseUrl}/hotels`);
  }

  getPublishedById(id: number): Observable<HotelApiResponse> {
    return this.http.get<HotelApiResponse>(`${this.apiBaseUrl}/hotels/${id}`);
  }

  getPublishedImages(id: number): Observable<HotelImageApiResponse[]> {
    return this.http.get<HotelImageApiResponse[]>(
      `${this.apiBaseUrl}/hotels/${id}/images`,
    );
  }

  getPublishedAmenities(id: number): Observable<HotelAmenityApiResponse[]> {
    return this.http.get<HotelAmenityApiResponse[]>(
      `${this.apiBaseUrl}/hotels/${id}/amenities`,
    );
  }

  getAdminAmenities(id: number): Observable<HotelAmenityApiResponse[]> {
    return this.http.get<HotelAmenityApiResponse[]>(
      `${this.apiBaseUrl}/hotels/admin/${id}/amenities`,
    );
  }

  createAmenity(
    hotelId: number,
    request: HotelAmenityRequest,
  ): Observable<HotelAmenityApiResponse> {
    return this.http.post<HotelAmenityApiResponse>(
      `${this.apiBaseUrl}/hotels/${hotelId}/amenities`,
      request,
    );
  }

  updateAmenity(
    hotelId: number,
    id: number,
    request: HotelAmenityRequest,
  ): Observable<HotelAmenityApiResponse> {
    return this.http.put<HotelAmenityApiResponse>(
      `${this.apiBaseUrl}/hotels/${hotelId}/amenities/${id}`,
      request,
    );
  }

  deleteAmenity(hotelId: number, id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/hotels/${hotelId}/amenities/${id}`,
    );
  }

  getAdminImages(id: number): Observable<HotelImageApiResponse[]> {
    return this.http.get<HotelImageApiResponse[]>(
      `${this.apiBaseUrl}/hotels/admin/${id}/images`,
    );
  }

  getPublishedRoomTypes(
    hotelId: number,
  ): Observable<HotelRoomTypeApiResponse[]> {
    return this.http.get<HotelRoomTypeApiResponse[]>(
      `${this.apiBaseUrl}/hotels/${hotelId}/room-types`,
    );
  }

  getRoomTypeAvailability(
    hotelId: number,
    roomTypeId: number,
    checkIn: string,
    checkOut: string,
    rooms: number,
  ): Observable<HotelRoomAvailabilityResponse> {
    return this.http.get<HotelRoomAvailabilityResponse>(
      `${this.apiBaseUrl}/hotels/${hotelId}/room-types/${roomTypeId}/availability`,
      {
        params: {
          checkIn,
          checkOut,
          rooms: String(rooms),
        },
      },
    );
  }

  getAdminRates(): Observable<RoomRateApiResponse[]> {
    return this.http.get<RoomRateApiResponse[]>(
      `${this.apiBaseUrl}/hotel-inventory/rates`,
    );
  }

  getAdminAvailability(): Observable<RoomAvailabilityApiResponse[]> {
    return this.http.get<RoomAvailabilityApiResponse[]>(
      `${this.apiBaseUrl}/hotel-inventory/availability`,
    );
  }

  createAvailability(
    request: RoomAvailabilityRequest,
  ): Observable<RoomAvailabilityApiResponse> {
    return this.http.post<RoomAvailabilityApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/availability`,
      request,
    );
  }

  updateAvailability(
    id: number,
    request: RoomAvailabilityRequest,
  ): Observable<RoomAvailabilityApiResponse> {
    return this.http.put<RoomAvailabilityApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/availability/${id}`,
      request,
    );
  }

  deleteAvailability(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/hotel-inventory/availability/${id}`,
    );
  }

  createRate(request: RoomRateRequest): Observable<RoomRateApiResponse> {
    return this.http.post<RoomRateApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/rates`,
      request,
    );
  }

  updateRate(
    id: number,
    request: RoomRateRequest,
  ): Observable<RoomRateApiResponse> {
    return this.http.put<RoomRateApiResponse>(
      `${this.apiBaseUrl}/hotel-inventory/rates/${id}`,
      request,
    );
  }

  deleteRate(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/hotel-inventory/rates/${id}`,
    );
  }
}
