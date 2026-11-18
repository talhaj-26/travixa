import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface HeroSlide {
  name: string;
  region: string;
  tagline: string;
  description: string;
  image: string;
  rating: string;
  category: string;
}

interface DestinationCard {
  id: number;
  name: string;
  country: string;
  category: string;
  categoryLabel: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  featured: boolean;
  badge?: string;
}

interface HotelCard {
  id: number;
  name: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  badge?: string;
}

interface RestaurantCard {
  id: number;
  name: string;
  location: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  icon: string;
}

interface PackageCard {
  id: number;
  title: string;
  destination: string;
  image: string;
  duration: number;
  price: number;
  rating: number;
}

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss'],
})
export class DiscoverComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  // ─── Search ───
  searchTerm = '';
  selectedCategory = 'ALL';

  // ─── Slideshow state ───
  currentSlide = signal(0);
  private slideInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_MS = 6000;

  // ═══════════════════════════════════════════════
  // HERO SLIDES — Bangladesh top destinations
  // ═══════════════════════════════════════════════
  heroSlides: HeroSlide[] = [
    {
      name: "Cox's Bazar",
      region: 'Chittagong Division',
      tagline: "The world's longest sea beach",
      description:
        '122 kilometres of golden sand along the Bay of Bengal — where every sunset feels like a story.',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=90',
      rating: '4.9',
      category: 'BEACH',
    },
    {
      name: 'Sylhet',
      region: 'Sylhet Division',
      tagline: 'Emerald hills of endless green',
      description:
        'Rolling tea gardens, misty mornings, and the warm hospitality of the Sylheti people.',
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=90',
      rating: '4.8',
      category: 'NATURE',
    },
    {
      name: 'Bandarban',
      region: 'Chittagong Hill Tracts',
      tagline: 'Above the clouds, beyond the map',
      description:
        'The highest peaks of Bangladesh — misty trails, indigenous culture, and sunrise at Nilgiri.',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=90',
      rating: '4.9',
      category: 'MOUNTAIN',
    },
    {
      name: 'Sundarbans',
      region: 'Khulna Division',
      tagline: 'The largest mangrove on Earth',
      description:
        'A UNESCO World Heritage site — cruise winding waterways and spot the Royal Bengal Tiger.',
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=90',
      rating: '4.7',
      category: 'WILDLIFE',
    },
    {
      name: 'Saint Martin',
      region: 'Bay of Bengal',
      tagline: 'The only coral island of Bangladesh',
      description:
        'Turquoise waters, coconut palms, and the kind of silence you only find far from the mainland.',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=90',
      rating: '4.8',
      category: 'BEACH',
    },
  ];

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
  ];

  // ═══════════════════════════════════════════════
  // DESTINATIONS — Real Bangladesh places
  // ═══════════════════════════════════════════════
  destinations: DestinationCard[] = [
    {
      id: 1,
      name: "Cox's Bazar",
      country: 'Bangladesh',
      category: 'BEACH',
      categoryLabel: 'Beach Paradise',
      description: "Discover the world's longest natural sea beach.",
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
      rating: 4.9,
      reviews: 1240,
      featured: true,
      badge: 'MOST POPULAR',
    },
    {
      id: 2,
      name: 'Sajek Valley',
      country: 'Bangladesh',
      category: 'MOUNTAIN',
      categoryLabel: 'Mountain Escape',
      description: 'Wake up above the clouds surrounded by green hills.',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85',
      rating: 4.7,
      reviews: 980,
      featured: true,
      badge: 'CLOUD KINGDOM',
    },
    {
      id: 3,
      name: 'Bandarban',
      country: 'Bangladesh',
      category: 'ADVENTURE',
      categoryLabel: 'Adventure',
      description: 'Dramatic mountains, waterfalls and unforgettable trails.',
      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=85',
      rating: 4.9,
      reviews: 870,
      featured: true,
      badge: 'HIDDEN GEM',
    },
    {
      id: 4,
      name: 'Sylhet',
      country: 'Bangladesh',
      category: 'NATURE',
      categoryLabel: 'Nature',
      description: 'Explore tea gardens, rivers and peaceful landscapes.',
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=85',
      rating: 4.6,
      reviews: 760,
      featured: false,
      badge: 'TEA CAPITAL',
    },
    {
      id: 5,
      name: 'Rangamati',
      country: 'Bangladesh',
      category: 'NATURE',
      categoryLabel: 'Lake Escape',
      description: 'A beautiful lakeside escape surrounded by green hills.',
      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=85',
      rating: 4.7,
      reviews: 650,
      featured: false,
      badge: 'LAKE CITY',
    },
    {
      id: 6,
      name: 'Sundarbans',
      country: 'Bangladesh',
      category: 'WILDLIFE',
      categoryLabel: 'Wildlife Safari',
      description:
        "The world's largest mangrove forest — home of the Royal Bengal Tiger.",
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
      rating: 4.7,
      reviews: 890,
      featured: true,
      badge: 'UNESCO SITE',
    },
    {
      id: 7,
      name: 'Saint Martin',
      country: 'Bangladesh',
      category: 'BEACH',
      categoryLabel: 'Coral Island',
      description:
        "Bangladesh's only coral island — turquoise waters and quiet shores.",
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=85',
      rating: 4.8,
      reviews: 720,
      featured: false,
      badge: 'TROPICAL',
    },
    {
      id: 8,
      name: 'Dhaka',
      country: 'Bangladesh',
      category: 'CULTURAL',
      categoryLabel: 'Cultural',
      description:
        'History, culture, food and modern city life in the capital.',
      image:
        'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=85',
      rating: 4.5,
      reviews: 1100,
      featured: false,
      badge: 'CAPITAL CITY',
    },
    {
      id: 9,
      name: 'Paharpur',
      country: 'Bangladesh',
      category: 'CULTURAL',
      categoryLabel: 'Heritage',
      description: 'Ancient Buddhist monastery — a UNESCO World Heritage site.',
      image:
        'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85',
      rating: 4.6,
      reviews: 540,
      featured: false,
      badge: 'HERITAGE',
    },
  ];

  // ═══════════════════════════════════════════════
  // HOTELS
  // ═══════════════════════════════════════════════
  hotels: HotelCard[] = [
    {
      id: 1,
      name: 'Sea Pearl Beach Resort',
      location: "Cox's Bazar",
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85',
      rating: 4.8,
      price: 8500,
      badge: 'TOP RATED',
    },
    {
      id: 2,
      name: 'Hotel The Cox Today',
      location: "Cox's Bazar",
      image:
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=85',
      rating: 4.6,
      price: 6200,
      badge: 'POPULAR',
    },
    {
      id: 3,
      name: 'Sajek Hill Resort',
      location: 'Sajek Valley',
      image:
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=85',
      rating: 4.7,
      price: 4800,
      badge: 'SCENIC STAY',
    },
  ];

  // ═══════════════════════════════════════════════
  // RESTAURANTS
  // ═══════════════════════════════════════════════
  restaurants: RestaurantCard[] = [
    {
      id: 1,
      name: 'Ocean View Restaurant',
      location: "Cox's Bazar",
      cuisine: 'Seafood & Local',
      rating: 4.8,
      priceRange: '$$',
      icon: '🦐',
    },
    {
      id: 2,
      name: 'Hill View Kitchen',
      location: 'Sajek Valley',
      cuisine: 'Local & Tribal',
      rating: 4.7,
      priceRange: '$$',
      icon: '🍛',
    },
    {
      id: 3,
      name: 'Tea Garden Bistro',
      location: 'Sylhet',
      cuisine: 'Bangladeshi & Café',
      rating: 4.6,
      priceRange: '$',
      icon: '🍵',
    },
  ];

  // ═══════════════════════════════════════════════
  // PACKAGES
  // ═══════════════════════════════════════════════
  packages: PackageCard[] = [
    {
      id: 1,
      title: "Cox's Bazar Escape",
      destination: "Cox's Bazar",
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85',
      duration: 3,
      price: 12500,
      rating: 4.9,
    },
    {
      id: 2,
      title: 'Sajek Cloud Journey',
      destination: 'Sajek Valley',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=85',
      duration: 2,
      price: 7800,
      rating: 4.8,
    },
    {
      id: 3,
      title: 'Bandarban Adventure',
      destination: 'Bandarban',
      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=85',
      duration: 4,
      price: 14900,
      rating: 4.9,
    },
  ];

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  ngOnInit(): void {
    this.startSlideshow();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  private startSlideshow(): void {
    this.stopSlideshow();
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

  nextSlide(): void {
    this.currentSlide.update((i) => (i + 1) % this.heroSlides.length);
    this.startSlideshow();
  }

  prevSlide(): void {
    this.currentSlide.update(
      (i) => (i - 1 + this.heroSlides.length) % this.heroSlides.length,
    );
    this.startSlideshow();
  }

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentSlide()];
  }

  // ═══════════════════════════════════════════════
  // FILTERING
  // ═══════════════════════════════════════════════
  get filteredDestinations(): DestinationCard[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.destinations.filter((destination) => {
      const matchesCategory =
        this.selectedCategory === 'ALL' ||
        destination.category === this.selectedCategory;

      const matchesSearch =
        !term ||
        destination.name.toLowerCase().includes(term) ||
        destination.country.toLowerCase().includes(term) ||
        destination.categoryLabel.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }

  get featuredDestinations(): DestinationCard[] {
    return this.filteredDestinations.filter((item) => item.featured);
  }

  get regularDestinations(): DestinationCard[] {
    return this.filteredDestinations.filter((item) => !item.featured);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  searchExplore(): void {
    // Scroll to destinations
    document
      .querySelector('.destinations-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedCategory = 'ALL';
  }

  // ═══════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════
  exploreDestination(destination: DestinationCard): void {
    this.router.navigate(['/destinations']);
  }

  viewDestinations(): void {
    this.router.navigate(['/destinations']);
  }

  viewHotels(): void {
    this.router.navigate(['/stays']);
  }

  viewRestaurants(): void {
    this.router.navigate(['/restaurants']);
  }

  viewPackages(): void {
    this.router.navigate(['/tour-packages']);
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }
}
