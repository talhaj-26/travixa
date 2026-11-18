import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';
import { TransportScheduleApi, TransportService } from '../../../core/services/transport.service';

interface TransportOption {
  id: number;
  type: 'BUS' | 'MINIBUS' | 'TRAIN' | 'CAR' | 'VAN' | 'BOAT' | 'OTHER';
  typeLabel: string;
  serviceClass: 'NON_AC' | 'AC' | 'AC_SLEEPER' | 'BUSINESS' | 'FIRST' | 'NOT_SPECIFIED';
  serviceClassLabel: string;
  operator: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: TransportScheduleApi['currency'];
  seats: number;
  amenities: string[];
  badge?: string;
  vehicle: string;
  image: string;
  scheduleDate?: string;
}

interface PopularRoute {
  from: string;
  to: string;
  type: string;
  price: number;
  duration: string;
  image: string;
}

interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-transportation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transportation.component.html',
  styleUrls: ['./transportation.component.scss'],
})
export class TransportationComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly transportService = inject(TransportService);

  // Search state
  selectedType = 'ALL';
  selectedServiceClass = 'ALL';
  tripType: 'ONE_WAY' | 'ROUND_TRIP' = 'ONE_WAY';
  from = '';
  to = '';
  travelDate = '';
  passengers = 1;

  // Filters
  selectedDepartureTime = 'ALL';
  selectedAmenities: string[] = [];
  sortBy: 'recommended' | 'price-low' | 'price-high' = 'recommended';

  // UI
  searchPerformed = signal(false);
  loading = true;
  loadError = '';
  comparingTransports = signal<number[]>([]);
  currentSlide = signal(0);
  private slideInterval: ReturnType<typeof setInterval> | null = null;

  // Hero slides
  heroSlides: HeroSlide[] = [
    {
      image:
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=90',
      title: 'Premium AC Buses',
      subtitle: 'Comfortable overnight journeys across Bangladesh',
    },
    {
      image:
        'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1920&q=90',
      title: 'Intercity Trains',
      subtitle: 'Scenic railway routes with world-class service',
    },
    {
      image:
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=90',
      title: 'Domestic Flights',
      subtitle: 'Fastest way to reach any destination',
    },
    {
      image:
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=90',
      title: 'Premium Car Rentals',
      subtitle: 'Self-drive freedom for your own schedule',
    },
    {
      image:
        'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1920&q=90',
      title: 'Luxury River Cruises',
      subtitle: 'Sail through Bangladesh beautiful waterways',
    },
  ];

  transportTypes = [
    { value: 'ALL', label: 'All' },
    { value: 'BUS', label: 'Bus' },
    { value: 'MINIBUS', label: 'Minibus' },
    { value: 'TRAIN', label: 'Train' },
    { value: 'CAR', label: 'Car' },
    { value: 'VAN', label: 'Van' },
    { value: 'BOAT', label: 'Boat' },
    { value: 'OTHER', label: 'Other' },
  ];

  serviceClasses = [{ value: 'ALL', label: 'All service levels' }];

  departureTimeOptions = [
    { value: 'ALL', label: 'Any Time' },
    { value: 'EARLY_MORNING', label: '0-6 AM' },
    { value: 'MORNING', label: '6-12 AM' },
    { value: 'AFTERNOON', label: '12-6 PM' },
    { value: 'EVENING', label: '6-12 PM' },
  ];

  amenitiesOptions: string[] = [];

  sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price-low', label: 'Price: Low → High' },
    { value: 'price-high', label: 'Price: High → Low' },
  ];

  popularRoutes: PopularRoute[] = [];

  transports: TransportOption[] = [];

  get routeCount(): number {
    return new Set(this.transports.map((transport) => `${transport.from}\u0000${transport.to}`)).size;
  }

  get availableSeatCount(): number {
    return this.transports.reduce((total, transport) => total + transport.seats, 0);
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const destination = params.get('to');
      if (destination) {
        this.to = destination;
        this.searchPerformed.set(true);
      }
    });
    this.transportService.getPublicSchedules().subscribe({
      next: schedules => { this.transports = schedules.map(schedule => this.toOption(schedule)); this.loading = false; },
      error: error => { this.loadError = error?.error?.message ?? 'Transport schedules could not be loaded.'; this.loading = false; }
    });
    this.startSlideshow();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  private startSlideshow(): void {
    this.stopSlideshow();
    this.slideInterval = setInterval(() => {
      this.currentSlide.update((i) => (i + 1) % this.heroSlides.length);
    }, 5500);
  }

  private stopSlideshow(): void {
    if (this.slideInterval !== null) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  goToSlide(i: number): void {
    this.currentSlide.set(i);
    this.startSlideshow();
  }

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentSlide()];
  }

  get filteredTransports(): TransportOption[] {
    let result = [...this.transports];

    if (this.selectedType !== 'ALL') {
      result = result.filter((t) => t.type === this.selectedType);
    }

    if (this.travelDate) result = result.filter(t => t.scheduleDate === this.travelDate);
    if (this.passengers > 0) result = result.filter(t => t.seats >= this.passengers);

    if (this.selectedServiceClass !== 'ALL') {
      result = result.filter(
        (t) => t.serviceClass === this.selectedServiceClass,
      );
    }

    if (this.searchPerformed() && (this.from || this.to)) {
      const sFrom = this.from.trim().toLowerCase();
      const sTo = this.to.trim().toLowerCase();
      result = result.filter((t) => {
        const okFrom = !sFrom || t.from.toLowerCase().includes(sFrom);
        const okTo = !sTo || t.to.toLowerCase().includes(sTo);
        return okFrom && okTo;
      });
    }

    if (this.selectedDepartureTime !== 'ALL') {
      result = result.filter((t) => {
        if (t.departure === 'Flexible') return true;
        const hour = parseInt(t.departure.split(':')[0], 10);
        return (
          (this.selectedDepartureTime === 'EARLY_MORNING' && hour < 6) ||
          (this.selectedDepartureTime === 'MORNING' &&
            hour >= 6 &&
            hour < 12) ||
          (this.selectedDepartureTime === 'AFTERNOON' &&
            hour >= 12 &&
            hour < 18) ||
          (this.selectedDepartureTime === 'EVENING' && hour >= 18)
        );
      });
    }

    if (this.selectedAmenities.length > 0) {
      result = result.filter((t) =>
        this.selectedAmenities.every((a) => t.amenities.includes(a)),
      );
    }

    switch (this.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      default:
        result.sort((a, b) => a.scheduleDate?.localeCompare(b.scheduleDate ?? '') ?? 0);
    }

    return result;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedType !== 'ALL') count++;
    if (this.selectedServiceClass !== 'ALL') count++;
    if (this.selectedDepartureTime !== 'ALL') count++;
    if (this.selectedAmenities.length > 0) count++;
    return count;
  }

  selectType(type: string): void {
    this.selectedType = type;
  }

  toggleAmenity(amenity: string): void {
    const idx = this.selectedAmenities.indexOf(amenity);
    if (idx > -1) {
      this.selectedAmenities.splice(idx, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
    this.selectedAmenities = [...this.selectedAmenities];
  }

  isAmenitySelected(amenity: string): boolean {
    return this.selectedAmenities.includes(amenity);
  }

  searchTransport(): void {
    this.searchPerformed.set(true);
    const results = this.filteredTransports;
    if (results.length === 0) {
      this.toast.warning('No transports found', 'Try another route');
    } else {
      this.toast.success(
        `${results.length} transports found`,
        'Scroll down to see',
      );
    }
    setTimeout(() => {
      document.querySelector('#transport-all')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  swapLocations(): void {
    const temp = this.from;
    this.from = this.to;
    this.to = temp;
  }

  selectRoute(from: string, to: string): void {
    this.from = from;
    this.to = to;
    this.searchPerformed.set(true);
    setTimeout(() => {
      document.querySelector('#transport-all')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  resetSearch(): void {
    this.from = '';
    this.to = '';
    this.travelDate = '';
    this.passengers = 1;
    this.selectedType = 'ALL';
    this.selectedServiceClass = 'ALL';
    this.selectedDepartureTime = 'ALL';
    this.selectedAmenities = [];
    this.sortBy = 'recommended';
    this.searchPerformed.set(false);
  }

  clearFilters(): void {
    this.selectedType = 'ALL';
    this.selectedServiceClass = 'ALL';
    this.selectedDepartureTime = 'ALL';
    this.selectedAmenities = [];
  }

  toggleCompare(id: number, event: Event): void {
    event.stopPropagation();
    const current = this.comparingTransports();
    if (current.includes(id)) {
      this.comparingTransports.set(current.filter((i) => i !== id));
    } else {
      if (current.length >= 3) {
        this.toast.warning('Compare limit', 'Max 3 transports');
        return;
      }
      this.comparingTransports.set([...current, id]);
    }
  }

  isComparing(id: number): boolean {
    return this.comparingTransports().includes(id);
  }

  formatPrice(amount: number, currency: TransportScheduleApi['currency']): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0,
    }).format(amount);
  }

  bookTransport(transport: TransportOption): void {
    this.router.navigate(['/booking'], {
      queryParams: { type: 'TRANSPORT', itemId: transport.id },
    });
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }

  private toOption(schedule: TransportScheduleApi): TransportOption {
    const typeLabel = schedule.vehicleType.toLowerCase().replace(/^./, letter => letter.toUpperCase());
    const start = new Date(schedule.departureAt);
    const end = new Date(schedule.arrivalAt);
    const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return {
      id: schedule.id,
      type: schedule.vehicleType,
      typeLabel,
      serviceClass: 'NOT_SPECIFIED',
      serviceClassLabel: 'Service class not specified',
      operator: schedule.providerName,
      name: `${schedule.originName} → ${schedule.destinationName}`,
      from: schedule.originName,
      to: schedule.destinationName,
      departure: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      arrival: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: `${hours}h ${minutes}m`,
      price: schedule.ticketPrice,
      currency: schedule.currency,
      seats: schedule.availableSeats,
      amenities: [],
      vehicle: schedule.vehicleLabel || typeLabel,
      image: '',
      scheduleDate: schedule.departureAt.slice(0, 10)
    };
  }
}
