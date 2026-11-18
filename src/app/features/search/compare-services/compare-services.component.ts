import {
  Component,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';

type ServiceType = 'HOTEL' | 'TOUR' | 'RESTAURANT' | 'GUIDE';

interface CompareService {
  id: number;
  type: ServiceType;
  typeLabel: string;
  typeIcon: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  score: number;
  startingPrice: number;
  priceUnit: string;
  availability: boolean;
  flexibleBooking: boolean;
  verified: boolean;
  bestFor: string;
  actionLabel: string;
  actionRoute: string;
}

interface FeatureRow {
  label: string;
  field: keyof CompareService | 'score' | 'startingPrice' | 'rating';
  render?: 'score' | 'price' | 'boolean' | 'text' | 'rating';
}

@Component({
  selector: 'app-compare-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compare-services.component.html',
  styleUrl: './compare-services.component.scss',
})
export class CompareServicesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /* ═══════════════ SERVICES ═══════════════ */
  services: CompareService[] = [
    {
      id: 1,
      type: 'HOTEL',
      typeLabel: 'Hotel',
      typeIcon: '🏨',
      name: 'Grand Palace Dhaka',
      location: 'Dhaka, Bangladesh',
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85',
      rating: 4.8,
      reviews: 326,
      score: 92,
      startingPrice: 12000,
      priceUnit: 'per night',
      availability: true,
      flexibleBooking: true,
      verified: true,
      bestFor: 'Luxury stay',
      actionLabel: 'Book',
      actionRoute: '/booking',
    },
    {
      id: 2,
      type: 'TOUR',
      typeLabel: 'Tour Package',
      typeIcon: '🎒',
      name: 'Sajek Cloud Escape',
      location: 'Sajek Valley, Rangamati',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=85',
      rating: 4.9,
      reviews: 218,
      score: 95,
      startingPrice: 8500,
      priceUnit: 'per person',
      availability: true,
      flexibleBooking: true,
      verified: true,
      bestFor: 'Adventure',
      actionLabel: 'Book',
      actionRoute: '/booking',
    },
    {
      id: 3,
      type: 'RESTAURANT',
      typeLabel: 'Restaurant',
      typeIcon: '🍽️',
      name: 'Bengal Bistro',
      location: 'Gulshan, Dhaka',
      image:
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=85',
      rating: 4.7,
      reviews: 184,
      score: 89,
      startingPrice: 1800,
      priceUnit: 'avg spend',
      availability: true,
      flexibleBooking: false,
      verified: true,
      bestFor: 'Fine dining',
      actionLabel: 'Reserve',
      actionRoute: '/booking',
    },
    {
      id: 4,
      type: 'GUIDE',
      typeLabel: 'Tour Guide',
      typeIcon: '🧭',
      name: 'Arif Hasan',
      location: 'Chattogram Hill Tracts',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
      rating: 4.9,
      reviews: 286,
      score: 94,
      startingPrice: 2500,
      priceUnit: 'per day',
      availability: true,
      flexibleBooking: true,
      verified: true,
      bestFor: 'Guided travel',
      actionLabel: 'Hire',
      actionRoute: '/booking',
    },
  ];

  /* ═══════════════ MATRIX ROWS ═══════════════ */
  featureRows: FeatureRow[] = [
    { label: 'Starting Price', field: 'startingPrice', render: 'price' },
    { label: 'Guest Rating', field: 'rating', render: 'rating' },
    { label: 'Availability', field: 'availability', render: 'boolean' },
    { label: 'Flexible Booking', field: 'flexibleBooking', render: 'boolean' },
    { label: 'TRAVIXA Verified', field: 'verified', render: 'boolean' },
    { label: 'Best For', field: 'bestFor', render: 'text' },
  ];

  /* ═══════════════ UI STATE ═══════════════ */
  animatedScores: number[] = [];
  loading = true;
  saved = false;

  constructor() {}

  ngOnInit(): void {
    this.animatedScores = this.services.map(() => 0);
    setTimeout(() => {
      this.loading = false;
      this.animateScores();
    }, 400);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  /* ═══════════════ HELPERS ═══════════════ */
  get winnerId(): number {
    if (this.services.length === 0) return -1;
    return this.services.reduce(
      (best, current) => (current.score > best.score ? current : best),
      this.services[0],
    ).id;
  }

  isWinner(id: number): boolean {
    return this.services.length > 1 && id === this.winnerId;
  }

  get typeColorClass(): string {
    return '';
  }

  getColorVar(type: ServiceType): string {
    const map: Record<ServiceType, string> = {
      HOTEL: 'blue',
      TOUR: 'green',
      RESTAURANT: 'orange',
      GUIDE: 'purple',
    };
    return map[type];
  }

  private animateScores(): void {
    this.services.forEach((service, i) => {
      this.animateNumber(service.score, 1000 + i * 100, (v) => {
        this.animatedScores[i] = Math.round(v);
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

  /* ═══════════════ ACTIONS ═══════════════ */
  removeService(id: number, event?: Event): void {
    event?.stopPropagation();
    const removed = this.services.find((s) => s.id === id);
    this.services = this.services.filter((s) => s.id !== id);
    this.animatedScores = this.services.map(() => 0);
    setTimeout(() => this.animateScores(), 50);
    if (removed) {
      this.toast.info('Removed from comparison', removed.name);
    }
  }

  clearAll(): void {
    this.services = [];
    this.animatedScores = [];
    this.toast.info('Comparison cleared', 'All services removed');
  }

  saveComparison(): void {
    if (this.services.length === 0) return;
    try {
      localStorage.setItem(
        'travixa_comparison',
        JSON.stringify(this.services.map((s) => s.id)),
      );
      this.saved = true;
      this.toast.success('Comparison saved', 'You can return to it anytime');
      setTimeout(() => (this.saved = false), 2500);
    } catch {
      this.toast.error('Could not save', 'Try again');
    }
  }

  getScoreStyle(score: number): string {
    return `conic-gradient(var(--accent) 0 ${score}%, var(--surface-2) ${score}% 100%)`;
  }

  getColWidth(): string {
    const cols = Math.max(this.services.length, 1);
    return `minmax(160px, ${100 / cols}%)`;
  }

  getGridTemplate(): string {
    const cols = Math.max(this.services.length, 1);
    return `180px repeat(${cols}, minmax(200px, 1fr))`;
  }

  formatPrice(value: number): string {
    return `৳${value.toLocaleString('en-BD')}`;
  }

  getFeatureValue(service: CompareService, field: FeatureRow['field']): any {
    return (service as any)[field];
  }

  /* ═══════════════ NAVIGATION ═══════════════ */
  goToSearch(): void {
    this.router.navigate(['/search-results']);
  }
  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }
  goToBooking(): void {
    this.router.navigate(['/booking']);
  }
  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
  goToHome(): void {
    this.router.navigate(['/']);
  }
  goToService(service: CompareService): void {
    const routeMap: Record<ServiceType, string> = {
      HOTEL: '/hotel-details',
      TOUR: '/tour-package-details',
      RESTAURANT: '/restaurant-details',
      GUIDE: '/tour-guide-details',
    };
    this.router.navigate([routeMap[service.type]], {
      queryParams: { id: service.id },
    });
  }
}