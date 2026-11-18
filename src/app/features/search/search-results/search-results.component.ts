import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';
import { forkJoin } from 'rxjs';
import { HotelService } from '../../../core/services/hotel.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { TourPackageService } from '../../../core/services/tour-package.service';
import { TourGuideService } from '../../../core/services/tour-guide.service';

type ResultType = 'HOTEL' | 'TOUR' | 'RESTAURANT' | 'GUIDE';

interface SearchResult {
  id: number;
  type: ResultType;
  typeLabel: string;
  typeIcon: string;
  name: string;
  location: string;
  area: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  priceLabel: string;
  priceUnit: string;
  tags: string[];
  actionLabel: string;
  actionRoute: string;
}

interface CategoryFilter {
  value: ResultType;
  label: string;
  icon: string;
  active: boolean;
  count: number;
}

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly hotelService = inject(HotelService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly tourPackageService = inject(TourPackageService);
  private readonly tourGuideService = inject(TourGuideService);

  /* ═══════════════ SEARCH STATE ═══════════════ */
  searchTerm = '';
  sortBy: 'recommended' | 'rating' | 'price-low' | 'price-high' | 'reviews' =
    'recommended';
  loading = true;
  currentPage = 0;
  readonly pageSize = 6;
  loadError = '';

  /* ═══════════════ FILTERS ═══════════════ */
  categoryFilters: CategoryFilter[] = [
    { value: 'HOTEL', label: 'Hotels', icon: '🏨', active: true, count: 0 },
    {
      value: 'TOUR',
      label: 'Tour Packages',
      icon: '🎒',
      active: true,
      count: 0,
    },
    {
      value: 'RESTAURANT',
      label: 'Restaurants',
      icon: '🍽️',
      active: false,
      count: 0,
    },
    {
      value: 'GUIDE',
      label: 'Tour Guides',
      icon: '🧭',
      active: false,
      count: 0,
    },
  ];

  ratingFilters = [
    { value: 5, label: '★★★★★', active: false },
    { value: 4, label: '★★★★☆ & up', active: false },
    { value: 3, label: '★★★☆☆ & up', active: false },
  ];

  priceFilters = [
    { key: 'low', label: 'Under ৳5,000', active: false, min: 0, max: 5000 },
    {
      key: 'mid',
      label: '৳5,000 – ৳15,000',
      active: false,
      min: 5000,
      max: 15000,
    },
    {
      key: 'high',
      label: '৳15,000+',
      active: false,
      min: 15000,
      max: Infinity,
    },
  ];

  experienceFilters = [
    { value: 'Beach', active: false },
    { value: 'Family', active: false },
    { value: 'Luxury', active: false },
  ];

  wishlist = new Set<number>();

  sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'reviews', label: 'Most Reviewed' },
    { value: 'price-low', label: 'Price: Low → High' },
    { value: 'price-high', label: 'Price: High → Low' },
  ];

  /* ═══════════════ RESULTS DATA ═══════════════ */
  results: SearchResult[] = [];

  /* ═══════════════ LIFECYCLE ═══════════════ */
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.searchTerm = params['q'] || '';
    });
    this.loadResults();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private updateCounts(): void {
    this.categoryFilters.forEach((f) => {
      f.count = this.results.filter((r) => r.type === f.value).length;
    });
  }

  private loadResults(): void {
    this.loadError = '';
    forkJoin({
      hotels: this.hotelService.getPublishedFromApi(),
      packages: this.tourPackageService.getPublished(),
      restaurants: this.restaurantService.getPublished(),
      guides: this.tourGuideService.getPublicOfferings(),
    }).subscribe({
      next: ({ hotels, packages, restaurants, guides }) => {
        this.results = [
          ...hotels.map((item) => ({ id: item.id, type: 'HOTEL' as const, typeLabel: 'Hotel', typeIcon: '🏨', name: item.name, location: item.destinationName, area: item.address, description: item.description || '', image: '', rating: 0, reviews: 0, price: 0, priceLabel: 'Rates', priceUnit: 'View room rates', tags: [], actionLabel: 'View stay', actionRoute: '/hotel-details' })),
          ...packages.map((item) => ({ id: item.id, type: 'TOUR' as const, typeLabel: 'Tour package', typeIcon: '🎒', name: item.name, location: item.destinationName, area: `${item.durationDays} day${item.durationDays === 1 ? '' : 's'}`, description: item.description || '', image: '', rating: 0, reviews: 0, price: item.basePrice, priceLabel: 'From', priceUnit: `${item.currency} / person`, tags: [], actionLabel: 'Explore tour', actionRoute: '/tour-package-details' })),
          ...restaurants.map((item) => ({ id: item.id, type: 'RESTAURANT' as const, typeLabel: 'Restaurant', typeIcon: '🍽️', name: item.name, location: item.address, area: item.cuisineType || 'Dining', description: item.description || '', image: '', rating: 0, reviews: 0, price: 0, priceLabel: 'Menu', priceUnit: 'View menu', tags: [], actionLabel: 'View dining', actionRoute: '/restaurant-details' })),
          ...guides.map((item) => ({ id: item.id, type: 'GUIDE' as const, typeLabel: 'Tour guide', typeIcon: '🧭', name: item.name, location: item.organizationName || 'Local guide', area: item.languageCodes || 'Guide service', description: item.description || '', image: '', rating: 0, reviews: 0, price: item.pricePerHour, priceLabel: 'Guide fee', priceUnit: `${item.currency} / hour`, tags: [], actionLabel: 'View guide', actionRoute: '/tour-guide-details' })),
        ];
        this.currentPage = 0;
        this.loading = false;
        this.updateCounts();
      },
      error: () => {
        this.results = [];
        this.loadError = 'Could not load listings from the API. Please try again later.';
        this.loading = false;
        this.updateCounts();
      },
    });
  }

  /* ═══════════════ COMPUTED RESULTS ═══════════════ */
  get filteredResults(): SearchResult[] {
    const term = this.searchTerm.trim().toLowerCase();
    const activeCategories = this.categoryFilters
      .filter((f) => f.active)
      .map((f) => f.value);

    const activeRating = this.ratingFilters.find((r) => r.active)?.value ?? 0;
    const activePrice = this.priceFilters.filter((p) => p.active);
    const activeExperiences = this.experienceFilters
      .filter((e) => e.active)
      .map((e) => e.value.toLowerCase());

    const filtered = this.results.filter((r) => {
      const matchesSearch =
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.tags.some((t) => t.toLowerCase().includes(term));

      const matchesCategory =
        activeCategories.length === 0 || activeCategories.includes(r.type);

      const matchesRating = r.rating >= activeRating;

      const matchesPrice = activePrice.length === 0 ||
        (r.price > 0 && activePrice.some((p) => r.price >= p.min && r.price < p.max));

      const matchesExperience =
        activeExperiences.length === 0 ||
        activeExperiences.some((exp) =>
          r.tags.some((t) => t.toLowerCase().includes(exp)),
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesRating &&
        matchesPrice &&
        matchesExperience
      );
    });

    switch (this.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        filtered.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
    }

    return filtered;
  }

  get pageCount(): number { return Math.max(1, Math.ceil(this.filteredResults.length / this.pageSize)); }
  get pagedResults(): SearchResult[] {
    this.currentPage = Math.min(this.currentPage, this.pageCount - 1);
    return this.filteredResults.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize);
  }
  previousPage(): void { this.currentPage = Math.max(0, this.currentPage - 1); }
  nextPage(): void { this.currentPage = Math.min(this.pageCount - 1, this.currentPage + 1); }

  get activeFilterCount(): number {
    let count = 0;
    count += this.categoryFilters.filter((f) => f.active).length;
    count += this.ratingFilters.filter((r) => r.active).length;
    count += this.priceFilters.filter((p) => p.active).length;
    count += this.experienceFilters.filter((e) => e.active).length;
    return count;
  }

  /* ═══════════════ ACTIONS ═══════════════ */
  toggleCategory(f: CategoryFilter): void {
    f.active = !f.active;
    this.currentPage = 0;
  }

  toggleRating(r: { value: number; active: boolean }): void {
    const wasActive = r.active;
    this.ratingFilters.forEach((x) => (x.active = false));
    r.active = !wasActive;
    this.currentPage = 0;
  }

  togglePrice(p: { active: boolean }): void {
    p.active = !p.active;
    this.currentPage = 0;
  }

  toggleExperience(e: { value: string; active: boolean }): void {
    e.active = !e.active;
    this.currentPage = 0;
  }

  clearFilters(): void {
    this.categoryFilters.forEach((f) => (f.active = true));
    this.ratingFilters.forEach((r) => (r.active = false));
    this.priceFilters.forEach((p) => (p.active = false));
    this.experienceFilters.forEach((e) => (e.active = false));
    this.searchTerm = '';
    this.sortBy = 'recommended';
    this.currentPage = 0;
    this.toast.info('Filters reset', 'Showing all results');
  }

  submitSearch(): void {
    const q = this.searchTerm.trim();
    if (!q) return;
    this.router.navigate(['/search-results'], { queryParams: { q } });
  }

  quickSearch(term: string): void {
    this.searchTerm = term;
    this.submitSearch();
  }

  toggleWishlist(result: SearchResult, event?: Event): void {
    event?.stopPropagation();
    if (this.wishlist.has(result.id)) {
      this.wishlist.delete(result.id);
      this.toast.info('Removed from wishlist', result.name);
    } else {
      this.wishlist.add(result.id);
      this.toast.success('Saved to wishlist', result.name);
    }
    this.wishlist = new Set(this.wishlist);
  }

  isWishlisted(id: number): boolean {
    return this.wishlist.has(id);
  }

  openResult(result: SearchResult): void {
    this.router.navigate([result.actionRoute], {
      queryParams: { id: result.id },
    });
  }

  formatPrice(value: number): string {
    return `৳${value.toLocaleString('en-BD')}`;
  }

  getTypeAccent(type: ResultType): string {
    return {
      HOTEL: 'blue',
      TOUR: 'green',
      RESTAURANT: 'orange',
      GUIDE: 'purple',
    }[type];
  }

  /* ═══════════════ NAVIGATION ═══════════════ */
  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
  goToDestinations(): void {
    this.router.navigate(['/destinations']);
  }
  goToTours(): void {
    this.router.navigate(['/tour-packages']);
  }
  goToStays(): void {
    this.router.navigate(['/stays']);
  }
  goToRestaurants(): void {
    this.router.navigate(['/restaurants']);
  }
  goToGuides(): void {
    this.router.navigate(['/tour-guides']);
  }
  goToCompare(): void {
    this.router.navigate(['/compare-services']);
  }
  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }
  goToHome(): void {
    this.router.navigate(['/']);
  }
}
