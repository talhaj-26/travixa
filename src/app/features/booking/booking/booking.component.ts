import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  HotelService,
  HotelRoomAvailabilityResponse,
} from '../../../core/services/hotel.service';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import {
  BookingService,
  CreateBookingRequest,
  HotelResponse,
  RoomResponse,
  TourPackageResponse,
  MenuItemResponse,
  GuideOfferingResponse,
} from '../../../core/services/booking.service';

type BookingType = 'HOTEL' | 'TOUR_PACKAGE' | 'RESTAURANT' | 'TOUR_GUIDE';
type ToastType = 'success' | 'info' | 'warning' | 'error' | 'danger';

interface BookingForm {
  bookingType: BookingType;
  itemId: number;
  bookingDate: string;
  startDate: string;
  endDate: string;
  timeSlot: string;
  adults: number;
  children: number;
  infants: number;
  fullName: string;
  email: string;
  phone: string;
  specialRequest: string;
  durationHours: number;
}

interface CompanionDraft {
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface CatalogItem {
  id: number;
  type: BookingType;
  name: string;
  location: string;
  image: string;
  imageUrl?: string;
  description?: string;
  gallery: string[];
  basePrice: number;
  priceUnit: string;
  rating?: number;
  cuisine?: string;
  specialty?: string[];
  languages?: string[];
  tags: string[];
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  image: string;
}

interface Coupon {
  code: string;
  discountAmount: number;
  label: string;
}

interface Step {
  id: number;
  label: string;
  icon: string;
  description: string;
}

interface HeroSlide {
  image: string;
  kicker: string;
  title: string;
  highlight: string;
  text: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit, OnDestroy {
  private routeSubscription?: Subscription;
  private catalogSubscription?: Subscription;
  requestedHotelId: number | null = null;
  requestedRoomTypeId: number | null = null;
  private requestedDepartureId: number | null = null;
  private hotelAvailabilityRequestId = 0;
  private bookingSubmissionFingerprint = '';
  private bookingSubmissionKey = '';
  hotelRoomCount = 1;
  private readonly hotelService = inject(HotelService);
  hotelAvailability: HotelRoomAvailabilityResponse | null = null;
  hotelAvailabilityLoading = false;
  hotelAvailabilityError = '';

  /* HERO SLIDESHOW */

  currentHeroSlide = 0;
  private heroInterval: ReturnType<typeof setInterval> | null = null;

  heroSlides: HeroSlide[] = [
    {
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=90',
      kicker: 'Reserve With Confidence',
      title: 'Turn Your Plans',
      highlight: 'Into Journeys.',
      text: 'Explore hotels, tours and dining experiences with TRAVIXA.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=90',
      kicker: 'Premium Hotels',
      title: 'Stay In',
      highlight: 'Comfort.',
      text: 'Discover available rooms for your next stay.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1920&q=90',
      kicker: 'Dining Experiences',
      title: 'Taste The',
      highlight: 'Experience.',
      text: 'Explore available restaurant menu items.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=90',
      kicker: 'Guided Adventures',
      title: 'Journey Beyond',
      highlight: 'The Map.',
      text: 'Find tours and experiences for your next adventure.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&q=90',
      kicker: 'Travel With Care',
      title: 'Plan With',
      highlight: 'Confidence.',
      text: 'Review your booking details before submitting your request.',
    },
  ];

  /* BOOKING TYPE AND API CATALOG */

  bookingType: BookingType = 'HOTEL';
  itemId = 0;
  selectedItem: CatalogItem | null = null;

  catalog: CatalogItem[] = [];
  isLoadingCatalog = false;
  catalogError = '';

  private readonly fallbackImages: Record<string, string> = {
    HOTEL: '',
    TOUR_PACKAGE: '',
    RESTAURANT: '',
    TOUR_GUIDE: '',
  };

  bookingTypes: {
    value: BookingType;
    label: string;
    icon: string;
    desc: string;
    color: string;
  }[] = [
    {
      value: 'HOTEL',
      label: 'Hotel Stay',
      icon: '🏨',
      desc: 'Select an available room',
      color: '#0ea5e9',
    },
    {
      value: 'TOUR_PACKAGE',
      label: 'Tour Package',
      icon: '🧳',
      desc: 'Book your adventure',
      color: '#f59e0b',
    },
    {
      value: 'RESTAURANT',
      label: 'Restaurant Menu',
      icon: '🍽️',
      desc: 'Order an available menu item',
      color: '#ef4444',
    },
    {
      value: 'TOUR_GUIDE',
      label: 'Tour Guide Service',
      icon: '🧭',
      desc: 'Hire an active guide by the hour',
      color: '#14b8a6',
    },
  ];

  /* WIZARD */

  currentStep = 1;
  totalSteps = 4;

  steps: Step[] = [
    { id: 1, label: 'Schedule', icon: '📅', description: 'Dates & timing' },
    { id: 2, label: 'Guests', icon: '👥', description: 'Travellers & contact' },
    { id: 3, label: 'Add-ons', icon: '✨', description: 'Optional extras' },
    { id: 4, label: 'Review', icon: '✓', description: 'Confirm & pay' },
  ];

  booking: BookingForm = this.createEmptyForm();
  companions: CompanionDraft[] = [];

  /* ADD-ONS AND COUPONS */

  selectedAddOns = new Set<string>();
  couponCode = '';
  appliedCoupon: Coupon | null = null;
  couponError = '';

  /* UI STATE */

  isSubmitted = false;
  isSubmitting = false;
  bookingReference = '';
  submittedBooking: BookingForm | null = null;
  submittedAmount = 0;
  submittedBookingId = 0;
  isDownloadingInvoice = false;
  submittedItem: CatalogItem | null = null;
  savedToWishlist = false;
  touched: Record<string, boolean> = {};

  animatedTotal = 0;
  animatedBasePrice = 0;

  confettiDots: {
    color: string;
    left: number;
    delay: number;
    size: number;
    duration: number;
  }[] = [];

  toastMessage = '';
  showToastMessage = false;
  toastType: ToastType = 'info';

  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'danger';
  } = {
    show: false,
    message: '',
    type: 'info',
  };

