import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MediaService } from '../../../core/services/media.service';
import { PackageDepartureApiResponse, TourPackageApiResponse, TourPackageService } from '../../../core/services/tour-package.service';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface ItineraryDay {
  day: string;
  title: string;
  text: string;
  items: string[];
  image?: string;
}

interface Inclusion {
  icon: string;
  label: string;
  type: 'INCLUDE' | 'EXCLUDE';
}

interface SimilarPackage {
  id: number;
  title: string;
  location: string;
  image: string;
  price: number;
  days: string;
  currency: TourPackageApiResponse['currency'];
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
@Component({
  selector: 'app-tour-package-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-package-details.component.html',
  styleUrl: './tour-package-details.component.scss',
})
export class TourPackageDetailsComponent implements OnInit, OnDestroy {
  /* ─── Package Data ─── */
  package = {
    id: 0,
    title: '',
    subtitle: '',
    location: '',
    duration: '',
    groupType: '',
    price: 0,
    currency: 'BDT',
    status: '',
    badge: 'TRAVIXA TOUR PACKAGE',
    availabilityPercent: 0,
    availabilityNote: '',
  };

  /* ─── Gallery ─── */
  heroMainImage = '';
  gallerySide: { image: string; label: string }[] = [];

  /* ─── Highlights ─── */
  /* ─── Itinerary ─── */
  itinerary: ItineraryDay[] = [];

  /* ─── Inclusions ─── */
  inclusions: Inclusion[] = [];

  /* ─── Destinations ─── */
  /* ─── Policies ─── */
  policies: { icon: string; title: string; text: string }[] = [];

  /* ─── Similar packages ─── */
  similarPackages: SimilarPackage[] = [];

  /* ─── Booking Form ─── */
  booking = {
    travelDate: '',
    travellers: 2,
  };
  packageBasePrice = 0;
  packageBaseCurrency: TourPackageApiResponse['currency'] = 'BDT';
  departures: PackageDepartureApiResponse[] = [];
  selectedDepartureId: number | null = null;


  /* ─── UI State ─── */
  loading = true;
  animatedAvailability = 0;
  expandedInclusions = false;

  /* ─── Toast ─── */
  toast: { show: boolean; message: string; type: 'success' | 'info' | 'danger' } = {
    show: false,
    message: '',
    type: 'info',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly packagesApi: TourPackageService,
    private readonly mediaApi: MediaService,
  ) {}

  /* ═══════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = Number(params['id']);
      if (Number.isInteger(id) && id > 0) this.loadPackage(id);
      else this.loading = false;
    });

    this.setDefaultDate();

  }

  private loadPackage(id: number): void {
    this.loading = true;
    this.package = {
      ...this.package, id, title: 'Loading tour package…', subtitle: '', location: '', duration: '',
      groupType: '', price: 0, currency: 'BDT', status: 'Loading…',
      badge: 'TOUR PACKAGE', availabilityPercent: 0, availabilityNote: 'Loading departure availability…',
    };
    this.packageBasePrice = 0;
    this.packageBaseCurrency = 'BDT';
    this.heroMainImage = '';
    this.gallerySide = [];
    this.itinerary = [];
    this.inclusions = [];
    this.departures = [];
    this.selectedDepartureId = null;
    this.packagesApi.getPublishedById(id).subscribe({
      next: (item) => {
        this.applyPackage(item);
        this.packagesApi.itineraries(id).subscribe({
          next: (days) => {
            this.itinerary = days.map((day) => ({ day: `Day ${String(day.dayNumber).padStart(2, '0')}`, title: day.title, text: day.description || '', items: day.locationName ? [day.locationName] : [] }));
          },
        });
      this.packagesApi.images(id).subscribe({
          next: (images) => {
            const ordered = [...images].sort((a, b) => Number(b.coverImage) - Number(a.coverImage) || a.displayOrder - b.displayOrder);
            this.heroMainImage = this.mediaApi.resolveMediaUrl(ordered[0]?.publicUrl);
            this.gallerySide = ordered.slice(1, 3).map((image) => ({ image: this.mediaApi.resolveMediaUrl(image.publicUrl), label: image.altText || 'Package photo' }));
          },
          error: () => { this.heroMainImage = ''; this.gallerySide = []; },
        });
        this.packagesApi.departures(id).subscribe({ next: (items) => this.applyNextDeparture(items) });
        this.loadSimilarPackages(id);
        this.loading = false;
      },
      error: () => { this.package = { ...this.package, title: 'Tour package unavailable', status: 'Unavailable' }; this.loading = false; },
    });
  }

  private applyPackage(item: TourPackageApiResponse): void {
    this.package = {
      ...this.package, id: item.id, title: item.name, subtitle: item.description || this.package.subtitle,
      location: item.destinationName, duration: `${item.durationDays} Days / ${Math.max(0, item.durationDays - 1)} Nights`,
      groupType: `Up to ${item.maximumGroupSize} guests`, price: Number(item.basePrice),
      currency: item.currency,
      availabilityPercent: 0,
      availabilityNote: 'Loading departure availability…',
      status: item.listingStatus === 'PUBLISHED' ? 'Available to book' : item.listingStatus,
    };
    this.packageBasePrice = Number(item.basePrice);
    this.packageBaseCurrency = item.currency;
    const split = (value: string | null) => (value || '').split(/\r?\n|,/).map((part) => part.trim()).filter(Boolean);
    this.inclusions = [
      ...split(item.inclusions).map((label) => ({ icon: '✓', label, type: 'INCLUDE' as const })),
      ...split(item.exclusions).map((label) => ({ icon: '✕', label, type: 'EXCLUDE' as const })),
    ];
    this.policies = item.cancellationPolicy
      ? [{ icon: '↺', title: 'Cancellation policy', text: item.cancellationPolicy }]
      : [];
  }

  private loadSimilarPackages(currentId: number): void {
    this.packagesApi.getPublished().subscribe({
      next: (items) => {
        const related = items.filter((item) => item.id !== currentId).slice(0, 3);
        if (!related.length) { this.similarPackages = []; return; }
        forkJoin(related.map((item) => this.packagesApi.images(item.id).pipe(catchError(() => of([])))))
          .subscribe((galleries) => {
            this.similarPackages = related.map((item, index) => {
              const image = galleries[index]?.find((photo) => photo.coverImage) ?? galleries[index]?.[0];
              return {
                id: item.id,
                title: item.name,
                location: item.destinationName,
                image: this.mediaApi.resolveMediaUrl(image?.publicUrl),
                price: Number(item.basePrice),
                days: `${item.durationDays} days`,
                currency: item.currency,
              };
            });
          });
      },
      error: () => { this.similarPackages = []; },
    });
  }

  private applyNextDeparture(items: PackageDepartureApiResponse[]): void {
    this.departures = items.filter((item) => item.status === 'SCHEDULED' && new Date(item.startsAt).getTime() > Date.now());
    const next = this.departures.find((item) => item.seatsRemaining >= this.booking.travellers);
    if (!next) {
      this.selectedDepartureId = null;
      this.package = { ...this.package, availabilityPercent: 0, availabilityNote: 'No upcoming departure has enough seats for your group.' };
      this.animatedAvailability = 0;
      return;
    }
    this.selectDeparture(next.id);
  }

  selectDeparture(id: number | null): void {
    const departure = this.departures.find((item) => item.id === Number(id));
    if (!departure) { this.selectedDepartureId = null; return; }
    this.selectedDepartureId = departure.id;
    const startDate = new Date(departure.startsAt);
    this.booking.travelDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    this.package = {
      ...this.package,
      price: departure.priceOverride === null ? this.packageBasePrice : Number(departure.priceOverride),
      currency: departure.priceOverride === null ? this.packageBaseCurrency : departure.currency,
      availabilityPercent: Math.round((departure.seatsRemaining / departure.seatCapacity) * 100),
      availabilityNote: `${departure.seatsRemaining} of ${departure.seatCapacity} seats remaining for this departure.`,
    };
    this.animatedAvailability = this.package.availabilityPercent;
  }

  private ensureDepartureCapacity(): void {
    const current = this.departures.find((item) => item.id === this.selectedDepartureId);
    if (!current || current.seatsRemaining < this.booking.travellers) {
      const next = this.departures.find((item) => item.seatsRemaining >= this.booking.travellers);
      if (next) this.selectDeparture(next.id);
      else {
        this.selectedDepartureId = null;
        this.package = { ...this.package, availabilityPercent: 0, availabilityNote: 'No upcoming departure has enough seats for your group.' };
        this.animatedAvailability = 0;
      }
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private setDefaultDate(): void {
    const today = new Date();
    today.setDate(today.getDate() + 14);
    this.booking.travelDate = today.toISOString().split('T')[0];
  }

  /* ═══════════════════════════════════════════════════════════
     BOOKING CALCULATIONS
     ═══════════════════════════════════════════════════════════ */
  get subtotal(): number {
    return this.package.price * this.booking.travellers;
  }

