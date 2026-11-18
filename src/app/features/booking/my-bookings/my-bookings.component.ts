import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Booking as BookingRecord } from '../../../shared/models/booking';
import { BookingService } from '../../../core/services/booking.service';
import { InvoiceService } from '../../../core/services/invoice.service';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED';
type BookingCategory = 'HOTEL' | 'TOUR' | 'TOUR_GUIDE' | 'RESTAURANT' | 'TRANSPORT';
type FilterTab = 'ALL' | BookingStatus;
type SortBy = 'date-desc' | 'date-asc' | 'amount-high' | 'amount-low';

interface Booking {
  id: number;
  managedBookingId?: number;
  itemId: number;
  reference: string;
  category: BookingCategory;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  status: BookingStatus;
  date: string;
  endDate?: string;
  time?: string;
  guests: number;
  guestsLabel: string;
  total: number;
  currency: string;
  paid: boolean;
  notes?: string;
  rating?: number;
  bookedOn: string;
  primaryDateLabel: string;
  meta: { label: string; value: string }[];
  extraInfo?: { label: string; value: string }[];
}

interface ConfirmDialog {
  open: boolean;
  action: 'cancel' | 'delete' | 'rebook' | null;
  booking: Booking | null;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss',
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  /* ─── Filter / Sort ─── */
  activeTab: FilterTab = 'ALL';
  searchTerm = '';
  sortBy: SortBy = 'date-desc';

  /* ─── Dialog ─── */
  dialog: ConfirmDialog = { open: false, action: null, booking: null };

  /* ─── Toast ─── */
  toast: { show: boolean; message: string; type: 'success' | 'info' | 'danger' } = {
    show: false,
    message: '',
    type: 'success',
  };

  /* ─── Reveal animation state ─── */
  revealedCards = new Set<number>();

  /* ─── Tabs ─── */
  tabs: { value: FilterTab; label: string; icon: string }[] = [
    { value: 'ALL', label: 'All Bookings', icon: '◆' },
    { value: 'CONFIRMED', label: 'Confirmed', icon: '●' },
    { value: 'PENDING', label: 'Pending', icon: '◐' },
    { value: 'COMPLETED', label: 'Completed', icon: '✓' },
    { value: 'CANCELLED', label: 'Cancelled', icon: '×' },
    { value: 'REFUNDED', label: 'Refunded', icon: '↩' },
  ];