  timeSlots = [
    {
      value: 'MORNING',
      label: 'Morning',
      time: '9:00 AM – 12:00 PM',
      icon: '🌅',
      description: 'Start your day with a morning experience.',
    },
    {
      value: 'LUNCH',
      label: 'Lunch',
      time: '12:00 PM – 3:00 PM',
      icon: '☀️',
      description: 'Perfect for a midday booking.',
    },
    {
      value: 'EVENING',
      label: 'Evening',
      time: '5:00 PM – 8:00 PM',
      icon: '🌇',
      description: 'Enjoy an evening experience.',
    },
    {
      value: 'DINNER',
      label: 'Dinner',
      time: '8:00 PM – 11:00 PM',
      icon: '🌙',
      description: 'Reserve your preferred dinner time.',
    },
  ];

  /* Optional extras are only shown when backed by a bookable API resource.
   * The previous hand-authored extras had no server-side resource or price
   * contract, so they could not be included in a persisted booking. */

  private readonly addOnsCatalog: Record<BookingType, AddOn[]> = {
    HOTEL: [],
    TOUR_PACKAGE: [],
    RESTAURANT: [],
    TOUR_GUIDE: [],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private notificationService: NotificationService,
    private invoiceService: InvoiceService,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.booking.fullName = currentUser.name || currentUser.username || '';
      this.booking.email = currentUser.email || '';
    }
    this.routeSubscription = this.route.queryParams.subscribe((params) => {
      const requestedType = String(params['type'] || 'HOTEL').toUpperCase();
      const requestedId = Number(params['itemId'] || 0);
      const requestedHotelId = Number(params['hotelId'] || 0);
      const requestedRoomTypeId = Number(params['roomTypeId'] || 0);
      const requestedDepartureId = Number(params['departureId'] || 0);
      const requestedGuests = Number(params['guests'] || 0);
      const requestedRooms = Number(params['rooms'] || 1);
      const requestedTravellers = Number(params['travellers'] || 0);

      const supportedTypes: BookingType[] = [
        'HOTEL',
        'TOUR_PACKAGE',
        'RESTAURANT',
        'TOUR_GUIDE',
      ];

      this.bookingType = supportedTypes.includes(requestedType as BookingType)
        ? (requestedType as BookingType)
        : 'HOTEL';

      this.booking.bookingType = this.bookingType;
      this.itemId =
        Number.isFinite(requestedId) && requestedId > 0 ? requestedId : 0;
      this.booking.itemId = this.itemId;

      this.requestedHotelId =
        Number.isInteger(requestedHotelId) && requestedHotelId > 0
          ? requestedHotelId
          : null;
      this.requestedRoomTypeId =
        Number.isInteger(requestedRoomTypeId) && requestedRoomTypeId > 0
          ? requestedRoomTypeId
          : null;
      this.requestedDepartureId =
        Number.isInteger(requestedDepartureId) && requestedDepartureId > 0
          ? requestedDepartureId
          : null;
      this.hotelRoomCount =
        Number.isInteger(requestedRooms) && requestedRooms > 0
          ? Math.min(requestedRooms, 10)
          : 1;

      if (this.bookingType === 'HOTEL') {
        this.booking.startDate = this.isIsoDate(params['checkIn'])
          ? params['checkIn']
          : this.booking.startDate;
        this.booking.endDate = this.isIsoDate(params['checkOut'])
          ? params['checkOut']
          : this.booking.endDate;
        this.booking.adults =
          Number.isInteger(requestedGuests) && requestedGuests > 0
            ? requestedGuests
            : this.booking.adults;
        this.booking.children = 0;
      }
      if (this.bookingType === 'TOUR_PACKAGE') {
        this.booking.bookingDate = this.isIsoDate(params['date'])
          ? params['date']
          : this.booking.bookingDate;
        this.booking.adults =
          Number.isInteger(requestedTravellers) && requestedTravellers > 0
            ? requestedTravellers
            : this.booking.adults;
        this.booking.children = 0;
      }

      this.loadCatalog();
    });

