import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface HolidayPackage {
  id: number;
  title: string;
  destination: string;
  region: string;
  duration: string;
  durationDays: number;
  price: number;
  oldPrice: number;
  savings: number;
  discountPercent: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  categoryLabel: string;
  description: string;
  inclusions: string[];
  featured: boolean;
  badge?: string;
  validUntil: string;
  seatsLeft: number;
}

interface HeroSlide {
  title: string;
  subtitle: string;
  location: string;
  image: string;
}

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './holidays.component.html',
  styleUrls: ['./holidays.component.scss'],
})
export class HolidaysComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  // ─── Filters ───
  searchTerm = '';
  selectedCategory = 'All';
  sortBy: 'popular' | 'price-low' | 'price-high' | 'rating' | 'discount' =
    'popular';

  // ─── Slideshow ───
  currentSlide = signal(0);
  private slideInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_MS = 6000;

  // ─── Countdown ───
  countdown = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private readonly dealEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // ═══════════════════════════════════════════════
  // HERO SLIDES
  // ═══════════════════════════════════════════════
  heroSlides: HeroSlide[] = [
    {
      title: "Cox's Bazar",
      subtitle: 'Beach Escape',
      location: 'Chittagong Division',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=90',
    },
    {
      title: 'Sajek Valley',
      subtitle: 'Cloud Adventure',
      location: 'Rangamati Hill District',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=90',
    },
    {
      title: 'Sylhet',
      subtitle: 'Tea Garden Retreat',
      location: 'Sylhet Division',
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=90',
    },
    {
      title: 'Sundarbans',
      subtitle: 'Wilderness Journey',
      location: 'Khulna Division',
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=90',
    },
    {
      title: 'Saint Martin',
      subtitle: 'Island Paradise',
      location: 'Bay of Bengal',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=90',
    },
  ];

  // ═══════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════
  categories = [
    { value: 'All', label: 'All Holidays', icon: '✦' },
    { value: 'Beach', label: 'Beach Escapes', icon: '◉' },
    { value: 'Mountain', label: 'Mountain', icon: '▲' },
    { value: 'Adventure', label: 'Adventure', icon: '◇' },
    { value: 'Nature', label: 'Nature', icon: '❋' },
    { value: 'Cultural', label: 'Cultural', icon: '❖' },
    { value: 'Family', label: 'Family', icon: '◆' },
    { value: 'Luxury', label: 'Luxury', icon: '★' },
  ];

  // ═══════════════════════════════════════════════
  // 12 HOLIDAY PACKAGES — Unique deals
  // ═══════════════════════════════════════════════
  packages: HolidayPackage[] = [
    {
      id: 1,
      title: "Cox's Bazar Beach Escape",
      destination: "Cox's Bazar",
      region: 'Chittagong Division',
      duration: '3 Days / 2 Nights',
      durationDays: 3,
      price: 8500,
      oldPrice: 10500,
      savings: 2000,
      discountPercent: 19,
      rating: 4.8,
      reviews: 126,
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=85',
      category: 'Beach',
      categoryLabel: 'Beach Escape',
      description:
        'Relax beside the longest natural sea beach with sunset cruises and seafood dinners.',
      inclusions: ['Hotel Stay', 'Breakfast', 'Beach Tour', 'Transfers'],
      featured: true,
      badge: 'DEAL OF THE WEEK',
      validUntil: 'Limited time',
      seatsLeft: 12,
    },
    {
      id: 2,
      title: 'Sajek Cloud Adventure',
      destination: 'Sajek Valley',
      region: 'Rangamati Hill District',
      duration: '3 Days / 2 Nights',
      durationDays: 3,
      price: 7200,
      oldPrice: 8500,
      savings: 1300,
      discountPercent: 15,
      rating: 4.7,
      reviews: 98,
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=85',
      category: 'Mountain',
      categoryLabel: 'Mountain Escape',
      description:
        'Wake up above the clouds and explore Konglak Hill, bamboo bridges and indigenous villages.',
      inclusions: ['Resort Stay', 'Breakfast', 'Hill Tour', 'Transport'],
      featured: true,
      badge: 'BEST SELLER',
      validUntil: 'This week',
      seatsLeft: 8,
    },
    {
      id: 3,
      title: 'Bandarban Mountain Explorer',
      destination: 'Bandarban',
      region: 'Chittagong Hill Tracts',
      duration: '4 Days / 3 Nights',
      durationDays: 4,
      price: 9500,
      oldPrice: 11500,
      savings: 2000,
      discountPercent: 17,
      rating: 4.6,
      reviews: 84,
      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=85',
      category: 'Adventure',
      categoryLabel: 'Adventure',
      description:
        'Trek to Nilgiri, visit waterfalls and explore the highest peaks of Bangladesh.',
      inclusions: ['Resort', 'Trekking', 'Meals', 'Guide'],
      featured: true,
      badge: 'TRENDING',
      validUntil: 'Last 5 days',
      seatsLeft: 6,
    },
    {
      id: 4,
      title: 'Sylhet Green Retreat',
      destination: 'Sylhet',
      region: 'Sylhet Division',
      duration: '3 Days / 2 Nights',
      durationDays: 3,
      price: 6800,
      oldPrice: 7900,
      savings: 1100,
      discountPercent: 14,
      rating: 4.5,
      reviews: 73,
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=85',
      category: 'Nature',
      categoryLabel: 'Nature Retreat',
      description:
        'Discover tea gardens, Ratargul swamp forest and Jaflong river with local guides.',
      inclusions: ['Resort', 'Breakfast', 'Tea Tour', 'Transfers'],
      featured: false,
      validUntil: '7 days left',
      seatsLeft: 15,
    },
    {
      id: 5,
      title: 'Dhaka Heritage Experience',
      destination: 'Dhaka',
      region: 'Dhaka Division',
      duration: '2 Days / 1 Night',
      durationDays: 2,
      price: 4500,
      oldPrice: 5200,
      savings: 700,
      discountPercent: 13,
      rating: 4.4,
      reviews: 61,
      image:
        'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=900&q=85',
      category: 'Cultural',
      categoryLabel: 'Cultural',
      description:
        'Explore Old Dhaka, Lalbagh Fort, Ahsan Manzil and the vibrant street food scene.',
      inclusions: ['Hotel', 'Breakfast', 'City Tour', 'Rickshaw Ride'],
      featured: false,
      validUntil: '10 days left',
      seatsLeft: 20,
    },
    {
      id: 6,
      title: 'Rangamati Lake Discovery',
      destination: 'Rangamati',
      region: 'Chittagong Hill Tracts',
      duration: '3 Days / 2 Nights',
      durationDays: 3,
      price: 7600,
      oldPrice: 8900,
      savings: 1300,
      discountPercent: 15,
      rating: 4.7,
      reviews: 55,
      image:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85',
      category: 'Nature',
      categoryLabel: 'Lake Escape',
      description:
        'Cruise Kaptai Lake, visit hanging bridges and experience indigenous culture.',
      inclusions: ['Resort', 'Boat Tour', 'Meals', 'Guide'],
      featured: false,
      validUntil: '5 days left',
      seatsLeft: 14,
    },
    {
      id: 7,
      title: 'Sundarbans Wildlife Safari',
      destination: 'Sundarbans',
      region: 'Khulna Division',
      duration: '3 Days / 2 Nights',
      durationDays: 3,
      price: 12500,
      oldPrice: 16000,
      savings: 3500,
      discountPercent: 22,
      rating: 4.8,
      reviews: 145,
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=85',
      category: 'Adventure',
      categoryLabel: 'Wildlife Safari',
      description:
        "Explore the world's largest mangrove forest and spot the Royal Bengal Tiger.",
      inclusions: ['Cruise Ship', 'All Meals', 'Safari', 'Guide'],
      featured: true,
      badge: 'UNESCO SITE',
      validUntil: 'This month',
      seatsLeft: 10,
    },
    {
      id: 8,
      title: 'Saint Martin Island Paradise',
      destination: 'Saint Martin',
      region: 'Bay of Bengal',
      duration: '3 Days / 2 Nights',
      durationDays: 3,
      price: 10500,
      oldPrice: 13500,
      savings: 3000,
      discountPercent: 22,
      rating: 4.9,
      reviews: 189,
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&q=85',
      category: 'Beach',
      categoryLabel: 'Island Escape',
      description:
        "Bangladesh's only coral island — pristine beaches, snorkeling and coral reefs.",
      inclusions: ['Beach Resort', 'Boat', 'Snorkeling', 'All Meals'],
      featured: true,
      badge: 'BEST RATED',
      validUntil: 'Peak season',
      seatsLeft: 8,
    },
    {
      id: 9,
      title: 'Kuakata Sunrise Tour',
      destination: 'Kuakata',
      region: 'Patuakhali, Barisal',
      duration: '2 Days / 1 Night',
      durationDays: 2,
      price: 4200,
      oldPrice: 5200,
      savings: 1000,
      discountPercent: 19,
      rating: 4.5,
      reviews: 87,
      image:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=85',
      category: 'Beach',
      categoryLabel: 'Sunrise Beach',
      description:
        'Experience both sunrise and sunset beside the sea at this rare south-facing beach.',
      inclusions: ['Hotel', 'Breakfast', 'Beach Tour', 'Transport'],
      featured: false,
      validUntil: '6 days left',
      seatsLeft: 18,
    },
    {
      id: 10,
      title: 'Sreemangal Tea Trail',
      destination: 'Sylhet',
      region: 'Maulvibazar, Sylhet',
      duration: '2 Days / 1 Night',
      durationDays: 2,
      price: 5400,
      oldPrice: 6500,
      savings: 1100,
      discountPercent: 17,
      rating: 4.6,
      reviews: 96,
      image:
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=900&q=85',
      category: 'Nature',
      categoryLabel: 'Tea Country',
      description:
        'Explore tea estates, Lawachara rainforest and taste the famous seven-layer tea.',
      inclusions: ['Resort', 'Breakfast', 'Estate Tour', 'Forest Walk'],
      featured: false,
      validUntil: '5 days left',
      seatsLeft: 16,
    },
    {
      id: 11,
      title: 'Family Beach Holiday Special',
      destination: "Cox's Bazar",
      region: 'Chittagong Division',
      duration: '5 Days / 4 Nights',
      durationDays: 5,
      price: 24500,
      oldPrice: 32000,
      savings: 7500,
      discountPercent: 23,
      rating: 4.9,
      reviews: 210,
      image:
        'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=900&q=85',
      category: 'Family',
      categoryLabel: 'Family Escape',
      description:
        'Perfect family getaway with resort stays, beach activities and kids entertainment.',
      inclusions: ['5-Star Resort', 'All Meals', 'Activities', 'Transfers'],
      featured: true,
      badge: 'FAMILY FRIENDLY',
      validUntil: 'Limited seats',
      seatsLeft: 4,
    },
    {
      id: 12,
      title: 'Luxury Sylhet Tea Resort',
      destination: 'Sylhet',
      region: 'Sylhet Division',
      duration: '4 Days / 3 Nights',
      durationDays: 4,
      price: 38500,
      oldPrice: 48000,
      savings: 9500,
      discountPercent: 20,
      rating: 4.9,
      reviews: 78,
      image:
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=85',
      category: 'Luxury',
      categoryLabel: 'Luxury Retreat',
      description:
        'Indulgent escape in a luxury tea estate resort with spa, fine dining and private tours.',
      inclusions: ['Luxury Villa', 'Spa', 'Fine Dining', 'Private Guide'],
      featured: true,
      badge: 'PREMIUM',
      validUntil: 'Exclusive',
      seatsLeft: 3,
    },
  ];

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  ngOnInit(): void {
    this.startSlideshow();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
    this.stopCountdown();
  }

  // ─── Slideshow ───
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

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentSlide()];
  }

  // ─── Countdown ───
  private startCountdown(): void {
    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const distance = this.dealEndDate.getTime() - now;

    if (distance <= 0) {
      this.countdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    this.countdown.set({
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    });
  }

  // ═══════════════════════════════════════════════
  // FILTERED RESULTS
  // ═══════════════════════════════════════════════
  get filteredPackages(): HolidayPackage[] {
    const term = this.searchTerm.trim().toLowerCase();

    let result = this.packages.filter((item) => {
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.destination.toLowerCase().includes(term) ||
        item.region.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);

      const matchesCategory =
        this.selectedCategory === 'All' ||
        item.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (this.sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        result = [...result].sort(
          (a, b) => b.discountPercent - a.discountPercent,
        );
        break;
      default: // popular
        result = [...result].sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return b.reviews - a.reviews;
        });
    }

    return result;
  }

  get featuredPackages(): HolidayPackage[] {
    return this.packages.filter((p) => p.featured).slice(0, 4);
  }

  get categoryCounts(): Record<string, number> {
    const counts: Record<string, number> = { All: this.packages.length };
    this.categories.forEach((cat) => {
      if (cat.value !== 'All') {
        counts[cat.value] = this.packages.filter(
          (p) => p.category === cat.value,
        ).length;
      }
    });
    return counts;
  }

  // ═══════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════
  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.sortBy = 'popular';
  }

  explorePackage(item: HolidayPackage): void {
    this.router.navigate(['/tour-package-details'], {
      queryParams: { id: item.id },
    });
  }

  bookPackage(item: HolidayPackage): void {
    this.router.navigate(['/booking'], {
      queryParams: { type: 'HOLIDAY', itemId: item.id },
    });
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }
}
