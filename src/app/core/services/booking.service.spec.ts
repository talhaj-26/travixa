import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BookingService } from './booking.service';
import { API_CONFIG } from '../config/api.config';
import { CreateBookingRequest } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: API_CONFIG,
        useValue: { baseUrl: 'http://localhost:8080', apiPrefix: '/api', backendReady: true },
      }],
    });
    service = TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('submits the selected booking directly without including unrelated active cart items', () => {
    const request: CreateBookingRequest = {
      bookingType: 'HOTEL',
      itemId: 77,
      bookingDate: '2026-11-10',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      guestCount: 2,
      roomCount: 1,
      fullName: 'Test Customer',
      email: 'customer@example.com',
      phone: '+8801000000000',
    };

    let bookingReference = '';
    service.create(request).subscribe((booking) => bookingReference = booking.bookingReference);

    const checkout = http.expectOne('http://localhost:8080/api/bookings');
    expect(checkout.request.method).toBe('POST');
    expect(checkout.request.body.items).toEqual([{
      resourceType: 'HOTEL',
      resourceId: 77,
      quantity: 1,
      departureId: undefined,
    }]);
    checkout.flush({
      id: 31,
      referenceNumber: 'TRV-31',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      subtotalAmount: 1000,
      discountAmount: 0,
      couponCode: null,
      totalAmount: 1000,
      currency: 'BDT',
      placedAt: '2026-10-30T03:00:00Z',
      serviceStartDate: '2026-11-10',
      serviceEndDate: '2026-11-12',
      specialRequest: null,
      guestCount: 2,
      items: [{ resourceType: 'HOTEL', resourceId: 77, description: 'Hotel · Deluxe', quantity: 1, unitPrice: 1000, lineTotal: 1000, currency: 'BDT', hotelDetails: null }],
      guests: [],
    });

    expect(bookingReference).toBe('TRV-31');
  });
});