    this.startHeroSlideshow();
    this.buildConfetti();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.catalogSubscription?.unsubscribe();

    this.stopHeroSlideshow();

    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }

    document.body.style.overflow = '';
  }

  /* API CATALOG LOADING */

  loadCatalog(): void {
    this.catalogSubscription?.unsubscribe();

    this.isLoadingCatalog = true;
    this.catalogError = '';
    this.catalog = [];
    this.selectedItem = null;

    switch (this.bookingType) {
      case 'HOTEL':
        this.loadRoomsAndHotels();
        break;

      case 'TOUR_PACKAGE':
        this.loadTourPackages();
        break;

      case 'RESTAURANT':
        this.loadMenuItems();
        break;

      case 'TOUR_GUIDE':
        this.catalogSubscription = this.bookingService
          .getGuideOfferings()
          .subscribe({
            next: (offerings) => {
              this.catalog = offerings.map((offer) =>
                this.mapGuideOffering(offer),
              );
              this.finishCatalogLoad();
            },
            error: () =>
              this.handleCatalogError(
                'Could not load available guide services.',
              ),
          });
        break;

      default:
        this.isLoadingCatalog = false;
        this.catalogError = 'This booking type is not currently supported.';
        break;
    }
  }

  private loadRoomsAndHotels(): void {
    this.catalogSubscription = forkJoin({
      rooms: this.bookingService.getRooms().pipe(catchError(() => of(null))),
      hotels: this.bookingService.getHotels().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ rooms, hotels }) => {
        if (rooms === null || hotels === null) {
          this.handleCatalogError(
            'Could not load rooms and hotels. Please check the backend API and your access permissions.',
          );
          return;
        }

        const hotelList = hotels as HotelResponse[];

        this.catalog = (rooms as RoomResponse[])
          .filter((room) => String(room.status).toUpperCase() === 'AVAILABLE')
          .map((room) => this.mapRoom(room, hotelList))
          .filter((item): item is CatalogItem => item !== null);

        this.applyRequestedHotelRoom();

        this.finishCatalogLoad();
      },
      error: () => {
        this.handleCatalogError(
          'Could not load available rooms. Please try again.',
        );
      },
    });
  }

  private mapRoom(
    room: RoomResponse,
    hotels: HotelResponse[],
  ): CatalogItem | null {
    const hotel = hotels.find((item) => item.id === room.hotelId);

    if (!hotel) {
      return null;
    }

    return {
      id: room.id,
      type: 'HOTEL',
      name: `${hotel.name} — Room ${room.roomNumber}`,
      location: hotel.address || 'Location not provided',
      image: this.fallbackImages['HOTEL'],
      gallery: [this.fallbackImages['HOTEL']],
      // RoomResponse does not contain a rate. Do not invent one.
      basePrice: 0,
      priceUnit: 'per night',
      rating: Number(hotel.starRating) || undefined,
      tags: [
        `Hotel ID: ${room.hotelId}`,
        `Room ${room.roomNumber}`,
        `Room type ID: ${room.roomTypeId}`,
        'Available',
      ],
    };
  }

  private applyRequestedHotelRoom(): void {
    if (
      this.bookingType !== 'HOTEL' ||
      this.requestedHotelId === null ||
      this.requestedRoomTypeId === null
    ) {
      return;
    }

    const requestedRoom = this.catalog.find(
      (item) =>
        item.tags.includes(`Hotel ID: ${this.requestedHotelId}`) &&
        item.tags.includes(`Room type ID: ${this.requestedRoomTypeId}`),
    );

    if (!requestedRoom) {
      this.catalogError =
        'The selected hotel room is no longer available. Please choose another room.';
      return;
    }

    this.itemId = requestedRoom.id;
    this.booking.itemId = requestedRoom.id;
  }

  private loadTourPackages(): void {
    this.catalogSubscription = this.bookingService.getTourPackages().subscribe({
      next: (packages: TourPackageResponse[]) => {
        this.catalog = packages
          .filter(
            (item) => String(item.listingStatus).toUpperCase() === 'PUBLISHED',
          )
          .map((item) => this.mapTourPackage(item));

        this.finishCatalogLoad();
      },
      error: () => {
        this.handleCatalogError(
          'Could not load tour packages. Please check your backend API access.',
        );
      },
    });
  }

  private mapTourPackage(item: TourPackageResponse): CatalogItem {
    const duration = item.durationDays
      ? `${item.durationDays} day(s)`
      : 'Duration not specified';

    return {
      id: item.id,
      type: 'TOUR_PACKAGE',
      name: item.name,
      location: 'Destination details unavailable',
      image: this.fallbackImages['TOUR_PACKAGE'],
      gallery: [this.fallbackImages['TOUR_PACKAGE']],
      basePrice: Number(item.basePrice) || 0,
      priceUnit: 'per person',
      tags: [
        duration,
        `Maximum group size: ${item.maximumGroupSize ?? 'Not specified'}`,
      ],
    };
  }

  private loadMenuItems(): void {
    this.catalogSubscription = this.bookingService.getMenuItems().subscribe({
      next: (items: MenuItemResponse[]) => {
        this.catalog = items
          .filter((item) => String(item.status).toUpperCase() === 'AVAILABLE')
          .map((item) => this.mapMenuItem(item));

        this.finishCatalogLoad();
      },
      error: () => {
        this.handleCatalogError(
          'Could not load available menu items. Please check your backend API access.',
        );
      },
    });
  }

  private mapMenuItem(item: MenuItemResponse): CatalogItem {
    return {
      id: item.id,
      type: 'RESTAURANT',
      name: item.name,
      location: 'Restaurant location unavailable',
      image: this.fallbackImages['RESTAURANT'],
      gallery: [this.fallbackImages['RESTAURANT']],
      basePrice: Number(item.price) || 0,
      priceUnit: 'per item',
      cuisine: item.vegetarian ? 'Vegetarian' : undefined,
      tags: [item.vegetarian ? 'Vegetarian' : 'Menu item', String(item.status)],
    };
  }

  private mapGuideOffering(offer: GuideOfferingResponse): CatalogItem {
    const languages = (offer.languageCodes ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    return {
      id: offer.id,
      type: 'TOUR_GUIDE',
      name: `${offer.userName} · ${offer.name}`,
      location: offer.organizationName ?? 'Location not provided',
      image: '',
      gallery: [],
      description: offer.description ?? offer.biography ?? undefined,
      basePrice: Number(offer.pricePerHour) || 0,
      priceUnit: `per hour (${offer.currency})`,
      languages,
      specialty: [offer.name],
      tags: languages,
    };
  }

  private finishCatalogLoad(): void {
    this.isLoadingCatalog = false;
    this.loadSelectedItem();
    this.animateInitialTotals();
    if (this.bookingType === 'HOTEL') this.checkHotelAvailability();

    if (this.itemId > 0 && !this.selectedItem) {
      this.catalogError =
        'The selected item is unavailable or could not be found. Please choose an item from the available list.';
    }
  }

  checkHotelAvailability(): void {
    if (this.bookingType !== 'HOTEL') return;
    const requestId = ++this.hotelAvailabilityRequestId;
    this.hotelAvailability = null;
    this.hotelAvailabilityError = '';
    if (
      !this.requestedHotelId ||
      !this.requestedRoomTypeId ||
      !this.booking.startDate ||
      !this.booking.endDate ||
      this.booking.endDate <= this.booking.startDate
    ) {
      this.hotelAvailabilityLoading = false;
      return;
    }
    this.hotelAvailabilityLoading = true;
    this.hotelService
      .getRoomTypeAvailability(
        this.requestedHotelId,
        this.requestedRoomTypeId,
        this.booking.startDate,
        this.booking.endDate,
        this.hotelRoomCount,
      )
      .subscribe({
        next: (availability) => {
          if (requestId !== this.hotelAvailabilityRequestId) return;
          this.hotelAvailabilityLoading = false;
          this.hotelAvailability = availability;
          this.hotelAvailabilityError = availability.available
            ? ''
            : availability.message;
        },
        error: (error) => {
          if (requestId !== this.hotelAvailabilityRequestId) return;
          this.hotelAvailabilityLoading = false;
          this.hotelAvailabilityError =
            error?.error?.message || 'Room availability could not be verified.';
        },
      });
  }

  private handleCatalogError(message: string): void {
    this.catalog = [];
    this.selectedItem = null;
    this.isLoadingCatalog = false;
    this.catalogError = message;
    this.animatedBasePrice = 0;
    this.animatedTotal = 0;
  }

  /* HERO SLIDESHOW */

  private startHeroSlideshow(): void {
    this.stopHeroSlideshow();

    this.heroInterval = setInterval(() => {
      this.currentHeroSlide =
        (this.currentHeroSlide + 1) % this.heroSlides.length;
    }, 5500);
  }

  private stopHeroSlideshow(): void {
    if (this.heroInterval !== null) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }
  }

  goToHeroSlide(index: number): void {
    if (index < 0 || index >= this.heroSlides.length) {
      return;
    }

    this.currentHeroSlide = index;
    this.startHeroSlideshow();
  }

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentHeroSlide];
  }

  /* FORM HELPERS */

  private createEmptyForm(): BookingForm {
    return {
      bookingType: 'HOTEL',
      itemId: 0,
      bookingDate: this.getLocalDateString(),
      startDate: '',
      endDate: '',
      timeSlot: '',
      adults: 2,
      children: 0,
      infants: 0,
      fullName: '',
      email: '',
      phone: '',
      specialRequest: '',
      durationHours: 1,
    };
  }

  private getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDate(date: string): Date | null {
    if (!date) {
      return null;
    }

    const parts = date.split('-').map(Number);

    if (parts.length !== 3 || !parts.every(Number.isFinite)) {
      return null;
    }

    const [year, month, day] = parts;
    const parsed = new Date(year, month - 1, day);

    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  private loadSelectedItem(): void {
    this.selectedItem =
      this.catalog.find(
        (item) => item.type === this.bookingType && item.id === this.itemId,
      ) || null;
  }

  private animateInitialTotals(): void {
    this.animatedBasePrice = this.selectedItem?.basePrice || 0;
    this.animatedTotal = this.totalAmount;
  }

  private animateTotal(): void {
    this.animatedTotal = this.totalAmount;
  }

  private buildConfetti(): void {
    const colors = [
      '#6c63ff',
      '#00b4d8',
      '#f72585',
      '#10b981',
      '#f59e0b',
      '#ffffff',
    ];

    this.confettiDots = Array.from({ length: 50 }, () => ({
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 10,
      duration: 3 + Math.random() * 5,
    }));
  }

  /* BOOKING TYPE */

  selectBookingType(type: BookingType): void {
    if (type === this.bookingType) {
      return;
    }

    this.bookingType = type;
    this.booking.bookingType = type;
    this.booking.bookingDate =
      this.booking.bookingDate || this.getLocalDateString();

    this.booking.itemId = 0;
    this.itemId = 0;
    this.selectedItem = null;

    this.selectedAddOns.clear();
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';
    this.isSubmitted = false;
    this.currentStep = 1;
    this.touched = {};
    this.animatedTotal = 0;
    this.animatedBasePrice = 0;

    this.loadCatalog();
  }

  get activeBookingTypeMeta() {
    return this.bookingTypes.find((item) => item.value === this.bookingType);
  }

  /* GUESTS */

  addCompanion(): void {
    if (this.companions.length < 9)
      this.companions.push({ fullName: '', email: '', phoneNumber: '' });
  }

  removeCompanion(index: number): void {
    this.companions.splice(index, 1);
  }

  get totalGuests(): number {
    return this.booking.adults + this.booking.children + this.booking.infants;
  }

  adjustGuests(field: 'adults' | 'children' | 'infants', delta: number): void {
    const minimum = field === 'adults' ? 1 : 0;
    this.booking[field] = Math.max(minimum, this.booking[field] + delta);

    this.animateTotal();
  }

  /* ADD-ONS */

  get availableAddOns(): AddOn[] {
    return this.addOnsCatalog[this.bookingType] || [];
  }

  toggleAddOn(addon: AddOn): void {
    if (this.selectedAddOns.has(addon.id)) {
      this.selectedAddOns.delete(addon.id);
    } else {
      this.selectedAddOns.add(addon.id);
    }

    this.selectedAddOns = new Set(this.selectedAddOns);
    this.animateTotal();
  }

  isAddOnSelected(id: string): boolean {
    return this.selectedAddOns.has(id);
  }

  get selectedAddOnsList(): AddOn[] {
    return this.availableAddOns.filter((item) =>
      this.selectedAddOns.has(item.id),
    );
  }

  /* COUPONS */

  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();

    if (!code) {
      this.couponError = 'Please enter a coupon code';
      return;
    }

    if (this.baseSubtotal <= 0) {
      this.couponError =
        'Select dates and a bookable service before validating a promo code.';
      return;
    }
    this.bookingService
      .validateCoupon(
        code,
        this.baseSubtotal,
        this.hotelAvailability?.currency || 'BDT',
      )
      .subscribe({
        next: (result) => {
          this.appliedCoupon = {
            code: result.code,
            discountAmount: result.discountAmount,
            label: `Server checked · ${result.currency} ${result.discountAmount.toLocaleString('en-BD')} off; rechecked at booking`,
          };
          this.couponCode = result.code;
          this.couponError = '';
          this.animateTotal();
        },
        error: (error) => {
          this.appliedCoupon = null;
          this.couponError =
            error?.error?.message || 'Promo code could not be validated.';
          this.animateTotal();
        },
      });
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';
    this.animateTotal();
  }

  /* PRICE ESTIMATES */

  get numberOfNights(): number {
    const start = this.parseDate(this.booking.startDate);
    const end = this.parseDate(this.booking.endDate);

    if (!start || !end) {
      return 1;
    }

    const days = Math.round((end.getTime() - start.getTime()) / 86400000);

    return Math.max(1, days);
  }

  get baseSubtotal(): number {
    if (this.bookingType === 'HOTEL')
      return this.hotelAvailability?.totalRoomCost ?? 0;
    if (!this.selectedItem) {
      return 0;
    }

    const unitPrice = Math.max(0, Number(this.selectedItem.basePrice) || 0);

    switch (this.bookingType) {
      case 'TOUR_PACKAGE':
      case 'RESTAURANT':
        return (
          unitPrice * Math.max(1, this.booking.adults + this.booking.children)
        );

      case 'TOUR_GUIDE':
        return (
          unitPrice * Math.max(1, Math.floor(this.booking.durationHours || 1))
        );

      default:
        return 0;
    }
  }

  get addOnsTotal(): number {
    return this.selectedAddOnsList.reduce(
      (sum, addon) => sum + Math.max(0, addon.price),
      0,
    );
  }

  get subtotal(): number {
    return this.baseSubtotal + this.addOnsTotal;
  }

  get displayCurrency(): string {
    return this.bookingType === 'HOTEL'
      ? this.hotelAvailability?.currency || 'BDT'
      : 'BDT';
  }

  get serviceFee(): number {
    return 0;
  }

  get tax(): number {
    return 0;
  }

  get discount(): number {
    if (!this.appliedCoupon) {
      return 0;
    }
    return this.appliedCoupon.discountAmount;
  }

  get totalAmount(): number {
    return Math.max(
      0,
      this.subtotal + this.serviceFee + this.tax - this.discount,
    );
  }

  /*
   * Compatibility getters used by booking.component.html.
   * Keep these as class-level getters.
   */

  get discountAmount(): number {
    return this.discount;
  }

  get taxAmount(): number {
    return this.tax;
  }

  get estimatedTotal(): number {
    return this.totalAmount;
  }

  /* HTML TEMPLATE COMPATIBILITY */

  get selectedAddons(): AddOn[] {
    return this.selectedAddOnsList;
  }

  get specialRequest(): string {
    return this.booking.specialRequest;
  }

  set specialRequest(value: string) {
    this.booking.specialRequest = value;
  }

  get couponMessage(): string {
    return this.appliedCoupon
      ? `${this.appliedCoupon.code} checked — ${this.appliedCoupon.label}`
      : '';
  }

  get bookingDate(): string {
    return this.booking.bookingDate;
  }

  set bookingDate(value: string) {
    this.booking.bookingDate = value;
  }

  get startDate(): string {
    return this.booking.startDate;
  }

  set startDate(value: string) {
    this.booking.startDate = value;
  }

  get endDate(): string {
    return this.booking.endDate;
  }

  set endDate(value: string) {
    this.booking.endDate = value;
  }

  get timeSlot(): string {
    return this.booking.timeSlot;
  }

  set timeSlot(value: string) {
    this.booking.timeSlot = value;
  }

  get adults(): number {
    return this.booking.adults;
  }

  set adults(value: number) {
    this.booking.adults = Math.max(1, Number(value) || 1);
  }

  get children(): number {
    return this.booking.children;
  }

  set children(value: number) {
    this.booking.children = Math.max(0, Number(value) || 0);
  }

  get infants(): number {
    return this.booking.infants;
  }

  set infants(value: number) {
    this.booking.infants = Math.max(0, Number(value) || 0);
  }

  get fullName(): string {
    return this.booking.fullName;
  }

  set fullName(value: string) {
    this.booking.fullName = value;
  }

  get email(): string {
    return this.booking.email;
  }

  set email(value: string) {
    this.booking.email = value;
  }

  get phone(): string {
    return this.booking.phone;
  }

  set phone(value: string) {
    this.booking.phone = value;
  }

  get addons(): AddOn[] {
    return this.availableAddOns;
  }

  toggleAddon(addon: AddOn): void {
    this.toggleAddOn(addon);
  }

  get basePrice(): number {
    if (this.bookingType === 'HOTEL') {
      const availability = this.hotelAvailability;
      if (
        !availability?.available ||
        availability.nights < 1 ||
        availability.requestedRooms < 1
      )
        return 0;
      return (
        availability.totalRoomCost /
        availability.nights /
        availability.requestedRooms
      );
    }
    return this.selectedItem?.basePrice ?? 0;
  }

  get addonsTotal(): number {
    return this.addOnsTotal;
  }

  get minDate(): string {
    return this.getLocalDateString();
  }

  get submittedBookingType(): string {
    const type = this.submittedBooking?.bookingType ?? this.bookingType;

    return this.bookingTypes.find((item) => item.value === type)?.label ?? type;
  }

  /* VALIDATION */

  get step1Valid(): boolean {
    if (!this.booking.bookingDate || !this.booking.startDate) {
      return false;
    }

    const bookingDate = this.parseDate(this.booking.bookingDate);
    const startDate = this.parseDate(this.booking.startDate);

    if (!bookingDate || !startDate) {
      return false;
    }

    if (
      this.bookingType === 'HOTEL' &&
      (!this.booking.endDate || this.booking.endDate <= this.booking.startDate)
    ) {
      return false;
    }

    if (this.bookingType === 'HOTEL' && !this.parseDate(this.booking.endDate)) {
      return false;
    }

    if (this.bookingType === 'RESTAURANT' && !this.booking.timeSlot) {
      return false;
    }

    return true;
  }

  get step2Valid(): boolean {
    return (
      this.booking.adults >= 1 &&
      this.booking.children >= 0 &&
      this.booking.infants >= 0 &&
      !!this.booking.fullName.trim() &&
      !!this.booking.phone.trim() &&
      /^\S+@\S+\.\S+$/.test(this.booking.email.trim()) &&
      this.companions.every((guest) => {
        if (!guest.fullName.trim())
          return !guest.email.trim() && !guest.phoneNumber.trim();
        return (
          (!guest.email.trim() || /^\S+@\S+\.\S+$/.test(guest.email.trim())) &&
          guest.phoneNumber.trim().length <= 40
        );
      })
    );
  }

  get step3Valid(): boolean {
    return true;
  }

  get step4Valid(): boolean {
    return (
      this.step1Valid &&
      this.step2Valid &&
      !!this.selectedItem &&
      this.selectedItem.id === this.booking.itemId &&
      !this.isLoadingCatalog &&
      (this.bookingType !== 'HOTEL' ||
        (!!this.hotelAvailability?.available && !this.hotelAvailabilityLoading))
    );
  }

  get canContinue(): boolean {
    return (
      {
        1: this.step1Valid,
        2: this.step2Valid,
        3: this.step3Valid,
        4: this.step4Valid,
      }[this.currentStep] ?? false
    );
  }

  get progressPercent(): number {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  /* WIZARD */

  nextStep(): void {
    if (!this.canContinue) {
      if (this.currentStep === 1) {
        this.touched['schedule'] = true;
      }

      if (this.currentStep === 2) {
        this.touched['contact'] = true;
      }

      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.scrollToTop();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.scrollToTop();
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step < this.currentStep) {
      this.currentStep = step;
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    setTimeout(() => {
      const element = document.querySelector('.booking-layout');

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 60);
  }

  /* SUBMIT BOOKING */

  submitBooking(): void {
    if (!this.step4Valid || this.isSubmitting) {
      return;
    }

    const customer = this.authService.getCurrentUser();

    if (!this.authService.isLoggedIn() || !customer) {
      this.showToast('Please sign in before booking.', 'danger');

      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });

      return;
    }

    if (!this.selectedItem) {
      this.showToast(
        'Selected item was not found. Please select an available item.',
        'danger',
      );
      return;
    }

    const request: CreateBookingRequest = {
      bookingType: this.booking.bookingType,
      itemId: this.booking.itemId,
      bookingDate: this.booking.bookingDate,
      startDate: this.booking.startDate || undefined,
      endDate: this.booking.endDate || undefined,
      guestCount: Math.max(1, this.booking.adults + this.booking.children),
      specialRequest: this.booking.specialRequest.trim() || undefined,
      personalTouch:
        this.selectedAddons.map((addon) => addon.name).join(', ') || undefined,
      couponCode: this.appliedCoupon?.code,
      serviceName: this.selectedItem.name,
      fullName: this.booking.fullName.trim(),
      email: this.booking.email.trim(),
      phone: this.booking.phone.trim(),
      companions: this.companions,
      roomCount: this.bookingType === 'HOTEL' ? this.hotelRoomCount : undefined,
      departureId:
        this.bookingType === 'TOUR_PACKAGE'
          ? (this.requestedDepartureId ?? undefined)
          : undefined,
      durationHours:
        this.bookingType === 'TOUR_GUIDE'
          ? this.booking.durationHours
          : undefined,
    };

    const submissionFingerprint = JSON.stringify(request);
    if (submissionFingerprint !== this.bookingSubmissionFingerprint) {
      this.bookingSubmissionFingerprint = submissionFingerprint;
      this.bookingSubmissionKey = `travixa-booking-${crypto.randomUUID()}`;
    }
    request.idempotencyKey = this.bookingSubmissionKey;

    this.isSubmitting = true;

    this.bookingService.create(request).subscribe({
      next: (created) => {
        this.isSubmitting = false;

        this.bookingReference = created.bookingReference;
        this.submittedBookingId = created.id;
        this.submittedBooking = { ...this.booking };
        this.submittedAmount = Number(created.totalAmount) || 0;
        this.submittedItem = this.selectedItem;
        this.isSubmitted = true;

        this.notificationService.push(
          'Booking request received',
          `${created.bookingReference} is awaiting payment confirmation for ${created.serviceName ?? 'your selected service'}.`,
          'info',
        );

        document.body.style.overflow = 'hidden';
        this.scrollToTop();
      },
      error: (error) => {
        this.isSubmitting = false;

        const message =
          error?.error?.message ||
          'We could not create this booking. Please try again.';

        this.showToast(message, 'danger');
      },
    });
  }

  confirmAndPay(): void {
    document.body.style.overflow = '';

    if (!this.submittedBooking || !this.bookingReference) {
      return;
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        bookingReference: this.bookingReference,
        amount: this.submittedAmount,
        type: this.submittedBooking.bookingType,
        itemId: this.submittedBooking.itemId,
      },
    });
  }

  downloadBookingInvoice(): void {
    if (!this.submittedBookingId || this.isDownloadingInvoice) return;
    this.isDownloadingInvoice = true;
    this.invoiceService.getAll().subscribe({
      next: (invoices) => {
        const invoice = invoices.find(
          (record) => record.bookingId === this.submittedBookingId,
        );
        if (!invoice) {
          this.isDownloadingInvoice = false;
          this.showToast('The booking invoice is not available yet.', 'info');
          return;
        }
        this.invoiceService.downloadPdf(invoice.id).subscribe({
          next: (blob) => {
            this.saveInvoicePdf(blob, invoice.invoiceNumber);
            this.isDownloadingInvoice = false;
          },
          error: () => {
            this.isDownloadingInvoice = false;
            this.showToast(
              'The booking invoice could not be downloaded.',
              'danger',
            );
          },
        });
      },
      error: () => {
        this.isDownloadingInvoice = false;
        this.showToast('The booking invoice could not be loaded.', 'danger');
      },
    });
  }

  private saveInvoicePdf(blob: Blob, invoiceNumber: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /* SIDE ACTIONS */

  toggleWishlist(): void {
    this.savedToWishlist = !this.savedToWishlist;

    this.showToast(
      this.savedToWishlist ? 'Saved to wishlist' : 'Removed from wishlist',
      this.savedToWishlist ? 'success' : 'info',
    );
  }

  resetBooking(): void {
    this.booking = this.createEmptyForm();
    this.companions = [];
    this.booking.bookingType = this.bookingType;
    this.booking.itemId = this.itemId;

    this.selectedAddOns.clear();
    this.selectedAddOns = new Set<string>();

    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';

    this.isSubmitted = false;
    this.isSubmitting = false;
    this.bookingReference = '';
    this.submittedBooking = null;
    this.submittedBookingId = 0;
    this.isDownloadingInvoice = false;
    this.submittedAmount = 0;
    this.submittedItem = null;

    this.currentStep = 1;
    this.touched = {};
    this.savedToWishlist = false;
    this.animatedTotal = 0;
    this.animatedBasePrice = 0;

    document.body.style.overflow = '';

    this.loadSelectedItem();
    this.animateInitialTotals();
  }

  /* TEMPLATE HELPERS */

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    const parsed = this.parseDate(date);

    if (!parsed) {
      return '—';
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return `${this.displayCurrency} ${Number(amount || 0).toLocaleString('en-BD')}`;
  }

  get bookingTypeLabel(): string {
    return (
      this.bookingTypes.find((item) => item.value === this.bookingType)
        ?.label || 'Booking'
    );
  }

  get bookingTypeIcon(): string {
    return (
      this.bookingTypes.find((item) => item.value === this.bookingType)?.icon ||
      '✦'
    );
  }

  get weatherPreview(): {
    temp: string;
    condition: string;
    icon: string;
  } {
    const map: Record<
      string,
      { temp: string; condition: string; icon: string }
    > = {
      'Cox’s Bazar': {
        temp: '29°C',
        condition: 'Sunny',
        icon: '☀️',
      },
      Dhaka: {
        temp: '31°C',
        condition: 'Humid',
        icon: '⛅',
      },
      Sylhet: {
        temp: '27°C',
        condition: 'Cloudy',
        icon: '☁️',
      },
      Chattogram: {
        temp: '30°C',
        condition: 'Clear',
        icon: '☀️',
      },
      Bandarban: {
        temp: '24°C',
        condition: 'Cool',
        icon: '🌤️',
      },
      Rangamati: {
        temp: '26°C',
        condition: 'Mild',
        icon: '🌤️',
      },
      Khulna: {
        temp: '28°C',
        condition: 'Humid',
        icon: '⛅',
      },
    };

    const location = this.selectedItem?.location?.split(' · ')[0] || 'Dhaka';

    return (
      map[location] || {
        temp: '28°C',
        condition: 'Pleasant',
        icon: '☀️',
      }
    );
  }

  /* TOAST */

  private showToast(message: string, type: ToastType = 'info'): void {
    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
    }

    const normalizedType: ToastType = type === 'danger' ? 'error' : type;

    this.toastMessage = message;
    this.toastType = normalizedType;
    this.showToastMessage = true;

    this.toast = {
      show: true,
      message,
      type:
        normalizedType === 'error'
          ? 'danger'
          : normalizedType === 'warning'
            ? 'info'
            : normalizedType,
    };

    this.toastTimeout = setTimeout(() => {
      this.showToastMessage = false;

      this.toast = {
        ...this.toast,
        show: false,
      };

      this.toastTimeout = null;
    }, 3200);
  }

  /* NAVIGATION */

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }

  goBack(): void {
    window.history.back();
  }

  private isIsoDate(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }
}