  get serviceFee(): number {
    return 0; // included
  }

  get total(): number {
    return this.subtotal;
  }

  get bookingValid(): boolean {
    return (
      !!this.booking.travelDate && this.booking.travellers > 0 && this.selectedDepartureId !== null
    );
  }

  incrementTravellers(): void {
    this.booking.travellers = Math.min(12, this.booking.travellers + 1);
    this.ensureDepartureCapacity();
  }

  decrementTravellers(): void {
    this.booking.travellers = Math.max(1, this.booking.travellers - 1);
    this.ensureDepartureCapacity();
  }

  reservePackage(): void {
    if (!this.bookingValid) {
      this.showToast('Please select an available departure date', 'danger');
      return;
    }

    this.router.navigate(['/booking'], {
      queryParams: {
        type: 'TOUR_PACKAGE',
        itemId: this.package.id,
        date: this.booking.travelDate,
        travellers: this.booking.travellers,
        departureId: this.selectedDepartureId,
      },
    });
  }

  continueToBooking(): void {
    this.reservePackage();
  }

  /* ═══════════════════════════════════════════════════════════
     INCLUSIONS TOGGLE
     ═══════════════════════════════════════════════════════════ */
  toggleInclusions(): void {
    this.expandedInclusions = !this.expandedInclusions;
  }

  get visibleInclusions(): Inclusion[] {
    return this.expandedInclusions
      ? this.inclusions
      : this.inclusions.slice(0, 4);
  }

  /* ═══════════════════════════════════════════════════════════
     CROSS-SELL
     ═══════════════════════════════════════════════════════════ */
  viewSimilarPackage(p: SimilarPackage): void {
    this.router.navigate(['/tour-package-details'], {
      queryParams: { id: p.id },
    });
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════ */
  goToHome(): void {
    this.router.navigate(['/']);
  }
  goToPackages(): void {
    this.router.navigate(['/tour-packages']);
  }
  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
  goToDestinations(): void {
    this.router.navigate(['/destinations']);
  }
  goToMyTrips(): void {
    this.router.navigate(['/my-bookings']);
  }
  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */
  formatCurrency(amount: number, currency: string = this.package.currency): string {
    const symbol = currency === 'BDT' ? '৳' : currency;
    return `${symbol}${amount.toLocaleString('en-BD')}`;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private showToast(message: string, type: 'success' | 'info' | 'danger'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
    }, 3200);
  }
}
