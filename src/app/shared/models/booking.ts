export interface Booking {
  id: number;

  bookingReference: string;

  userId: number;

  bookingType:
    | 'HOTEL'
    | 'TOUR_PACKAGE'
    | 'RESTAURANT'
    | 'TRANSPORT'
    | 'TOUR_GUIDE';

  itemId: number;
  hotelDetails?: HotelBookingDetails;
  items?: BookingItem[];
  guests?: BookingGuest[];
  customerName?: string;
  customerEmail?: string;

  bookingDate: string;

  startDate?: string;
  endDate?: string;

  guestCount: number;

  totalAmount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  currency?: string;

  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';

  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';

  specialRequest?: string;
  personalTouch?: string;

  /** Display and audit fields returned by the booking API. */
  serviceName?: string;
  partnerId?: number;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  paymentTransactionId?: string;
  invoiceNumber?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface BookingItem {
  resourceType: 'HOTEL' | 'TOUR' | 'TRANSPORT' | 'RESTAURANT' | 'GUIDE';
  resourceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  hotelDetails?: HotelBookingDetails | null;
}

export interface BookingGuest {
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  leadGuest: boolean;
}

export interface HotelBookingDetails {
  hotelId: number;
  hotelName: string;
  destinationName: string;
  destinationRegion: string | null;
  destinationCountryCode: string;
  address: string;
  starRating: number;
  hotelImageUrl: string | null;
  roomTypeId: number;
  roomTypeName: string;
  roomCategory: string;
  roomNumber: string;
  floorLabel: string | null;
  viewDescription: string | null;
  roomImageUrl: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  cancellationPolicy: string | null;
  childPolicy: string | null;
}
