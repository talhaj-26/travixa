import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DestinationService } from '../../../core/services/destination.service';

interface Destination {
  id: number;
  name: string;
  country: string;
  region: string;
  category: string;
  categoryLabel: string;
  description: string;
  image: string;
  gallery: string[];
  featured: boolean;
  badge?: string;
}

interface HeroSlide {
  name: string;
  region: string;
  tagline: string;
  image: string;
}

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './destinations.component.html',
  styleUrls: ['./destinations.component.scss'],
})
export class DestinationsComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly destinationService = inject(DestinationService);

  loadingDestinations = false;
  destinationLoadError = '';

  // ─── Filters ───
  searchTerm = '';
  selectedCategory = 'ALL';
  sortBy: 'featured' | 'name' = 'featured';

  // ─── Slideshow ───
  currentSlide = signal(0);
  private slideInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_MS = 6000;

  // ═══════════════════════════════════════════════
  // HERO SLIDES
  // ═══════════════════════════════════════════════
  heroSlides: HeroSlide[] = [];

  // ═══════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════
  categories = [
    { value: 'ALL', label: 'All Places', icon: '✦' },
    { value: 'BEACH', label: 'Beaches', icon: '◉' },
    { value: 'MOUNTAIN', label: 'Mountains', icon: '▲' },
    { value: 'NATURE', label: 'Nature', icon: '❋' },
    { value: 'CULTURAL', label: 'Cultural', icon: '❖' },
    { value: 'ADVENTURE', label: 'Adventure', icon: '◇' },
    { value: 'WILDLIFE', label: 'Wildlife', icon: '◆' },
    { value: 'HERITAGE', label: 'Heritage', icon: '★' },
  ];

  // ═══════════════════════════════════════════════
  // DESTINATIONS
  // ═══════════════════════════════════════════════
  destinations: Destination[] = [];

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  ngOnInit(): void {
    this.loadDestinations();
    this.startSlideshow();
  }

  loadDestinations(): void {
    this.loadingDestinations = true;
    this.destinationLoadError = '';


    this.destinationService.getPublishedFromApi().subscribe({
      next: (response) => {
        this.destinations = response.map((item) => {
          const category = item.category || 'NATURE';

          const categoryLabels: Record<string, string> = {
            BEACH: 'Beach Paradise',
            MOUNTAIN: 'Mountain Escape',
            CITY: 'City Experience',
            CULTURAL: 'Cultural Heritage',
            ADVENTURE: 'Adventure',
            NATURE: 'Nature Escape',
            WILDLIFE: 'Wildlife',
            HERITAGE: 'Heritage',
          };

          return {
            id: item.id,
            name: item.name,
            country: item.countryCode === 'BD'
              ? 'Bangladesh'
              : item.countryCode,
            region: item.region || '',
            category,
            categoryLabel: categoryLabels[category] || category,
            description: item.description || '',
            image: item.imageUrl || '',
            gallery: item.imageUrl ? [item.imageUrl] : [],
            featured: item.featured,
            badge: item.featured ? 'FEATURED' : undefined,
          };
        });
        this.heroSlides = response.map((item) => ({
          name: item.name,
          region: [item.region, item.countryCode].filter(Boolean).join(' · '),
          tagline: item.description || 'Explore stays and experiences in this destination.',
          image: item.imageUrl || '',
        }));
        this.currentSlide.set(0);
        this.startSlideshow();
      },
      error: (error) => {
        console.error('Failed to load destinations:', error);

        this.destinationLoadError =
          'Unable to load destinations. Please try again.';

        this.loadingDestinations = false;
      },
      complete: () => {
        this.loadingDestinations = false;
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

  get currentHero(): HeroSlide | null { return this.heroSlides[this.currentSlide()] ?? null; }

  // ═══════════════════════════════════════════════
  // FILTERS & SORTING
  // ═══════════════════════════════════════════════
  get filteredDestinations(): Destination[] {
    const term = this.searchTerm.trim().toLowerCase();

    let result = this.destinations.filter((destination) => {
      const matchesCategory =
        this.selectedCategory === 'ALL' ||
        destination.category === this.selectedCategory;

      const matchesSearch =
        !term ||
        destination.name.toLowerCase().includes(term) ||
        destination.country.toLowerCase().includes(term) ||
        destination.region.toLowerCase().includes(term) ||
        destination.categoryLabel.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });

    // Sort
    if (this.sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Featured destinations first; tie-break alphabetically.
      result = [...result].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }

  get featuredDestinations(): Destination[] {
    return this.filteredDestinations.filter((d) => d.featured);
  }

  get countryCount(): number { return new Set(this.destinations.map((item) => item.country).filter(Boolean)).size; }

  hideBrokenImage(event: Event): void { (event.currentTarget as HTMLImageElement | null)?.classList.add('image-broken'); }

  get categoryCounts(): Record<string, number> {
    const counts: Record<string, number> = { ALL: this.destinations.length };
    this.categories.forEach((cat) => {
      if (cat.value !== 'ALL') {
        counts[cat.value] = this.destinations.filter(
          (d) => d.category === cat.value,
        ).length;
      }
    });
    return counts;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'ALL';
    this.sortBy = 'featured';
  }

  // ═══════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════
  exploreDestination(destination: Destination): void {
    void this.router.navigate(['/destination-details'], {
      queryParams: { id: destination.id },
    });
  }

  viewHotels(destination: Destination): void {
    this.router.navigate(['/stays'], {
      queryParams: { destinationId: destination.id },
    });
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }

  goBack(): void {
    this.router.navigate(['/discover']);
  }
}
