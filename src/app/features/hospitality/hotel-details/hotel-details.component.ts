import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import {
  HotelService,
  HotelAmenityApiResponse,
  HotelApiResponse,
  HotelRoomTypeApiResponse,
  HotelRoomAvailabilityResponse,
} from '../../../core/services/hotel.service';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface GallerySlide {
  image: string;
  caption: string;
  tag: string;
}

interface RoomType {
  id: string;
  name: string;
  category: string;
  price: number | null;
  guests: string;
  bed: string;
  size: string;
  images: string[];
  features: string[];
  popular?: boolean;
}

interface ReviewCategory {
  label: string;
  score: number;
}

interface GuestReview {
  name: string;
  initials: string;
  avatar: string;
  location: string;
  date: string;
  rating: number;
  title: string;
  text: string;
}

interface NearbyPlace {
  name: string;
  icon: string;
  distance: string;
}

interface CrossSellItem {
  type: 'RESTAURANT' | 'TOUR' | 'TOUR_GUIDE';
  routeId: number;
  title: string;
  image: string;
  rating: number;
  location: string;
  priceLabel: string;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
@Component({
  selector: 'app-hotel-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-details.component.html',
  styleUrl: './hotel-details.component.scss',
})
export class HotelDetailsComponent implements OnInit, OnDestroy {
  booking = {
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    roomId: '',
  };

  guestOptions = [1, 2, 3, 4, 5, 6];
  roomCountOptions = [1, 2, 3, 4, 5, 6];

  availabilityLoading = false;
  availabilityError = '';
  availabilityResult: HotelRoomAvailabilityResponse | null = null;

  private availabilityRequestId = 0;
  roomAvailabilityById: Record<string, HotelRoomAvailabilityResponse | null> = {};

  /* ─── Hero Slideshow ─── */
  currentSlide = 0;
  slideInterval: ReturnType<typeof setInterval> | null = null;
  slideshowPaused = false;
  hasHotelData = false;
  hasRoomData = false;
  hotelLoadError = '';

  gallery: GallerySlide[] = [];

  /* ─── Hotel Basics ─── */
  hotel = {
    name: '',
    tagline: '',
    location: '',
    rating: 0,
    reviewsCount: 0,
    collectionLabel: 'Hotel',
    description: '',
    checkInTime: null as string | null,
    checkOutTime: null as string | null,
    cancellationPolicy: null as string | null,
    childPolicy: null as string | null,
    additionalCharges: null as string | null,
    amenities: [] as Array<{ icon: string; label: string }>,
  };

  /* ─── Rooms: loaded from backend ─── */
  rooms: RoomType[] = [];
  activeRoomImage: Record<string, number> = {};
  currentHotelId: number | null = null;
  roomLoadError = '';

  get hasBookableRoom(): boolean {
    return this.roomAvailabilityById[this.selectedRoom.id]?.available === true;
  }

  private loadRoomTypes(hotelId: number): void {
    this.rooms = [];
    this.roomAvailabilityById = {};
    this.activeRoomImage = {};
    this.hasRoomData = false;
    this.roomLoadError = '';

    this.hotelService.getPublishedRoomTypes(hotelId).subscribe({
      next: (data: HotelRoomTypeApiResponse[]) => {
        this.rooms = data.map((room) => ({
          id: String(room.id),
          name: room.name,
          category: room.category,
          price: room.nightlyRate,
          guests: `${room.maxOccupancy} Guests`,
          bed: this.formatBedType(room.bedType),
          size:
            room.sizeSquareMeters != null
              ? `${room.sizeSquareMeters} m²`
              : 'Size not specified',
          images: (room.images ?? []).map((image) => this.hotelService.resolveMediaUrl(image.publicUrl)),
          features: [
            ...(room.amenities ?? []),
            room.airConditioned === null ? '' : room.airConditioned ? 'Air-conditioned' : 'Non-AC',
          ].filter(Boolean),
        }));

        this.activeRoomImage = Object.fromEntries(
          this.rooms.map((room) => [room.id, 0]),
        );

        this.hasRoomData = this.rooms.length > 0;

        this.booking.roomId =
          this.rooms.find((room) => room.price !== null)?.id ??
          this.rooms[0]?.id ??
          '';
        this.checkRoomAvailability();
      },
      error: () => {
        this.rooms = [];
        this.hasRoomData = false;
        this.roomLoadError = 'Unable to load room types at this time.';
      },
    });
  }

