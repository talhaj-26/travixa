import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService } from '../../../core/services/media.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import {
  MenuCategoryApiResponse,
  RestaurantCatalogService,
  TableAvailabilityApiResponse,
  BuffetScheduleApiResponse,
} from '../../../core/services/restaurant-catalog.service';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
type MenuCategory = number;

interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  icon: string;
  category: MenuCategory[];
  tag?: string;
  popular?: boolean;
  spicy?: boolean;
  vegetarian?: boolean;
  dietaryInformation: string | null;
  allergenInformation: string | null;
}

interface GalleryImage {
  image: string;
  label: string;
}

interface Review {
  name: string;
  initials: string;
  avatar: string;
  location: string;
  date: string;
  rating: number;
  text: string;
}

interface ReviewBar {
  stars: number;
  percent: number;
}

interface Amenity {
  icon: string;
  label: string;
}

interface TableSeat {
  id: string;
  tableId: number;
  tableNumber: string;
  startsAt: string;
  endsAt: string;
  seats: number;
  booked: boolean;
  premium?: boolean;
}

interface NearbyPlace {
  name: string;
  distance: string;
  icon: string;
}

interface SimilarRestaurant {
  id: number;
  name: string;
  location: string;
  image: string;
  rating: number;
  cuisine: string;
  priceRange: string;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
@Component({
  selector: 'app-restaurant-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restaurant-details.component.html',
  styleUrl: './restaurant-details.component.scss',
})
export class RestaurantDetailsComponent implements OnInit, OnDestroy {
  /* ─── Restaurant basic info ─── */
  restaurant = {
    id: 0,
    name: '',
    tagline: '',
    description: '',
    cuisine: '',
    avgSpend: 0,
    openingHours: '',
    cancellationPolicy: '',
    location: '',
    area: '',
    rating: 0,
    reviewsCount: 0,
    phone: '',
    priceRange: '',
    heroImage: '',
  };

  /* ─── Hero slideshow (subtle 3-image rotate) ─── */
  heroSlides: string[] = [];
currentHeroSlide = 0;
  private heroInterval: ReturnType<typeof setInterval> | null = null;

  /* ─── Gallery ─── */
  gallery: GalleryImage[] = [];
  buffetSchedules: BuffetScheduleApiResponse[] = [];
/* ─── Menu ─── */
  activeMenuCategory: MenuCategory = 0;
  menuCategories: { value: MenuCategory; label: string; icon: string }[] = [];

  menuItems: MenuItem[] = [];
get filteredMenu(): MenuItem[] {
    return this.activeMenuCategory === 0
      ? this.menuItems
      : this.menuItems.filter((item) => item.categoryId === this.activeMenuCategory);
  }

  /* ─── Amenities ─── */
  amenities: Amenity[] = [];
/* ─── Reviews ─── */
  reviewBars: ReviewBar[] = [];
  reviews: Review[] = [];

  currentReview = 0;

  /* ─── Tables ─── */
  tables: TableSeat[] = [];
selectedTableId: string | null = null;

  /* ─── Reservation form ─── */
  reservation = {
    date: '',
    time: '07:30 PM',
    guests: 2,
    specialRequest: '',
  };

  guestOptions = [1, 2, 3, 4, 5, 6, 8];

  /* ─── Location ─── */
  nearby: NearbyPlace[] = [];
/* ─── Cross-sell ─── */
  similarRestaurants: SimilarRestaurant[] = [];
/* ─── UI State ─── */
  savedToWishlist = false;
  animatedRating = 0;
  animatedReviews = 0;
  animatedAvailability = 0;

  /* ─── Toast ─── */
  toast: { show: boolean; message: string; type: 'success' | 'info' | 'danger' } = {
    show: false,
    message: '',
    type: 'info',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private restaurantCatalogService: RestaurantCatalogService,
    private mediaApi: MediaService,
  ) {}

