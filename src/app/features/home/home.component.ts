import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { DestinationApiResponse, DestinationService } from '../../core/services/destination.service';
import { MediaService } from '../../core/services/media.service';
import { TourPackageApiResponse, TourPackageService } from '../../core/services/tour-package.service';

interface HeroSlide {
  location: string;
  shortName: string;
  country: string;
  category: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  image: string | null;
  link: string;
}

interface FeaturedDestination {
  name: string;
  region: string;
  tagline: string;
  image: string | null;
  badge: string;
  link: string;
}

interface FeaturedExperience {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  duration: string;
  price: number;
  currency: TourPackageApiResponse['currency'];
  image: string | null;
  badge: string;
  size: 'large' | 'medium' | 'small';
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  private slideInterval: number | null = null;

  loadingCatalog = true;
  catalogError = '';
  private readonly destinationsApi = inject(DestinationService);
  private readonly tourPackagesApi = inject(TourPackageService);
  private readonly mediaApi = inject(MediaService);

  private readonly wishlistStorageKey = 'travixa-home-wishlist';
  wishlistIds = new Set<number>();

  featuredExperiences: FeaturedExperience[] = [];

  heroSlides: HeroSlide[] = [];

  featuredDestinations: FeaturedDestination[] = [];

  get filteredExperiences(): FeaturedExperience[] {
    return this.featuredExperiences;
  }

  get activeHero(): HeroSlide {
    return this.heroSlides[this.currentSlide] ?? {
      location: 'Discover the world', shortName: 'TRAVIXA', country: '', category: 'Explore',
      eyebrow: 'YOUR NEXT JOURNEY STARTS HERE', title: 'Find your next', titleAccent: 'place to explore.',
      description: 'Published destinations and tour packages will appear here when they are available.',
      image: null, link: '/destinations',
    };
  }

  ngOnInit(): void {
    this.loadWishlist();
    this.loadHomeCatalog();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  toggleWishlist(experienceId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.wishlistIds.has(experienceId)) {
      this.wishlistIds.delete(experienceId);
    } else {
      this.wishlistIds.add(experienceId);
    }

    this.saveWishlist();
  }

  isWishlisted(experienceId: number): boolean {
    return this.wishlistIds.has(experienceId);
  }

  formatPrice(amount: number, currency: TourPackageApiResponse['currency']): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private loadHomeCatalog(): void {
    this.loadingCatalog = true;
    this.catalogError = '';
    forkJoin({
      destinations: this.destinationsApi.getPublishedFromApi(),
      packages: this.tourPackagesApi.getPublished(),
    }).pipe(
      switchMap(({ destinations, packages }) => {
        this.setDestinations(destinations);
        return (packages.length ? forkJoin(packages.map((item) => this.tourPackagesApi.images(item.id).pipe(catchError(() => of([]))))) : of([]))
          .pipe(map((galleries) => ({ packages, galleries })));
      }),
    ).subscribe({
      next: ({ packages, galleries }) => {
        this.featuredExperiences = packages.slice(0, 6).map((item, index) => {
          const images = galleries[index] ?? [];
          const cover = images.find((image) => image.coverImage) ?? images[0];
          return {
            id: item.id,
            title: item.name,
            subtitle: item.description || item.inclusions || `${item.durationDays} day tour in ${item.destinationName}`,
            location: item.destinationName,
            duration: `${item.durationDays} day${item.durationDays === 1 ? '' : 's'}`,
            price: Number(item.basePrice),
            currency: item.currency,
            image: cover ? this.mediaApi.resolveMediaUrl(cover.publicUrl) : null,
            badge: 'PUBLISHED',
            size: index === 0 ? 'large' : index < 3 ? 'medium' : 'small',
            link: `/tour-package-details?id=${item.id}`,
          };
        });
        this.loadingCatalog = false;
        this.startAutoPlay();
      },
      error: () => {
        this.catalogError = 'Travel listings could not be loaded from the service.';
        this.loadingCatalog = false;
      },
    });
  }

  private setDestinations(destinations: DestinationApiResponse[]): void {
    this.featuredDestinations = destinations.slice(0, 5).map((item) => ({
      name: item.name,
      region: [item.region, item.countryCode].filter(Boolean).join(', '),
      tagline: item.description || item.category || item.countryCode,
      image: item.imageUrl ? this.mediaApi.resolveMediaUrl(item.imageUrl) : null,
      badge: item.featured ? 'FEATURED' : item.countryCode,
      link: '/destinations',
    }));
    this.heroSlides = destinations.slice(0, 5).map((item) => ({
      location: item.name,
      shortName: item.name,
      country: item.countryCode,
      category: item.category || 'Destination',
      eyebrow: item.region || item.countryCode,
      title: item.name,
      titleAccent: item.countryCode,
      description: item.description || `${item.name} is a published TRAVIXA destination.`,
      image: item.imageUrl ? this.mediaApi.resolveMediaUrl(item.imageUrl) : null,
      link: '/destinations',
    }));
    this.currentSlide = 0;
  }

  private loadWishlist(): void {
    try {
      const savedWishlist = localStorage.getItem(this.wishlistStorageKey);
      if (!savedWishlist) return;

      const ids = JSON.parse(savedWishlist);
      if (Array.isArray(ids)) {
        this.wishlistIds = new Set(
          ids.filter((id): id is number => typeof id === 'number'),
        );
      }
    } catch {
      this.wishlistIds = new Set<number>();
    }
  }

  private saveWishlist(): void {
    localStorage.setItem(
      this.wishlistStorageKey,
      JSON.stringify([...this.wishlistIds]),
    );
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.heroSlides.length < 2) return;
    this.slideInterval = window.setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  stopAutoPlay(): void {
    if (this.slideInterval !== null) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  nextSlide(): void {
    if (this.heroSlides.length < 2) return;
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
    this.restartAutoPlay();
  }

  previousSlide(): void {
    if (this.heroSlides.length < 2) return;
    this.currentSlide =
      (this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length;
    this.restartAutoPlay();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.restartAutoPlay();
  }

  private restartAutoPlay(): void {
    this.startAutoPlay();
  }

  padNumber(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
  }
}
