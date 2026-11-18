import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';

type WishCategory = 'STAY' | 'DESTINATION' | 'TOUR' | 'DINING';

interface WishItem {
  id: number;
  title: string;
  location: string;
  country: string;
  description: string;
  image: string;
  gallery: string[];
  category: WishCategory;
  categoryLabel: string;
  categoryIcon: string;
  rating: number;
  reviews: number;
  meta1: string;
  meta2: string;
  price?: string;
  actionLabel: string;
  actionRoute: string;
  savedDate: string;
  savedDaysAgo: number;
}

interface CategoryStat {
  icon: string;
  label: string;
  count: number;
  category: WishCategory;
  accent: 'cyan' | 'purple' | 'emerald' | 'amber';
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  activeFilter: WishCategory | 'ALL' = 'ALL';
  searchTerm = '';
  sortBy: 'recent' | 'rating' | 'name' = 'recent';

  categoryStats: CategoryStat[] = [
    { icon: '🏨', label: 'Stays', count: 6, category: 'STAY', accent: 'cyan' },
    {
      icon: '🗺️',
      label: 'Destinations',
      count: 8,
      category: 'DESTINATION',
      accent: 'purple',
    },
    {
      icon: '🎒',
      label: 'Tours',
      count: 5,
      category: 'TOUR',
      accent: 'emerald',
    },
    {
      icon: '🍽️',
      label: 'Dining',
      count: 4,
      category: 'DINING',
      accent: 'amber',
    },
  ];
  animatedCounts: number[] = [0, 0, 0, 0];

