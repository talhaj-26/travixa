import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MediaService } from '../../../core/services/media.service';
import { RestaurantCatalogService, RestaurantImageApiResponse, MenuItemApiResponse } from '../../../core/services/restaurant-catalog.service';
import { RestaurantApiResponse, RestaurantService } from '../../../core/services/restaurant.service';

interface Restaurant {
  id: number;
  name: string;
  location: string;
  description: string;
  image: string;
  cuisine: string[];
  openingHours: string | null;
}

interface HeroSlide {
  image: string;
  kicker: string;
  title: string;
  highlight: string;
  text: string;
}

interface DishCard {
  id: number;
  restaurantId: number;
  restaurant: string;
  name: string;
  cuisine: string;
  image: string;
  price: number;
  currency: string;
}

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restaurants.component.html',
  styleUrl: './restaurants.component.scss',
})
export class RestaurantsComponent implements OnInit, OnDestroy {
  private readonly restaurantsApi = inject(RestaurantService);
  private readonly catalogApi = inject(RestaurantCatalogService);
  private readonly mediaApi = inject(MediaService);
  private readonly router = inject(Router);

  readonly pageSize = 6;
  restaurants: Restaurant[] = [];
  popularDishes: DishCard[] = [];
  heroSlides: HeroSlide[] = [{
    image: '', kicker: 'DINING GUIDE', title: 'Find a table', highlight: 'worth sharing.',
    text: 'Explore published restaurants, real menus and table reservations for your next trip.',
  }];
  currentSlide = 0;
  currentPage = 0;
  viewMode: ViewMode = 'grid';
  loading = true;
  loadError = '';
  searchTerm = '';
  selectedLocation = 'ALL';
  selectedCuisine = 'ALL';
  sortBy: 'name' | 'location' = 'name';
  private slideInterval: ReturnType<typeof setInterval> | null = null;

  get locations(): string[] {
    return ['ALL', ...new Set(this.restaurants.map((item) => item.location).filter(Boolean))];
  }

  get cuisines(): string[] {
    return ['ALL', ...new Set(this.restaurants.flatMap((item) => item.cuisine).filter(Boolean))];
  }