  /* ═══════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
  ngOnInit(): void {
    this.setDefaultDate();
    this.route.queryParams.subscribe((params) => {
      const id = Number(params['id']);
      if (Number.isInteger(id) && id > 0) {
        this.loadRestaurant(id);
      }
    });

  }

  get minReservationDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  get mapsUrl(): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.restaurant.location)}`;
  }

  private loadRestaurant(id: number): void {
    this.restaurantService.getPublishedById(id).subscribe({
      next: (restaurant) => {
        this.restaurant.id = restaurant.id;
        this.restaurant.name = restaurant.name;
        this.restaurant.tagline = restaurant.cuisineType || 'Dining experience';
        this.restaurant.description = restaurant.description || 'Restaurant information available.';
        this.restaurant.cuisine = restaurant.cuisineType || 'Restaurant';
        this.restaurant.location = restaurant.address;
        this.restaurant.area = restaurant.address;
        this.restaurant.phone = restaurant.contactPhone || 'Contact restaurant';
        this.restaurant.openingHours = restaurant.openingHours || 'Contact restaurant for current hours';
        this.restaurant.cancellationPolicy = restaurant.cancellationPolicy || '';
        this.loadCategories(id);
        this.restaurantService.getPublishedBuffetSchedules(id).subscribe({
          next: (items) => this.buffetSchedules = items ?? [],
          error: () => this.buffetSchedules = [],
        });
        this.loadMenuItems(id);
        this.loadTableAvailability(id, this.reservation.date);
        this.loadImages(id);
      },
      error: () => this.showToast('This restaurant was not found or is not published.', 'danger'),
    });
  }

  private loadCategories(restaurantId: number): void {
    this.restaurantService.getPublishedCategories(restaurantId).subscribe({
      next: (categories: MenuCategoryApiResponse[]) => {
        this.menuCategories = [
          { value: 0, label: 'All menu', icon: '☷' },
          ...categories.map((category) => ({ value: category.id, label: category.name, icon: '◈' })),
        ];
        this.activeMenuCategory = 0;
      },
      error: () => { this.menuCategories = []; },
    });
  }

  private loadMenuItems(restaurantId: number): void {
    this.restaurantService.getPublishedMenuItems(restaurantId).subscribe({
      next: (items) => {
        this.menuItems = items.map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          currency: item.currency,
          image: this.mediaApi.resolveMediaUrl(item.imageUrl),
          icon: item.vegetarian ? '🥗' : '🍽',
          category: [item.categoryId],
          vegetarian: item.vegetarian,
          dietaryInformation: item.dietaryInformation,
          allergenInformation: item.allergenInformation,
        }));
        this.activeMenuCategory = 0;
      },
      error: () => { this.menuItems = []; },
    });
  }

  private loadTableAvailability(restaurantId: number, date: string): void {
    this.selectedTableId = null;
    if (!date) { this.tables = []; return; }
    this.restaurantService.getPublishedTableAvailability(restaurantId, date).subscribe({
      next: (items: TableAvailabilityApiResponse[]) => {
        this.tables = items.map((slot) => ({
          id: String(slot.id),
          tableId: slot.tableId,
          tableNumber: slot.tableNumber,
          startsAt: slot.startsAt.slice(0, 5),
          endsAt: slot.endsAt.slice(0, 5),
          seats: slot.availableSeats,
          booked: slot.availableSeats <= 0,
        }));
      },
      error: () => { this.tables = []; },
    });
  }

  get availableSlots(): TableSeat[] {
    return this.tables.filter((slot) => !slot.booked && slot.seats >= this.reservation.guests);
  }

  private loadImages(restaurantId: number): void {
    this.restaurantService.getPublishedImages(restaurantId).subscribe({
      next: (images) => {
        if (images.length === 0) return;
        this.heroSlides = images.map((image) => this.mediaApi.resolveMediaUrl(image.publicUrl));
        this.gallery = images.map((image) => ({
          image: this.mediaApi.resolveMediaUrl(image.publicUrl),
          label: image.altText || 'Restaurant photo',
        }));
        const cover = images.find((image) => image.coverImage) ?? images[0];
        this.restaurant.heroImage = this.mediaApi.resolveMediaUrl(cover.publicUrl);
      },
    });
  }

  ngOnDestroy(): void {
    this.stopHeroSlideshow();
    document.body.style.overflow = '';
  }

  private setDefaultDate(): void {
    const today = new Date();
    this.reservation.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private startHeroSlideshow(): void {
    this.stopHeroSlideshow();
    if (this.heroSlides.length < 2) return;
    this.heroInterval = setInterval(() => {
      this.currentHeroSlide = (this.currentHeroSlide + 1) % this.heroSlides.length;
    }, 6000);
  }

  private stopHeroSlideshow(): void {
    if (this.heroInterval !== null) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     MENU
     ═══════════════════════════════════════════════════════════ */
  setMenuCategory(cat: MenuCategory): void {
    this.activeMenuCategory = cat;
  }

  getMenuCategoryLabel(cat: MenuCategory): string {
    return this.menuCategories.find((c) => c.value === cat)?.label || 'Menu';
  }

  /* ═══════════════════════════════════════════════════════════
     TABLES
     ═══════════════════════════════════════════════════════════ */
  selectTable(table: TableSeat): void {
    if (table.booked) return;
    this.selectedTableId = table.id;
    this.reservation.time = table.startsAt;
    this.showToast(`Table ${table.tableNumber} selected for ${table.startsAt}.`, 'success');
  }