  items: WishItem[] = [
    {
      id: 1,
      title: "Cox's Bazar",
      location: "Cox's Bazar",
      country: 'Bangladesh',
      description:
        'Endless beach, golden sunsets and the perfect coastal escape along the Bay of Bengal.',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=90',
      gallery: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
      ],
      category: 'DESTINATION',
      categoryLabel: 'Destination',
      categoryIcon: '🗺️',
      rating: 4.8,
      reviews: 1240,
      meta1: '🌊 Beach',
      meta2: '📍 Chattogram Division',
      actionLabel: 'Explore Destination',
      actionRoute: '/destinations',
      savedDate: '2 days ago',
      savedDaysAgo: 2,
    },
    {
      id: 2,
      title: 'Sajek Valley Escape',
      location: 'Rangamati',
      country: 'Bangladesh',
      description:
        'Clouds, hills and peaceful mornings wrapped into one unforgettable mountain adventure.',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=90',
      gallery: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
      ],
      category: 'TOUR',
      categoryLabel: 'Tour Package',
      categoryIcon: '🎒',
      rating: 4.9,
      reviews: 856,
      meta1: '⛰️ 3 Days',
      meta2: '👥 Small Group',
      actionLabel: 'View Tour Package',
      actionRoute: '/tour-packages',
      savedDate: '5 days ago',
      savedDaysAgo: 5,
    },
    {
      id: 3,
      title: 'Hotel Sea Crown',
      location: "Cox's Bazar",
      country: 'Bangladesh',
      description:
        'A comfortable beachfront stay designed for relaxed days and unforgettable sunsets.',
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=90',
      gallery: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
      ],
      category: 'STAY',
      categoryLabel: 'Stay',
      categoryIcon: '🏨',
      rating: 4.7,
      reviews: 642,
      meta1: 'Deluxe Room',
      meta2: 'Sea View',
      price: '৳5,500',
      actionLabel: 'View Stay',
      actionRoute: '/stays',
      savedDate: '1 week ago',
      savedDaysAgo: 7,
    },
    {
      id: 4,
      title: 'The Xchange',
      location: 'Chattogram',
      country: 'Bangladesh',
      description:
        'A refined fine-dining experience with international cuisine and memorable evenings.',
      image:
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=90',
      gallery: [
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=80',
      ],
      category: 'DINING',
      categoryLabel: 'Restaurant',
      categoryIcon: '🍽️',
      rating: 4.8,
      reviews: 428,
      meta1: '🍴 International',
      meta2: 'Premium',
      price: '৳৳৳',
      actionLabel: 'Reserve Table',
      actionRoute: '/restaurants',
      savedDate: '2 weeks ago',
      savedDaysAgo: 14,
    },
    {
      id: 5,
      title: 'Saint Martin',
      location: 'Saint Martin',
      country: 'Bangladesh',
      description:
        "Crystal clear water, island sunsets and an unforgettable tropical escape — Bangladesh's only coral island.",
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=90',
      gallery: [
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80',
      ],
      category: 'DESTINATION',
      categoryLabel: 'Destination',
      categoryIcon: '🗺️',
      rating: 4.9,
      reviews: 892,
      meta1: '🏝️ Island',
      meta2: '📍 Chattogram',
      actionLabel: 'Explore Island',
      actionRoute: '/destinations',
      savedDate: '3 weeks ago',
      savedDaysAgo: 21,
    },
    {
      id: 6,
      title: 'Bandarban Adventure',
      location: 'Bandarban',
      country: 'Bangladesh',
      description:
        'Explore green hills, waterfalls and rich indigenous culture across 4 adventurous days.',
      image:
        'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=90',
      gallery: [
        'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&q=80',
      ],
      category: 'TOUR',
      categoryLabel: 'Tour Package',
      categoryIcon: '🎒',
      rating: 4.8,
      reviews: 512,
      meta1: '🎒 4 Days',
      meta2: '🥾 Trekking',
      actionLabel: 'View Adventure',
      actionRoute: '/tour-packages',
      savedDate: '1 month ago',
      savedDaysAgo: 30,
    },
    {
      id: 7,
      title: 'Sylhet Tea Garden Resort',
      location: 'Sylhet',
      country: 'Bangladesh',
      description:
        'Wake up to rolling emerald hills, misty mornings and endless tea gardens in every direction.',
      image:
        'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=1200&q=90',
      gallery: [],
      category: 'STAY',
      categoryLabel: 'Stay',
      categoryIcon: '🏨',
      rating: 4.6,
      reviews: 340,
      meta1: 'Garden View',
      meta2: 'Breakfast Included',
      price: '৳6,500',
      actionLabel: 'View Stay',
      actionRoute: '/stays',
      savedDate: '1 month ago',
      savedDaysAgo: 32,
    },
    {
      id: 8,
      title: 'Rangamati Lake Cruise',
      location: 'Rangamati',
      country: 'Bangladesh',
      description:
        'Float across Kaptai Lake, visit floating markets and discover hidden tribal villages.',
      image:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=90',
      gallery: [],
      category: 'TOUR',
      categoryLabel: 'Tour Package',
      categoryIcon: '🎒',
      rating: 4.5,
      reviews: 218,
      meta1: '⛵ 2 Days',
      meta2: '🛶 Lake Cruise',
      actionLabel: 'View Tour',
      actionRoute: '/tour-packages',
      savedDate: '1 month ago',
      savedDaysAgo: 38,
    },
  ];

  filters: {
    value: WishCategory | 'ALL';
    label: string;
    icon: string;
    accent: string;
  }[] = [
    { value: 'ALL', label: 'All', icon: '✦', accent: 'default' },
    { value: 'STAY', label: 'Stays', icon: '🏨', accent: 'cyan' },
    {
      value: 'DESTINATION',
      label: 'Destinations',
      icon: '🗺️',
      accent: 'purple',
    },
    { value: 'TOUR', label: 'Tours', icon: '🎒', accent: 'emerald' },
    { value: 'DINING', label: 'Dining', icon: '🍽️', accent: 'amber' },
  ];

  loading = true;

  constructor() {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loading = false;
      this.animateCounters();
    }, 400);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private animateCounters(): void {
    this.categoryStats.forEach((stat, i) => {
      this.animateNumber(stat.count, 900 + i * 100, (v) => {
        this.animatedCounts[i] = Math.round(v);
      });
    });
  }

  private animateNumber(
    target: number,
    duration: number,
    setter: (v: number) => void,
  ): void {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setter(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else setter(target);
    };
    requestAnimationFrame(tick);
  }

  get filteredItems(): WishItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    const result = this.items.filter((item) => {
      const matchesCategory =
        this.activeFilter === 'ALL' || item.category === this.activeFilter;

      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.categoryLabel.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });

    switch (this.sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        result.sort((a, b) => a.savedDaysAgo - b.savedDaysAgo);
    }

    return result;
  }

  get totalSaved(): number {
    return this.items.length;
  }

  get categoryCount(): Record<string, number> {
    const counts: Record<string, number> = { ALL: this.items.length };
    (['STAY', 'DESTINATION', 'TOUR', 'DINING'] as WishCategory[]).forEach(
      (cat) => {
        counts[cat] = this.items.filter((i) => i.category === cat).length;
      },
    );
    return counts;
  }

  setFilter(filter: WishCategory | 'ALL'): void {
    this.activeFilter = filter;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  clearAllFilters(): void {
    this.activeFilter = 'ALL';
    this.searchTerm = '';
    this.sortBy = 'recent';
    this.toast.info('Filters cleared', 'Showing all saved items');
  }

  removeFromWishlist(item: WishItem, event?: Event): void {
    event?.stopPropagation();
    this.items = this.items.filter((i) => i.id !== item.id);
    this.toast.info('Removed from vault', item.title);
  }

  openItem(item: WishItem): void {
    this.router.navigate([item.actionRoute]);
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
  goToPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }
  goToProfile(): void {
    this.router.navigate(['/user-profile']);
  }
  goToBookings(): void {
    this.router.navigate(['/my-bookings']);
  }
  goToDestinations(): void {
    this.router.navigate(['/destinations']);
  }
  goToHome(): void {
    this.router.navigate(['/']);
  }
  goToSupport(): void {
    this.router.navigate(['/support']);
  }
  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