  sortOptions: { value: SortBy; label: string }[] = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'amount-high', label: 'Amount: High → Low' },
    { value: 'amount-low', label: 'Amount: Low → High' },
  ];

  bookings: Booking[] = [];
  private bookingsSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private invoiceService: InvoiceService,
  ) { }

  /* ═══════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
  ngOnInit(): void {
    this.bookingsSubscription = this.bookingService.getAll().subscribe({
      next: (bookings: BookingRecord[]) => {
        this.loadManagedBookings(bookings);
        setTimeout(() => this.revealVisible(), 100);
      },
      error: () => {
        this.bookings = [];
        this.showToast('Unable to load your bookings.', 'danger');
      },
    });
  }

  ngOnDestroy(): void {
    this.bookingsSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.revealVisible();
  }

  private revealVisible(): void {
    if (typeof window === 'undefined') return;
    const cards = document.querySelectorAll<HTMLElement>('.booking-card');
    cards.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const id = Number(el.dataset['id']);
      if (rect.top < window.innerHeight - 80) {
        this.revealedCards.add(id);
      }
    });
  }

  isRevealed(id: number): boolean {
    return this.revealedCards.has(id);
  }

  /* ═══════════════════════════════════════════════════════════
     COMPUTED
     ═══════════════════════════════════════════════════════════ */
  get filteredBookings(): Booking[] {
    const term = this.searchTerm.trim().toLowerCase();

    let result = this.bookings.filter((b) => {
      const matchesTab = this.activeTab === 'ALL' || b.status === this.activeTab;
      const matchesSearch =
        !term ||
        b.title.toLowerCase().includes(term) ||
        b.reference.toLowerCase().includes(term) ||
        b.subtitle.toLowerCase().includes(term) ||
        b.location.toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });

    switch (this.sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-high':
        result.sort((a, b) => b.total - a.total);
        break;
      case 'amount-low':
        result.sort((a, b) => a.total - b.total);
        break;
    }

    return result;
  }

  get statusCounts(): Record<FilterTab, number> {
    return {
      ALL: this.bookings.length,
      CONFIRMED: this.bookings.filter((b) => b.status === 'CONFIRMED').length,
      PENDING: this.bookings.filter((b) => b.status === 'PENDING').length,
      COMPLETED: this.bookings.filter((b) => b.status === 'COMPLETED').length,
      CANCELLED: this.bookings.filter((b) => b.status === 'CANCELLED').length,
      REFUNDED: this.bookings.filter((b) => b.status === 'REFUNDED').length,
    };
  }

  get totalSpentSummary(): string {
    const totals = this.bookings
      .filter((booking) => booking.paid)
      .reduce((amounts, booking) => {
        amounts.set(booking.currency, (amounts.get(booking.currency) ?? 0) + booking.total);
        return amounts;
      }, new Map<string, number>());

    return totals.size
      ? [...totals].map(([currency, amount]) => this.formatCurrency(amount, currency)).join(' · ')
      : this.formatCurrency(0);
  }

  get upcomingCount(): number {
    const now = new Date();
    return this.bookings.filter(
      (b) => new Date(b.date) > now && b.status !== 'CANCELLED' && b.status !== 'REFUNDED'
    ).length;
  }

  get completionPercent(): number {
    if (!this.bookings.length) return 0;
    return Math.round((this.statusCounts.COMPLETED / this.bookings.length) * 100);
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════════════ */
  setTab(tab: FilterTab): void {
    this.activeTab = tab;
    this.revealedCards.clear();
    setTimeout(() => this.revealVisible(), 50);
  }

  openCancelDialog(b: Booking): void {
    this.dialog = { open: true, action: 'cancel', booking: b };
    document.body.style.overflow = 'hidden';
  }

  openDeleteDialog(b: Booking): void {
    this.dialog = { open: true, action: 'delete', booking: b };
    document.body.style.overflow = 'hidden';
  }

  openRebookDialog(b: Booking): void {
    this.dialog = { open: true, action: 'rebook', booking: b };
    document.body.style.overflow = 'hidden';
  }

  closeDialog(): void {
    this.dialog = { open: false, action: null, booking: null };
    document.body.style.overflow = '';
  }


  confirmAction(): void {
    const { action, booking } = this.dialog;

    if (!action || !booking) return;

    if (action === 'cancel') {
      if (booking.managedBookingId == null) {
        this.showToast(
          'This booking is not connected to the backend.',
          'danger',
        );
        this.closeDialog();
        return;
      }

      this.bookingService.cancelBooking(booking.managedBookingId).subscribe({
        next: (updatedBooking) => {
          this.bookings = this.bookings.map((item) =>
            item.managedBookingId === booking.managedBookingId
              ? {
                ...item,
                status: updatedBooking.bookingStatus,
                notes: 'Booking cancelled by customer',
                meta: item.meta.map((metaItem) =>
                  metaItem.label === 'Status'
                    ? { ...metaItem, value: updatedBooking.bookingStatus }
                    : metaItem,
                ),
              }
              : item,
          );

          this.showToast(
            `${booking.reference} cancelled successfully.`,
            'success',
          );
          this.closeDialog();
        },
        error: () => {
          this.showToast(
            'Booking cancellation failed. Only eligible bookings can be cancelled.',
            'danger',
          );
          this.closeDialog();
        },
      });

      return;
    }

    if (action === 'delete') {
      if (booking.managedBookingId == null) {
        this.showToast(
          'This booking is not connected to the backend.',
          'danger',
        );
        this.closeDialog();
        return;
      }

      this.bookingService.deleteBooking(booking.managedBookingId).subscribe({
        next: () => {
          this.bookings = this.bookings.filter(
            (item) => item.managedBookingId !== booking.managedBookingId,
          );

          this.showToast(
            `${booking.reference} deleted successfully.`,
            'success',
          );
          this.closeDialog();
        },
        error: () => {
          this.showToast(
            'Booking could not be deleted. Cancel it first and check whether payment records exist.',
            'danger',
          );
          this.closeDialog();
        },
      });

      return;
    }

    if (action === 'rebook') {
      this.closeDialog();

      this.router.navigate(['/booking'], {
        queryParams: {
          type: this.getBookingTypeForRebook(booking.category),
          itemId: booking.itemId,
        },
      });
    }
  }


  private showToast(message: string, type: 'success' | 'info' | 'danger'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
    }, 3200);
  }

  /* ─── Navigation ─── */
  viewDetails(b: Booking): void {
    this.router.navigate(['/booking-details'], {
      queryParams: { ref: b.reference },
    });
  }

  payNow(b: Booking): void {
    this.router.navigate(['/payment'], {
      queryParams: { bookingReference: b.reference, amount: b.total },
    });
  }

  writeReview(b: Booking): void {
    this.router.navigate(['/review-rating'], {
      queryParams: { ref: b.reference },
    });
  }

  downloadInvoice(b: Booking): void {
    this.invoiceService.getAll().subscribe({
      next: (invoices) => {
        const invoice = invoices.find((record) => record.bookingId === b.managedBookingId);
        if (!invoice) {
          this.showToast('No invoice has been issued for this booking yet.', 'info');
          return;
        }
        this.invoiceService.downloadPdf(invoice.id).subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${invoice.invoiceNumber}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
          },
          error: () => this.showToast('Invoice PDF could not be downloaded.', 'danger'),
        });
      },
      error: () => this.showToast('Invoice records could not be loaded.', 'danger'),
    });
  }

  async shareBooking(b: Booking): Promise<void> {
    const url = new URL('/booking-details', window.location.origin);
    url.searchParams.set('ref', b.reference);
    const shareData = {
      title: `TRAVIXA booking ${b.reference}`,
      text: `View booking ${b.reference} in TRAVIXA.`,
      url: url.toString(),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.showToast('Booking link shared.', 'success');
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
          this.showToast('Booking link could not be shared.', 'danger');
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      this.showToast('Booking link copied.', 'success');
    } catch {
      this.showToast('Booking link could not be copied on this browser.', 'danger');
    }
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
  goToPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }
  goToDestinations(): void {
    this.router.navigate(['/destinations']);
  }
  goToPackages(): void {
    this.router.navigate(['/tour-packages']);
  }

  private loadManagedBookings(records: BookingRecord[]): void {
    this.bookings = records.map((booking) => this.toViewBooking(booking));
  }

  private toViewBooking(booking: BookingRecord): Booking {
    const category: BookingCategory = booking.bookingType === 'TOUR_PACKAGE' ? 'TOUR' : booking.bookingType;
    const label = this.getCategoryLabel(category);
    const primaryDateLabel =
      category === 'HOTEL'
        ? 'Check-in'
        : category === 'RESTAURANT'
          ? 'Reservation'
          : category === 'TRANSPORT'
            ? 'Departure'
            : 'Travel date';
    return {
      id: 1_000_000_000 + booking.id,
      managedBookingId: booking.id,
      reference: booking.bookingReference,
      category,
      title: booking.serviceName || label,
      subtitle: `${label} · TRAVIXA booking`,
      location: booking.hotelDetails
        ? [booking.hotelDetails.destinationName, booking.hotelDetails.destinationRegion, booking.hotelDetails.address].filter(Boolean).join(' · ')
        : '—',
      image: booking.hotelDetails?.hotelImageUrl || booking.hotelDetails?.roomImageUrl || '',
      itemId: booking.itemId,
      status: booking.bookingStatus,
      date: booking.startDate || booking.bookingDate,
      endDate: booking.endDate,
      guests: booking.guestCount,
      guestsLabel: `${booking.guestCount} ${booking.guestCount === 1 ? 'Guest' : 'Guests'}`,
      total: booking.totalAmount,
      currency: booking.currency || 'BDT',
      paid: booking.paymentStatus === 'PAID' || booking.paymentStatus === 'PARTIALLY_REFUNDED',
      notes: booking.cancellationReason,
      bookedOn: booking.createdAt || booking.bookingDate,
      primaryDateLabel,
      meta: [
        { label: 'Payment', value: booking.paymentStatus.replace('_', ' ') },
        { label: 'Status', value: booking.bookingStatus },
      ],
    };
  }
  private getBookingTypeForRebook(category: BookingCategory): string {
    return category === 'TOUR' ? 'TOUR_PACKAGE' : category;
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */
  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(amount: number, currency = 'BDT'): string {
    return `${currency} ${amount.toLocaleString('en-BD')}`;
  }

  getCategoryIcon(cat: BookingCategory): string {
    return {
      HOTEL: '🏨',
      TOUR: '🏔',
      RESTAURANT: '🍽️',
      TRANSPORT: '🚌',
      TOUR_GUIDE: '🧭',
    }[cat];
  }

  getCategoryLabel(cat: BookingCategory): string {
    return {
      HOTEL: 'Hotel Stay',
      TOUR: 'Tour Experience',
      RESTAURANT: 'Dining Reservation',
      TRANSPORT: 'Transport Journey',
      TOUR_GUIDE: 'Tour Guide Service',
    }[cat];
  }

  getStatusLabel(status: BookingStatus): string {
    return {
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      PENDING: 'Pending',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
    }[status];
  }

  getStatusIcon(status: BookingStatus): string {
    return {
      CONFIRMED: '●',
      COMPLETED: '✓',
      PENDING: '◐',
      CANCELLED: '×',
      REFUNDED: '↩',
    }[status];
  }

  /** approximate nights/days for meta display */
  getNights(b: Booking): number {
    if (!b.endDate) return 0;
    const d1 = new Date(b.date).getTime();
    const d2 = new Date(b.endDate).getTime();
    return Math.max(1, Math.round((d2 - d1) / 86400000));
  }
}