  get selectedTable(): TableSeat | null {
    if (!this.selectedTableId) return null;
    return this.tables.find((t) => t.id === this.selectedTableId) || null;
  }

  /* ═══════════════════════════════════════════════════════════
     RESERVATION
     ═══════════════════════════════════════════════════════════ */
  incrementGuests(): void {
    const idx = this.guestOptions.indexOf(this.reservation.guests);
    if (idx >= 0 && idx < this.guestOptions.length - 1) {
      this.reservation.guests = this.guestOptions[idx + 1];
    }
  }

  decrementGuests(): void {
    const idx = this.guestOptions.indexOf(this.reservation.guests);
    if (idx > 0) {
      this.reservation.guests = this.guestOptions[idx - 1];
    }
  }

  get reservationValid(): boolean {
    return !!this.reservation.date && !!this.selectedTableId && this.reservation.guests > 0;
  }

  onReservationDateChange(): void {
    this.reservation.time = '';
    if (this.restaurant.id > 0) this.loadTableAvailability(this.restaurant.id, this.reservation.date);
  }

  reserveTable(): void {
    if (!this.reservationValid) {
      this.showToast('Please fill in all required fields', 'danger');
      return;
    }

    const startsAt = this.toReservationInstant(
      this.reservation.date,
      this.reservation.time,
    );
    if (!startsAt) {
      this.showToast('Please choose a valid reservation time.', 'danger');
      return;
    }

    this.restaurantCatalogService.createReservation({
      restaurantId: this.restaurant.id,
      tableId: this.selectedTable ? this.selectedTable.tableId : null,
      startsAt,
      guestCount: this.reservation.guests,
      specialRequests: this.reservation.specialRequest.trim() || null,
    }).subscribe({
      next: () => this.showToast('Table reservation submitted successfully.', 'success'),
      error: (error) => this.showToast(
        error?.error?.detail || error?.error?.message || 'Reservation could not be submitted.',
        'danger',
      ),
    });
  }

  private toReservationInstant(date: string, time: string): string | null {
    const match = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(time);
    if (!match) {
      const clock = /^(\d{2}):(\d{2})$/.exec(time);
      if (!clock || Number(clock[1]) > 23 || Number(clock[2]) > 59) return null;
      return `${date}T${time}:00+06:00`;
    }
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (match[3] === 'PM' && hours !== 12) hours += 12;
    if (match[3] === 'AM' && hours === 12) hours = 0;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+06:00`;
  }

  /* ═══════════════════════════════════════════════════════════
     REVIEWS
     ═══════════════════════════════════════════════════════════ */
  nextReview(): void {
    this.currentReview = (this.currentReview + 1) % this.reviews.length;
  }

  prevReview(): void {
    this.currentReview = (this.currentReview - 1 + this.reviews.length) % this.reviews.length;
  }

  goToReview(i: number): void {
    this.currentReview = i;
  }

  get activeReview(): Review {
    return this.reviews[this.currentReview];
  }

  /* ═══════════════════════════════════════════════════════════
     SIDE ACTIONS
     ═══════════════════════════════════════════════════════════ */
  toggleWishlist(): void {
    this.showToast('Wishlist is unavailable for this restaurant.', 'info');
  }

  shareRestaurant(): void {
    void navigator.clipboard?.writeText(window.location.href).then(
      () => this.showToast('Restaurant link copied.', 'success'),
      () => this.showToast('Copy this page URL to share the restaurant.', 'info'),
    );
  }

  orderDish(item: MenuItem): void {
    this.showToast(`${item.name} is on the menu. Reserve a table to dine in.`, 'info');
  }

  viewSimilar(r: SimilarRestaurant): void {
    this.router.navigate(['/restaurant-details'], {
      queryParams: { id: r.id },
    });
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════ */
  goToRestaurants(): void {
    this.router.navigate(['/restaurants']);
  }
  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
  goToMyBookings(): void {
    this.router.navigate(['/my-bookings']);
  }
  goToHome(): void {
    this.router.navigate(['/']);
  }
  goToMaps(): void {
    this.router.navigate(['/maps'], { queryParams: { q: this.restaurant.location } });
  }
  goToReviews(): void {
    this.router.navigate(['/review-rating']);
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */
  formatCurrency(amount: number, currency = 'BDT'): string {
    try { return new Intl.NumberFormat('en-BD', { style: 'currency', currency }).format(amount); }
    catch { return `${amount.toFixed(2)} ${currency}`; }
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private showToast(message: string, type: 'success' | 'info' | 'danger'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
    }, 3200);
  }
}