  private formatBedType(bedType: string): string {
    const labels: Record<string, string> = {
      SINGLE: '1 Single Bed',
      TWIN: '2 Twin Beds',
      DOUBLE: '1 Double Bed',
      QUEEN: '1 Queen Bed',
      KING: '1 King Bed',
      BUNK: 'Bunk Bed',
      SOFA_BED: 'Sofa Bed',
      OTHER: 'Bed details unavailable',
    };

    return labels[bedType] ?? bedType.replace(/_/g, ' ');
  }

  currentReview = 0;
  guestReviews: GuestReview[] = [];
  reviewCategories: ReviewCategory[] = [];

  /* ─── Location ─── */
  nearby: NearbyPlace[] = [];

  /* ─── Cross-sell (Sector 01 integration) ─── */
  crossSell: CrossSellItem[] = [];

  /* ─── UI State ─── */
  loading = true;

  /* ─── Toast ─── */
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'danger';
  } = {
      show: false,
      message: '',
      type: 'info',
    };

  /* ─── Lightbox ─── */
  lightbox = { open: false, index: 0 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hotelService: HotelService,
  ) { }

  /* ═══════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════ */

  ngOnInit(): void {
    this.setDefaultDates();
    this.startSlideshow();

    this.route.queryParams.subscribe((params) => {
      const id = Number(params['id']);

      if (!Number.isInteger(id) || id <= 0) {
        this.hotelLoadError = 'A valid hotel ID was not provided.';
        this.loading = false;
        return;
      }

      this.loading = true;
      this.hotelLoadError = '';
      this.hasHotelData = false;
      this.hasRoomData = false;
      this.rooms = [];
      this.currentHotelId = id;

      this.hotelService.getPublishedById(id).subscribe({
        next: (data: HotelApiResponse) => {
          this.applyHotelData(data);
          this.hasHotelData = true;
          this.loading = false;
          this.loadHotelGallery(data.id);
          this.loadHotelAmenities(data.id);
          this.loadRoomTypes(data.id);
        },
        error: (error) => {
          this.loading = false;
          this.hasHotelData = false;
          this.rooms = [];
          this.hasRoomData = false;

          this.hotelLoadError =
            error.status === 404
              ? 'This hotel was not found or is not published.'
              : 'Unable to load hotel details. Please try again.';
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (this.lightbox.open) {
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowRight') this.lightboxNext();
      if (e.key === 'ArrowLeft') this.lightboxPrev();
    }
  }

  private applyHotelData(data: HotelApiResponse): void {
    this.hotel.name = data.name;
    this.hotel.location = data.address;
    this.hotel.description = data.description || 'No description available.';
    this.hotel.rating = data.starRating;
    this.hotel.checkInTime = data.checkInTime;
    this.hotel.checkOutTime = data.checkOutTime;
    this.hotel.cancellationPolicy = data.cancellationPolicy;
    this.hotel.childPolicy = data.childPolicy;
    this.hotel.additionalCharges = data.additionalCharges;
    this.hotel.reviewsCount = 0;
    this.hotel.tagline = data.destinationName;
    this.hotel.collectionLabel = 'TRAVIXA Hotel';

    this.hotel.amenities = [];
    this.hasRoomData = false;
  }

  private loadHotelAmenities(hotelId: number): void {
    this.hotelService.getPublishedAmenities(hotelId).subscribe({
      next: (amenities: HotelAmenityApiResponse[]) => {
        this.hotel.amenities = amenities.map((amenity) => ({
          icon: this.amenityIcon(amenity.name),
          label: `${amenity.included ? '' : 'Additional charge · '}${amenity.name}${amenity.description ? ` — ${amenity.description}` : ''}`,
        }));
      },
      error: () => { this.hotel.amenities = []; },
    });
  }

  private amenityIcon(name: string): string {
    const value = name.toLowerCase();
    if (value.includes('wifi') || value.includes('internet')) return '◉';
    if (value.includes('pool')) return '◈';
    if (value.includes('spa')) return '❋';
    if (value.includes('breakfast') || value.includes('restaurant')) return '☕';
    if (value.includes('parking')) return '◭';
    if (value.includes('gym') || value.includes('fitness')) return '▲';
    if (value.includes('airport') || value.includes('transfer')) return '✈';
    return '•';
  }

  private loadHotelGallery(hotelId: number): void {
    this.hotelService.getPublishedImages(hotelId).subscribe({
      next: (images) => {
        this.gallery = (images ?? []).map((image) => ({
          image: this.hotelService.resolveMediaUrl(image.publicUrl),
          caption: image.altText || this.hotel.name,
          tag: image.coverImage ? 'Cover' : 'Gallery',
        }));
        this.currentSlide = 0;
        this.startSlideshow();
      },
      error: () => { this.gallery = []; this.stopSlideshow(); },
    });
  }

  private setDefaultDates(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 4);

    this.booking.checkIn = this.toISODate(today);
    this.booking.checkOut = this.toISODate(dayAfter);
  }

  private toISODate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  /* ═══════════════════════════════════════════════════════════
     HERO SLIDESHOW
     ═══════════════════════════════════════════════════════════ */
  private startSlideshow(): void {
    this.stopSlideshow();
    if (this.gallery.length < 2) return;
    this.slideInterval = setInterval(() => {
      if (!this.slideshowPaused && !this.lightbox.open) {
        this.currentSlide = (this.currentSlide + 1) % this.gallery.length;
      }
    }, 5500);
  }

  private stopSlideshow(): void {
    if (this.slideInterval !== null) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  goToSlide(i: number): void {
    this.currentSlide = i;
    this.startSlideshow();
  }

  nextSlide(): void {
    if (this.gallery.length < 2) return;
    this.goToSlide((this.currentSlide + 1) % this.gallery.length);
  }

  prevSlide(): void {
    if (this.gallery.length < 2) return;
    this.goToSlide(
      (this.currentSlide - 1 + this.gallery.length) % this.gallery.length,
    );
  }

  get currentSlideData(): GallerySlide {
    return this.gallery[this.currentSlide] ?? {
      image: '',
      caption: this.hotel.name,
      tag: 'Photos coming soon',
    };
  }

  get currentSlideTag(): string {
    const slide = this.gallery[this.currentSlide];
    return slide ? slide.tag : 'Photos coming soon';
  }

  get currentSlideCaption(): string {
    const slide = this.gallery[this.currentSlide];
    return slide ? slide.caption : this.hotel.name;
  }

  pauseSlideshow(): void {
    this.slideshowPaused = true;
  }

  resumeSlideshow(): void {
    this.slideshowPaused = false;
  }

  /* ═══════════════════════════════════════════════════════════
     LIGHTBOX
     ═══════════════════════════════════════════════════════════ */
  openLightbox(index: number): void {
    this.lightbox = { open: true, index };
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightbox = { open: false, index: 0 };
    document.body.style.overflow = '';
  }

  lightboxNext(): void {
    if (this.gallery.length < 2) return;
    this.lightbox.index = (this.lightbox.index + 1) % this.gallery.length;
  }

  lightboxPrev(): void {
    if (this.gallery.length < 2) return;
    this.lightbox.index =
      (this.lightbox.index - 1 + this.gallery.length) % this.gallery.length;
  }

  /* ═══════════════════════════════════════════════════════════
     ROOMS
     ═══════════════════════════════════════════════════════════ */

  changeRoomImage(roomId: string, dir: 1 | -1): void {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room || room.images.length === 0) return;

    const current = this.activeRoomImage[roomId] || 0;
    const next = (current + dir + room.images.length) % room.images.length;

    this.activeRoomImage = {
      ...this.activeRoomImage,
      [roomId]: next,
    };
  }

  getRoomImage(room: RoomType): string {
    return room.images[this.activeRoomImage[room.id] || 0] ?? '';
  }

  handleRoomImageError(roomId: string, imageIndex: number): void {
    const room = this.rooms.find((item) => item.id === roomId);
    if (!room || imageIndex < 0 || imageIndex >= room.images.length) return;

    room.images = room.images.filter((_image, index) => index !== imageIndex);
    if (room.images.length === 0) {
      delete this.activeRoomImage[roomId];
      return;
    }

    const activeIndex = this.activeRoomImage[roomId] || 0;
    this.activeRoomImage[roomId] = imageIndex < activeIndex
      ? activeIndex - 1
      : Math.min(activeIndex, room.images.length - 1);
  }

  selectRoom(room: RoomType): void {

    if (this.roomAvailabilityById[room.id]?.available !== true) {
      this.showToast('Check your dates to confirm this room is available.', 'info');
      return;
    }
    this.booking.roomId = room.id;
    this.showToast(`${room.name} selected`, 'success');
    this.scrollToBooking();
  }

  private scrollToBooking(): void {
    setTimeout(() => {
      const el = document.querySelector('.booking-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  }

  get selectedRoom(): RoomType {
    return (
      this.rooms.find((room) => room.id === this.booking.roomId) ??
      this.rooms[0] ?? {
        id: '',
        name: '',
        price: null,
        guests: '',
        bed: '',
        size: '',
        images: [],
        features: [],
      }
    );
  }

  /* ═══════════════════════════════════════════════════════════
     BOOKING
     ═══════════════════════════════════════════════════════════ */
  get minCheckInDate(): string {
    return this.toISODate(new Date());
  }

  get minCheckOutDate(): string {
    if (!this.booking.checkIn) {
      return this.minCheckInDate;
    }

    const date = new Date(`${this.booking.checkIn}T00:00:00`);
    date.setDate(date.getDate() + 1);

    return this.toISODate(date);
  }

  checkRoomAvailability(): void {
    const requestId = ++this.availabilityRequestId;

    this.availabilityResult = null;
    this.roomAvailabilityById = {};
    this.availabilityError = '';

    if (
      this.currentHotelId === null ||
      !this.booking.roomId ||
      !this.booking.checkIn ||
      !this.booking.checkOut ||
      this.booking.checkOut <= this.booking.checkIn ||
      this.booking.rooms < 1 ||
      this.rooms.length === 0
    ) {
      this.availabilityLoading = false;
      return;
    }

    this.availabilityLoading = true;
    forkJoin(this.rooms.map((room) => this.hotelService.getRoomTypeAvailability(
      this.currentHotelId!,
      Number(room.id),
      this.booking.checkIn,
      this.booking.checkOut,
      this.booking.rooms,
    ).pipe(catchError(() => of(null)))))
      .subscribe((results) => {
        if (requestId !== this.availabilityRequestId) return;
        this.roomAvailabilityById = Object.fromEntries(
          this.rooms.map((room, index) => [room.id, results[index]]),
        );
        this.availabilityResult = this.roomAvailabilityById[this.booking.roomId] ?? null;
        this.availabilityLoading = false;

        if (!this.availabilityResult) {
          this.availabilityError = 'Availability could not be checked for this room. Please try again.';
        } else if (!this.availabilityResult.available) {
          this.availabilityError = this.availabilityResult.message || 'No rooms are available for these dates.';
        }

      });
  }

  get nightsCount(): number {
    if (!this.booking.checkIn || !this.booking.checkOut) return 1;
    const inD = new Date(this.booking.checkIn);
    const outD = new Date(this.booking.checkOut);
    const diff = Math.ceil((outD.getTime() - inD.getTime()) / 86400000);
    return Math.max(1, diff);
  }

  get subtotal(): number {
    return this.availabilityResult?.totalRoomCost ?? 0;
  }

  get serviceFee(): number {
    return 0;
  }

  get taxes(): number {
    return 0;
  }

  get totalPrice(): number {
    return this.availabilityResult?.totalRoomCost ?? 0;
  }

  averageNightlyRate(
    availability: HotelRoomAvailabilityResponse | null | undefined,
  ): number | null {
    if (
      !availability?.available ||
      availability.nights < 1 ||
      availability.requestedRooms < 1
    ) {
      return null;
    }

    return availability.totalRoomCost / availability.nights / availability.requestedRooms;
  }

  get bookingValid(): boolean {
    if (!this.booking.checkIn || !this.booking.checkOut) {
      return false;
    }

    return (
      this.booking.checkOut > this.booking.checkIn &&
      this.booking.rooms >= 1
    );
  }

  reserveHotel(): void {
    if (!this.bookingValid) {
      this.showToast(
        'Please select valid check-in and check-out dates',
        'danger',
      );
      return;
    }

    if (
      this.currentHotelId === null ||
      !this.selectedRoom.id ||
      this.roomAvailabilityById[this.selectedRoom.id]?.available !== true
    ) {
      this.showToast(
        'A bookable room and confirmed rate are required.',
        'danger',
      );
      return;
    }
    if (this.availabilityLoading) {
      this.showToast('Checking room availability. Please wait.', 'info');
      return;
    }

    if (!this.availabilityResult?.available) {
      this.showToast(
        this.availabilityError || 'Please check room availability first.',
        'danger',
      );
      return;
    }
    this.router.navigate(['/booking'], {
      queryParams: {
        type: 'HOTEL',
        hotelId: this.currentHotelId,
        roomTypeId: this.selectedRoom.id,
        checkIn: this.booking.checkIn,
        checkOut: this.booking.checkOut,
        guests: this.booking.guests,
        room: this.selectedRoom.id,
        rooms: this.booking.rooms,
      },
    });
  }

  continueToBooking(): void {
    this.reserveHotel();
  }

  /* ═══════════════════════════════════════════════════════════
     REVIEWS CAROUSEL
     ═══════════════════════════════════════════════════════════ */
  nextReview(): void {
    this.currentReview = (this.currentReview + 1) % this.guestReviews.length;
  }

  prevReview(): void {
    this.currentReview =
      (this.currentReview - 1 + this.guestReviews.length) %
      this.guestReviews.length;
  }

  goToReview(i: number): void {
    this.currentReview = i;
  }

  get activeReview(): GuestReview {
    return this.guestReviews[this.currentReview];
  }

  /* ═══════════════════════════════════════════════════════════
     CROSS-SELL
     ═══════════════════════════════════════════════════════════ */
  goToCrossSell(item: CrossSellItem): void {
    switch (item.type) {
      case 'RESTAURANT':
        this.router.navigate(['/restaurant-details'], {
          queryParams: { id: item.routeId },
        });
        break;
      case 'TOUR_GUIDE':
        this.router.navigate(['/tour-guide-details'], {
          queryParams: { id: item.routeId },
        });
        break;
      case 'TOUR':
        this.router.navigate(['/tour-package-details'], {
          queryParams: { id: item.routeId },
        });
        break;
    }
  }

  getCrossSellIcon(type: CrossSellItem['type']): string {
    return {
      RESTAURANT: '🍽️',
      TOUR: '🧳',
      TOUR_GUIDE: '🧭',
    }[type];
  }

  getCrossSellLabel(type: CrossSellItem['type']): string {
    return {
      RESTAURANT: 'Restaurant',
      TOUR: 'Tour Package',
      TOUR_GUIDE: 'Tour Guide',
    }[type];
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════ */
  goToStays(): void {
    this.router.navigate(['/stays']);
  }

  goToDestinations(): void {
    this.router.navigate(['/destinations']);
  }

  goToExperiences(): void {
    this.router.navigate(['/tour-packages']);
  }

  goToMyTrips(): void {
    this.router.navigate(['/my-bookings']);
  }

  goToProfile(): void {
    this.router.navigate(['/user-profile']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToMaps(): void {
    this.router.navigate(['/maps']);
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */

  formatCurrency(amount: number | null, currency = 'BDT'): string {
    if (amount === null || !Number.isFinite(amount)) {
      return 'Contact for rates';
    }

    return `${currency} ${amount.toLocaleString('en-BD')}`;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private showToast(
    message: string,
    type: 'success' | 'info' | 'danger',
  ): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
    }, 3200);
  }
}