  get filteredRestaurants(): Restaurant[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.restaurants.filter((restaurant) => {
      const matchSearch = !term || [restaurant.name, restaurant.location, restaurant.description, ...restaurant.cuisine]
        .some((value) => value.toLowerCase().includes(term));
      const matchLocation = this.selectedLocation === 'ALL' || restaurant.location === this.selectedLocation;
      const matchCuisine = this.selectedCuisine === 'ALL' || restaurant.cuisine.includes(this.selectedCuisine);
      return matchSearch && matchLocation && matchCuisine;
    }).sort((a, b) => this.sortBy === 'location'
      ? a.location.localeCompare(b.location) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name));
  }

  get pagedRestaurants(): Restaurant[] {
    return this.filteredRestaurants.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize);
  }

  get pageCount(): number {
    return Math.ceil(this.filteredRestaurants.length / this.pageSize);
  }

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentSlide] ?? this.heroSlides[0];
  }

  ngOnInit(): void {
    this.loadRestaurants();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  loadRestaurants(): void {
    this.loading = true;
    this.loadError = '';
    this.restaurantsApi.getPublished().subscribe({
      next: (items) => {
        if (!items?.length) {
          this.restaurants = [];
          this.popularDishes = [];
          this.heroSlides = [{ image: '', kicker: 'DINING GUIDE', title: 'Find a table', highlight: 'worth sharing.', text: 'Explore published restaurants, real menus and table reservations for your next trip.' }];
          this.currentSlide = 0;
          this.loading = false;
          return;
        }
        forkJoin(items.map((item) => forkJoin({
          images: this.restaurantsApi.getPublishedImages(item.id).pipe(catchError(() => of([] as RestaurantImageApiResponse[]))),
          dishes: this.restaurantsApi.getPublishedMenuItems(item.id).pipe(catchError(() => of([] as MenuItemApiResponse[]))),
        }).pipe(map(({ images, dishes }) => ({ item, images, dishes }))))).subscribe({
          next: (loaded) => {
            this.restaurants = loaded.map(({ item, images }) => {
              const cover = images.find((image) => image.coverImage) ?? images[0];
              return {
                id: item.id,
                name: item.name,
                location: item.address,
                description: item.description || '',
                image: this.mediaApi.resolveMediaUrl(cover?.publicUrl),
                cuisine: item.cuisineType?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
                openingHours: item.openingHours,
              };
            });
            this.popularDishes = loaded.flatMap(({ item, dishes }) => dishes.slice(0, 3).map((dish) => ({
              id: dish.id,
              restaurantId: item.id,
              restaurant: item.name,
              name: dish.name,
              cuisine: item.cuisineType || 'Menu',
              image: this.mediaApi.resolveMediaUrl(dish.imageUrl),
              price: dish.price,
              currency: dish.currency,
            }))).slice(0, 8);
            const slides = loaded.map(({ item, images }) => ({
              item, image: this.mediaApi.resolveMediaUrl((images.find((photo) => photo.coverImage) ?? images[0])?.publicUrl),
            })).filter((entry) => entry.image).slice(0, 5);
            this.heroSlides = slides.length ? slides.map(({ item, image }) => ({
              image, kicker: item.cuisineType || 'LOCAL DINING', title: 'Taste', highlight: item.name + '.',
              text: item.description || `${item.name} · ${item.address}`,
            })) : [{ image: '', kicker: 'DINING GUIDE', title: 'Find a table', highlight: 'worth sharing.', text: 'Explore published restaurants, real menus and table reservations for your next trip.' }];
            this.currentPage = 0;
            this.currentSlide = 0;
            this.startSlideshow();
            this.loading = false;
          },
          error: () => { this.loadError = 'Restaurant information could not be loaded.'; this.loading = false; },
        });
      },
      error: () => {
        this.restaurants = [];
        this.loadError = 'Published restaurants could not be reached. Check the backend connection and retry.';
        this.loading = false;
      },
    });
  }

  onFiltersChanged(): void { this.currentPage = 0; }
  setView(mode: ViewMode): void { this.viewMode = mode; }
  clearFilters(): void { this.searchTerm = ''; this.selectedLocation = 'ALL'; this.selectedCuisine = 'ALL'; this.sortBy = 'name'; this.currentPage = 0; }
  goToPage(page: number): void { if (page >= 0 && page < this.pageCount) this.currentPage = page; }
  goToSlide(index: number): void { if (index < 0 || index >= this.heroSlides.length) return; this.currentSlide = index; this.startSlideshow(); }
  nextSlide(): void { this.goToSlide((this.currentSlide + 1) % this.heroSlides.length); }
  prevSlide(): void { this.goToSlide((this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length); }
  openRestaurant(restaurantId: number): void { this.router.navigate(['/restaurant-details'], { queryParams: { id: restaurantId } }); }
  onImageError(restaurant: Restaurant): void { restaurant.image = ''; }
  onDishImageError(dish: DishCard): void { dish.image = ''; }
  scrollToListings(): void { document.getElementById('restaurant-listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  formatPrice(amount: number, currency: string): string {
    try { return new Intl.NumberFormat('en-BD', { style: 'currency', currency }).format(amount); }
    catch { return `${amount.toFixed(2)} ${currency}`; }
  }

  private startSlideshow(): void {
    this.stopSlideshow();
    if (this.heroSlides.length < 2) return;
    this.slideInterval = setInterval(() => { this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length; }, 6500);
  }

  private stopSlideshow(): void {
    if (this.slideInterval !== null) { clearInterval(this.slideInterval); this.slideInterval = null; }
  }
}
