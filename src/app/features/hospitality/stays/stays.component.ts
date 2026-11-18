import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { HotelAmenityApiResponse, HotelImageApiResponse, HotelRoomTypeApiResponse, HotelService } from '../../../core/services/hotel.service';
import { DestinationApiResponse, DestinationService } from '../../../core/services/destination.service';
import { MediaService } from '../../../core/services/media.service';

interface Hotel {
  id: number;
  destinationId: number;
  name: string;
  type: 'HOTEL';
  typeLabel: string;
  location: string;
  region: string;
  description: string;
  image: string;
  currency: string | null;
  pricePerNight: number | null;
  amenities: string[];
  starRating: number;
  badge?: string;
}

interface HeroSlide {
  name: string;
  location: string;
  tagline: string;
  image: string;
}

@Component({
  selector: 'app-stays',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stays.component.html',
  styleUrls: ['./stays.component.scss'],
})
export class StaysComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hotelService = inject(HotelService);
  private readonly destinationService = inject(DestinationService);
  private readonly mediaService = inject(MediaService);
  destinations: DestinationApiResponse[] = [];
  selectedDestinationId: number | null = null;

  loadingHotels = true;
  hotelLoadError = '';
  loadingDestinations = true;
  destinationLoadError = '';

  // ─── Filters ───
  searchTerm = '';
  selectedLocation = 'ALL';
  selectedType = 'ALL';
  selectedRating = 'ALL';
  selectedPrice = 'ALL';
  sortBy: 'recommended' | 'price-low' | 'price-high' | 'rating' | 'stars' =
    'recommended';
  viewMode = signal<'grid' | 'list'>('grid');

  // ─── Slideshow ───
  currentSlide = signal(0);
  private slideInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_MS = 6000;

  // ═══════════════════════════════════════════════
  // HERO SLIDES
  // ═══════════════════════════════════════════════
  heroSlides: HeroSlide[] = [];

  // ═══════════════════════════════════════════════
  // FILTER OPTIONS
  // ═══════════════════════════════════════════════
  get locations(): { value: string; label: string }[] {
    return [
      { value: 'ALL', label: 'All destinations' },
      ...Array.from(new Set(this.hotels.map((hotel) => hotel.location).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((location) => ({ value: location, label: location })),
    ];
  }

  types = [
    { value: 'ALL', label: 'All stays', icon: '✦' },
    { value: 'HOTEL', label: 'Hotels', icon: '⌂' },
  ];

  ratingOptions = [
    { value: 'ALL', label: 'Any Rating' },
    { value: '5', label: '5 stars' },
    { value: '4', label: '4+ stars' },
    { value: '3', label: '3+ stars' },
  ];

  priceOptions = [
    { value: 'ALL', label: 'Any Price' },
    { value: 'UNDER-5000', label: 'Under BDT 5,000' },
    { value: '5000-10000', label: 'BDT 5,000 – 10,000' },
    { value: '10000-20000', label: 'BDT 10,000 – 20,000' },
    { value: '20000+', label: 'BDT 20,000+' },
  ];

  sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Star rating' },
    { value: 'stars', label: 'Star Rating' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  // ═══════════════════════════════════════════════
  // Published listings are hydrated with their API gallery and current rates.
  // ═══════════════════════════════════════════════
  hotels: Hotel[] = [];
  currentPage = 0;
  readonly pageSize = 6;

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const id = Number(params.get('destinationId'));
      if (Number.isInteger(id) && id > 0 && this.destinations.some((destination) => destination.id === id)) {
        this.selectDestination(id);
      }
    });
    this.loadDestinations();
    this.loadHotels();
  }

  loadDestinations(): void {
    this.loadingDestinations = true;
    this.destinationLoadError = '';
    this.destinationService.getPublishedFromApi().subscribe({
      next: (destinations) => {
        this.destinations = destinations.map((destination) => ({
          ...destination,
          imageUrl: destination.imageUrl ? this.mediaService.resolveMediaUrl(destination.imageUrl) : null,
        }));
        const destinationId = Number(this.route.snapshot.queryParamMap.get('destinationId'));
        if (Number.isInteger(destinationId) && destinationId > 0
          && this.destinations.some((destination) => destination.id === destinationId)) {
          this.selectDestination(destinationId);
        }
        this.loadingDestinations = false;
      },
      error: () => {
        this.destinationLoadError = 'Unable to load published destinations. Please try again.';
        this.loadingDestinations = false;
      },
    });
  }

  selectDestination(id: number): void {
    this.selectedDestinationId = id;
    this.currentPage = 0;
    this.selectedLocation = 'ALL';
  }

  changeDestination(): void {
    this.selectedDestinationId = null;
    this.selectedLocation = 'ALL';
  }

  loadHotels(): void {
    this.loadingHotels = true;
    this.hotelLoadError = '';

    this.hotelService.getPublishedFromApi().subscribe({
      next: (response) => {
        if (!response.length) { this.hotels = []; this.loadingHotels = false; return; }
        const hotelRequests = response.map((hotel) => forkJoin({
          images: this.hotelService.getPublishedImages(hotel.id).pipe(catchError(() => of([] as HotelImageApiResponse[]))),
          roomTypes: this.hotelService.getPublishedRoomTypes(hotel.id).pipe(catchError(() => of([] as HotelRoomTypeApiResponse[]))),
          amenities: this.hotelService.getPublishedAmenities(hotel.id).pipe(catchError(() => of([] as HotelAmenityApiResponse[]))),
        }).pipe(map(({ images, roomTypes, amenities }) => {
          const cover = images.find((image) => image.coverImage) ?? images[0];
          const rates = roomTypes.filter((room) => room.nightlyRate !== null && room.currency !== null)
            .sort((a, b) => (a.nightlyRate ?? Number.MAX_VALUE) - (b.nightlyRate ?? Number.MAX_VALUE));
          const rate = rates[0];
          return {
            id: hotel.id,
            destinationId: hotel.destinationId,
            name: hotel.name,
            type: 'HOTEL' as const,
            typeLabel: hotel.starRating > 0 ? `${hotel.starRating}-star stay` : 'Hotel',
            location: hotel.destinationName,
            region: hotel.address,
            description: hotel.description || '',
            image: this.hotelService.resolveMediaUrl(cover?.publicUrl),
            currency: rate?.currency ?? null,
            pricePerNight: rate?.nightlyRate ?? null,
            amenities: amenities.map((amenity) => amenity.name),
            starRating: Math.max(0, Math.min(5, hotel.starRating)),
            badge: hotel.starRating > 0 ? `${hotel.starRating} stars` : undefined,
          };
        })));
        forkJoin(hotelRequests).subscribe({
          next: (hotels) => {
            this.hotels = hotels;
            this.heroSlides = hotels.slice(0, 5).map((hotel) => ({
              name: hotel.name, location: hotel.location, tagline: hotel.description, image: hotel.image,
            }));
            this.currentSlide.set(0);
            this.startSlideshow();
            this.currentPage = 0;
            this.loadingHotels = false;
          },
          error: () => { this.hotelLoadError = 'Unable to load hotel details.'; this.loadingHotels = false; },
        });
      },
      error: (error) => {
        console.error('Failed to load hotels:', error);
        this.hotelLoadError = 'Unable to load hotels. Please try again.';
        this.loadingHotels = false;
      },
      complete: () => {
        this.loadingHotels = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  private startSlideshow(): void {
    this.stopSlideshow();
    if (this.heroSlides.length < 2) return;
    this.slideInterval = setInterval(() => {
      this.currentSlide.update((i) => (i + 1) % this.heroSlides.length);
    }, this.SLIDE_MS);
  }

  private stopSlideshow(): void {
    if (this.slideInterval !== null) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.startSlideshow();
  }

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentSlide()] ?? {
      name: 'Find a stay worth remembering',
      location: 'TRAVIXA STAYS',
      tagline: 'Browse published hotels and check room rates for your travel dates.',
      image: '',
    };
  }

  // ═══════════════════════════════════════════════
  // FILTERING
  // ═══════════════════════════════════════════════
  get filteredHotels(): Hotel[] {
    const term = this.searchTerm.trim().toLowerCase();

    let result = this.hotels.filter((hotel) => {
      if (this.selectedDestinationId === null || hotel.destinationId !== this.selectedDestinationId) return false;
      const matchesSearch =
        !term ||
        hotel.name.toLowerCase().includes(term) ||
        hotel.location.toLowerCase().includes(term) ||
        hotel.region.toLowerCase().includes(term) ||
        hotel.description.toLowerCase().includes(term) ||
        hotel.amenities.some((a) => a.toLowerCase().includes(term));

      const matchesLocation =
        this.selectedLocation === 'ALL' ||
        hotel.location === this.selectedLocation;

      const matchesType =
        this.selectedType === 'ALL' || hotel.type === this.selectedType;

      const matchesRating = this.selectedRating === 'ALL' || hotel.starRating >= Number(this.selectedRating);

      const matchesPrice =
        this.selectedPrice === 'ALL' ||
        (hotel.currency === 'BDT' && hotel.pricePerNight !== null && this.selectedPrice === 'UNDER-5000' && hotel.pricePerNight < 5000) ||
        (this.selectedPrice === '5000-10000' &&
          hotel.currency === 'BDT' && hotel.pricePerNight !== null && hotel.pricePerNight >= 5000 && hotel.pricePerNight <= 10000) ||
        (this.selectedPrice === '10000-20000' &&
          hotel.currency === 'BDT' && hotel.pricePerNight !== null && hotel.pricePerNight >= 10000 && hotel.pricePerNight <= 20000) ||
        (this.selectedPrice === '20000+' && hotel.currency === 'BDT' && hotel.pricePerNight !== null && hotel.pricePerNight > 20000);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesType &&
        matchesRating &&
        matchesPrice
      );
    });

    // Sort
    switch (this.sortBy) {
      case 'rating':
        result = [...result].sort((a, b) => b.starRating - a.starRating);
        break;
      case 'stars':
        result = [...result].sort((a, b) => b.starRating - a.starRating);
        break;
      case 'price-low':
        result = [...result].sort((a, b) => (a.pricePerNight ?? Number.MAX_VALUE) - (b.pricePerNight ?? Number.MAX_VALUE));
        break;
      case 'price-high':
        result = [...result].sort((a, b) => (b.pricePerNight ?? -1) - (a.pricePerNight ?? -1));
        break;
      default:
        result = [...result].sort((a, b) => {
          if (a.starRating !== b.starRating) return b.starRating - a.starRating;
          return a.name.localeCompare(b.name);
        });
    }

    return result;
  }

  get pagedHotels(): Hotel[] {
    this.currentPage = Math.min(this.currentPage, this.pageCount - 1);
    return this.filteredHotels.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredHotels.length / this.pageSize));
  }

  get destinationCount(): number {
    return new Set(this.hotels.map((hotel) => hotel.location).filter(Boolean)).size;
  }

  get hotelsWithCurrentRates(): number {
    return this.hotels.filter((hotel) => hotel.pricePerNight !== null && !!hotel.currency).length;
  }

  previousPage(): void { this.currentPage = Math.max(0, this.currentPage - 1); }
  nextPage(): void { this.currentPage = Math.min(this.pageCount - 1, this.currentPage + 1); }

  formatRate(hotel: Hotel): string {
    if (hotel.pricePerNight === null || !hotel.currency) return 'Rate unavailable';
    return `${hotel.currency} ${hotel.pricePerNight.toLocaleString('en-BD')}`;
  }

  onHotelImageError(hotel: Hotel): void {
    hotel.image = '';
    this.heroSlides = this.heroSlides.map((slide) => slide.name === hotel.name ? { ...slide, image: '' } : slide);
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedLocation !== 'ALL') count++;
    if (this.selectedType !== 'ALL') count++;
    if (this.selectedRating !== 'ALL') count++;
    if (this.selectedPrice !== 'ALL') count++;
    return count;
  }

  // ═══════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════
  selectLocation(location: string): void {
    this.selectedLocation = location;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLocation = 'ALL';
    this.selectedType = 'ALL';
    this.selectedRating = 'ALL';
    this.selectedPrice = 'ALL';
    this.currentPage = 0;
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  getStars(count: number): number[] {
    return Array(count).fill(0);
  }

  getAmenityIcon(amenity: string): string {
    const icons: Record<string, string> = {
      WiFi: '◉',
      Pool: '◈',
      Breakfast: '☕',
      'Beach Access': '☀',
      Spa: '❋',
      Restaurant: '◆',
      Parking: '◭',
      Gym: '▲',
      'Mountain View': '△',
      'Lake View': '◐',
      Garden: '❀',
      'Room Service': '❖',
    };
    return icons[amenity] || '•';
  }

  bookHotel(hotel: Hotel): void {
    this.viewHotel(hotel);
  }

  viewHotel(hotel: Hotel): void {
    this.router.navigate(['/hotel-details'], {
      queryParams: { id: hotel.id },
    });
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
}
