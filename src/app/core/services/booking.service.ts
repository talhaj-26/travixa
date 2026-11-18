
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  map,
  throwError,
} from 'rxjs';

import { Booking, HotelBookingDetails } from '../../shared/models/booking';
import { API_CONFIG, ApiConfig } from '../config/api.config';
import { Inject } from '@angular/core';

export interface BookingGuestRequest {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  leadGuest: boolean;
}

export interface BookingGuestResponse {
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  leadGuest: boolean;
}

export interface CreateBookingRequest {
  idempotencyKey?: string;
  userId?: number;
  bookingType: Booking['bookingType'];
  itemId: number;
  bookingDate: string;
  startDate?: string;
  endDate?: string;
  guestCount: number;
  totalAmount?: number;
  specialRequest?: string;
  serviceName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  roomCount?: number;
  departureId?: number;
  durationHours?: number;
  companions?: { fullName: string; email?: string; phoneNumber?: string }[];
  couponCode?: string;
  personalTouch?: string;
}

export interface BookingItemResponse {
  resourceType: 'HOTEL' | 'TOUR' | 'TRANSPORT' | 'RESTAURANT' | 'GUIDE';
  resourceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  hotelDetails?: HotelBookingDetails | null;
}

export interface BookingResponse {
  id: number;
  referenceNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  placedAt: string;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  specialRequest: string | null;
  personalTouch: string | null;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  subtotalAmount: number;
  discountAmount: number;
  couponCode: string | null;
  items: BookingItemResponse[];
  guests: BookingGuestResponse[];
}

type BookingResourceType = 'HOTEL' | 'TOUR' | 'TRANSPORT' | 'RESTAURANT' | 'GUIDE';

export interface CouponValidationResponse {
  code: string;
  orderAmount: number;
  discountAmount: number;
  payableAmount: number;
  currency: string;
}

// Backend DTO interfaces

export interface HotelResponse {
  id: number;
  organizationId: number;
  destinationId: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  starRating: number;
  listingStatus: string;
}

export interface RoomResponse {
  id: number;
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  status: string;
  floorLabel: string | null;
  viewDescription: string | null;
}

export interface TourPackageResponse {
  id: number;
  organizationId: number;
  destinationId: number;
  destinationName: string;
  name: string;
  slug: string;
  description: string | null;
  inclusions: string | null;
  exclusions: string | null;
  cancellationPolicy: string | null;
  bookingDeadlineHours: number | null;
  durationDays: number;
  maximumGroupSize: number;
  basePrice: number;
  currency: string;
  listingStatus: string;
}

export interface MenuItemResponse {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  status: string;
  vegetarian: boolean;
}

export interface GuideOfferingResponse {
  id: number;
  guideProfileId: number;
  userName: string;
  organizationId: number | null;
  organizationName: string | null;
  biography: string | null;
  languageCodes: string | null;
  name: string;
  description: string | null;
  pricePerHour: number;
  currency: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly apiBaseUrl: string;
  private readonly bookingUrl: string;

  private readonly hotelUrl: string;
  private readonly roomUrl: string;
  private readonly tourPackageUrl: string;
  private readonly menuItemUrl: string;
  private readonly mediaBaseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) apiConfig: ApiConfig) {
    this.apiBaseUrl = `${apiConfig.baseUrl.replace(/\/+$/, '')}${apiConfig.apiPrefix}`;
    this.mediaBaseUrl = apiConfig.baseUrl.replace(/\/+$/, '') + '/';
    this.bookingUrl = `${this.apiBaseUrl}/bookings`;
    this.hotelUrl = `${this.apiBaseUrl}/hotels`;
    this.roomUrl = `${this.apiBaseUrl}/rooms`;
    this.tourPackageUrl = `${this.apiBaseUrl}/tours-packages`;
    this.menuItemUrl = `${this.apiBaseUrl}/menu-items`;
  }

  // Catalog APIs

  getHotels(): Observable<HotelResponse[]> {
    return this.http.get<HotelResponse[]>(this.hotelUrl);
  }

  getRooms(): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(this.roomUrl);
  }

  getRoomById(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.roomUrl}/${id}`);
  }

  getTourPackages(): Observable<TourPackageResponse[]> {
    return this.http.get<TourPackageResponse[]>(this.tourPackageUrl);
  }

  getMenuItems(): Observable<MenuItemResponse[]> {
    return this.http.get<MenuItemResponse[]>(this.menuItemUrl);
  }

  getGuideOfferings(): Observable<GuideOfferingResponse[]> {
    return this.http.get<GuideOfferingResponse[]>(`${this.apiBaseUrl}/guide-offerings/public`);
  }

  getMenuItemById(id: number): Observable<MenuItemResponse> {
    return this.http.get<MenuItemResponse>(`${this.menuItemUrl}/${id}`);
  }

  // Booking APIs

  getAll(): Observable<Booking[]> {
    return this.http
      .get<BookingResponse[]>(this.bookingUrl)
      .pipe(
        map((responses) =>
          responses.map((response) => this.toBooking(response)),
        ),
      );
  }

  getById(id: number): Observable<Booking> {
    return this.http
      .get<BookingResponse>(`${this.bookingUrl}/${id}`)
      .pipe(map((response) => this.toBooking(response)));
  }

  cancelBooking(id: number): Observable<Booking> {
    return this.http
      .patch<BookingResponse>(`${this.bookingUrl}/${id}/cancel`, {})
      .pipe(map((response) => this.toBooking(response)));
  }

  deleteBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.bookingUrl}/${id}`);
  }

  getByReference(reference: string): Observable<Booking> {
    return this.getAll().pipe(
      map((bookings) => {
        const booking = bookings.find(
          (item) => item.bookingReference === reference,
        );

        if (!booking) {
          throw new Error('Booking not found.');
        }

        return booking;
      }),
    );
  }

  validateCoupon(code: string, orderAmount: number, currency = 'BDT'): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.apiBaseUrl}/coupons/validate`, { code, orderAmount, currency });
  }

  create(request: CreateBookingRequest): Observable<Booking> {
    let resourceType: BookingResourceType;

    try {
      resourceType = this.toResourceType(request.bookingType);
    } catch (error) {
      return throwError(() => error);
    }

    if (!request.itemId || request.itemId <= 0) {
      return throwError(
        () => new Error('Select a valid booking item.'),
      );
    }

    if (!request.fullName?.trim() || !request.email?.trim()) {
      return throwError(
        () => new Error('Guest name and email are required.'),
      );
    }

    if (!request.phone?.trim()) {
      return throwError(
        () => new Error('Guest phone number is required.'),
      );
    }

    const bookingRequest = {
      idempotencyKey: request.idempotencyKey || this.createIdempotencyKey(),
      items: [{
        resourceType,
        resourceId: request.itemId,
        quantity:
          request.bookingType === 'HOTEL'
            ? Math.max(1, Math.floor(request.roomCount || 1))
            : request.bookingType === 'TOUR_GUIDE'
              ? Math.max(1, Math.floor(request.durationHours || 1))
              : Math.max(1, Math.floor(request.guestCount || 1)),
        departureId: request.departureId,
      }],
      serviceStartDate: request.startDate,
      serviceEndDate: request.endDate,
      specialRequest: request.specialRequest?.trim() || undefined,
      personalTouch: request.personalTouch?.trim() || undefined,
      guestCount: Math.max(1, Math.floor(request.guestCount || 1)),
      couponCode: request.couponCode?.trim().toUpperCase() || undefined,
      guests: [
        {
          fullName: request.fullName.trim(),
          email: request.email.trim(),
          phoneNumber: request.phone.trim(),
          leadGuest: true,
        },
        ...(request.companions ?? []).filter((guest) => guest.fullName.trim()).map((guest) => ({
          fullName: guest.fullName.trim(),
          email: guest.email?.trim() || undefined,
          phoneNumber: guest.phoneNumber?.trim() || undefined,
          leadGuest: false,
        })),
      ],
    };

    return this.http.post<BookingResponse>(this.bookingUrl, bookingRequest).pipe(
      map((response) => this.toBooking(response)),
    );
  }

  private toResourceType(
    type: Booking['bookingType'],
  ): BookingResourceType {
    switch (type) {
      case 'HOTEL':
        return 'HOTEL';

      case 'TOUR_PACKAGE':
        return 'TOUR';

      case 'RESTAURANT':
        return 'RESTAURANT';

      case 'TRANSPORT':
        return 'TRANSPORT';

      case 'TOUR_GUIDE':
        return 'GUIDE';

      default:
        throw new Error('Unsupported booking type.');
    }
  }

  private toBooking(response: BookingResponse): Booking {
    const items = (response.items ?? []).map((item) => ({
      ...item,
      hotelDetails: item.hotelDetails ? {
        ...item.hotelDetails,
        hotelImageUrl: this.resolveMediaUrl(item.hotelDetails.hotelImageUrl),
        roomImageUrl: this.resolveMediaUrl(item.hotelDetails.roomImageUrl),
      } : item.hotelDetails,
    }));
    const firstItem = items[0];

    const bookingStatus: Booking['bookingStatus'] =
      response.status === 'CANCELLED'
        ? 'CANCELLED'
        : response.status === 'CONFIRMED'
          ? 'CONFIRMED'
          : response.status === 'COMPLETED'
            ? 'COMPLETED'
            : response.status === 'REFUNDED'
              ? 'REFUNDED'
            : 'PENDING';

    const bookingType: Booking['bookingType'] =
      firstItem?.resourceType === 'HOTEL'
        ? 'HOTEL'
        : firstItem?.resourceType === 'RESTAURANT'
          ? 'RESTAURANT'
          : firstItem?.resourceType === 'TRANSPORT'
            ? 'TRANSPORT'
            : firstItem?.resourceType === 'GUIDE'
              ? 'TOUR_GUIDE'
            : 'TOUR_PACKAGE';

    return {
      id: response.id,
      bookingReference: response.referenceNumber,
      userId: 0,
      bookingType,
      itemId: firstItem?.resourceId ?? 0,
      items,
      guests: response.guests ?? [],
      customerName: response.customerName,
      customerEmail: response.customerEmail,
      hotelDetails: firstItem?.hotelDetails ? {
        ...firstItem.hotelDetails,
      } : undefined,
      bookingDate: response.placedAt,
      startDate: response.serviceStartDate ?? undefined,
      endDate: response.serviceEndDate ?? undefined,
      guestCount: response.guestCount ?? response.guests?.length ?? 1,
      totalAmount: response.totalAmount,
      subtotalAmount: response.subtotalAmount,
      discountAmount: response.discountAmount,
      couponCode: response.couponCode ?? undefined,
      currency: response.currency,
      paymentStatus: response.paymentStatus === 'SUCCEEDED'
        ? 'PAID'
        : response.paymentStatus === 'FAILED'
          ? 'FAILED'
          : response.paymentStatus === 'REFUNDED'
            ? 'REFUNDED'
          : response.paymentStatus === 'PARTIALLY_REFUNDED'
            ? 'PARTIALLY_REFUNDED'
            : 'PENDING',
      bookingStatus,
      specialRequest: response.specialRequest ?? undefined,
      personalTouch: response.personalTouch ?? undefined,
      serviceName: firstItem?.description ?? 'Booking',
      createdAt: response.placedAt,
      updatedAt: response.placedAt,
    };
  }

  private resolveMediaUrl(url: string | null): string | null {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    return new URL(url.replace(/^\/+/, ''), this.mediaBaseUrl).toString();
  }

  private createIdempotencyKey(): string {
    return `travixa-booking-${crypto.randomUUID()}`;
  }
}
