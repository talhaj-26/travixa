import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Booking as BookingRecord } from '../../../shared/models/booking';
import { BookingService } from '../../../core/services/booking.service';
import { InvoiceService } from '../../../core/services/invoice.service';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
type BookingStatus = 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
type BookingCategory =
  | 'HOTEL'
  | 'TOUR'
  | 'RESTAURANT'
  | 'TOUR_GUIDE'
  | 'TRANSPORT';

interface TimelineEvent {
  date: string;
  time?: string;
  title: string;
  text: string;
  icon: string;
  pending?: boolean;
}

interface PriceLine {
  label: string;
  value: number;
  isDiscount?: boolean;
}

interface BookingDetails {
  bookingId: number;
  reference: string;
  status: BookingStatus;
  category: BookingCategory;
  statusLabel: string;

  /* Service */
  serviceName: string;
  serviceType: string;
  serviceLocation: string;
  serviceImage: string;
  serviceRating: number;
  serviceTags: string[];

  /* Hero stats */
  bookingDate: string;
  guestsLabel: string;
  paymentLabel: string;

  /* Info grid */
  checkIn?: string;
  checkOut?: string;
  room?: string;
  nights?: number;
  guests: string;
  cancellation: string;

  /* Customer */
  customerName: string;
  customerInitials: string;
  customerEmail: string;
  customerPhone: string;

  /* Timeline */
  timeline: TimelineEvent[];

  /* Special request */
  requestTitle: string;
  requestBody: string;

  /* Price */
  priceLines: PriceLine[];
  totalPaid: number;
  totalCurrency: string;

  /* Important notes */
  importantNotes: { label: string; value: string }[];
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.scss',
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
  /* ─── Data ─── */
  reference = '';

  booking: BookingDetails = {
    bookingId: 0,
    reference: '',
    status: 'PENDING',
    category: 'HOTEL',
    statusLabel: 'Loading',
    serviceName: '',
    serviceType: 'Hotel Stay',
    serviceLocation: '',
    serviceImage: '',
    serviceRating: 0,
    serviceTags: [],
    bookingDate: '',
    guestsLabel: '',
    paymentLabel: '',
    guests: '',
    cancellation: '',
    customerName: '',
    customerInitials: '',
    customerEmail: '',
    customerPhone: '',
    timeline: [],
    requestTitle: 'Special request',
    requestBody: '',
    priceLines: [],
    totalPaid: 0,
    totalCurrency: 'BDT',
    importantNotes: [],
  };

  /* ─── UI state ─── */
  loading = true;
  animatedTotal = 0;
  cancelDialog = { open: false };
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'danger';
  } = {
    show: false,
    message: '',
    type: 'info',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private authService: AuthService,
    private invoiceService: InvoiceService,
  ) {}

  /* ═══════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
ngOnInit(): void {
  this.route.queryParams.subscribe((params) => {
    const ref = params['ref'];

      if (ref) {
      this.reference = ref;

      this.bookingService.getByReference(ref).subscribe({
        next: (record) => {
          if (record) {
            this.booking = this.toBookingDetails(record);
            this.loadInvoiceNumber(record.id);
            this.animateTotal();
          } else {
            this.router.navigate(['/my-bookings'], { replaceUrl: true });
          }

          this.loading = false;
        },
        error: () => {
          this.router.navigate(['/my-bookings'], { replaceUrl: true });
        },
      });

      return;
    }

    this.router.navigate(['/my-bookings'], { replaceUrl: true });
  });
}

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private animateTotal(): void {
    const target = this.booking.totalPaid;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.animatedTotal = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else this.animatedTotal = target;
    };
    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════════════ */
  downloadConfirmation(): void {
    if (!this.booking.bookingId) return;
    this.invoiceService.getAll().subscribe({
      next: (invoices) => {
        const invoice = invoices.find((record) => record.bookingId === this.booking.bookingId);
        if (!invoice) {
          this.showToast('The invoice is not available for this booking yet.', 'info');
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
          error: () => this.showToast('The booking invoice could not be downloaded.', 'danger'),
        });
      },
      error: () => this.showToast('The booking invoice could not be loaded.', 'danger'),
    });
  }

  shareBooking(): void {
    const url = new URL('/booking-details', window.location.origin);
    url.searchParams.set('ref', this.booking.reference);
    if (navigator.share) {
      void navigator.share({ title: `TRAVIXA booking ${this.booking.reference}`, url: url.toString() })
        .catch(() => this.showToast('Sharing was cancelled.', 'info'));
      return;
    }
    void navigator.clipboard.writeText(url.toString()).then(
      () => this.showToast('Booking link copied.', 'success'),
      () => this.showToast('The booking link could not be copied.', 'danger'),
    );
  }

  private loadInvoiceNumber(bookingId: number): void {
    this.invoiceService.getAll().subscribe({
      next: (invoices) => {
        const invoice = invoices.find((record) => record.bookingId === bookingId);
        if (invoice) {
          this.booking.importantNotes = this.booking.importantNotes.map((note) =>
            note.label === 'Invoice' ? { ...note, value: invoice.invoiceNumber } : note,
          );
        }
      },
    });
  }

  openCancelDialog(): void {
    this.cancelDialog = { open: true };
    document.body.style.overflow = 'hidden';
  }

  closeCancelDialog(): void {
    this.cancelDialog = { open: false };
    document.body.style.overflow = '';
  }

confirmCancel(): void {
  this.bookingService.getByReference(this.booking.reference).subscribe({
    next: (record) => {
      if (!record) {
        this.closeCancelDialog();
        this.showToast('Booking not found.', 'danger');
        return;
      }

      this.bookingService.cancelBooking(record.id).subscribe({
        next: (updated) => {
          this.booking = this.toBookingDetails(updated);
          this.closeCancelDialog();
          this.showToast(
            `Booking ${this.booking.reference} cancelled successfully.`,
            'success',
          );
        },
        error: () => {
          this.closeCancelDialog();
          this.showToast(
            'Cancellation failed. Only eligible bookings can be cancelled.',
            'danger',
          );
        },
      });
    },
    error: () => {
      this.closeCancelDialog();
      this.showToast('Unable to find this booking.', 'danger');
    },
  });
}

  private showToast(
    message: string,
    type: 'success' | 'info' | 'danger',
  ): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
    }, 3200);
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════ */
  goToMyBookings(): void {
    this.router.navigate(['/my-bookings']);
  }

  goToSupport(): void {
    this.router.navigate(['/support']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }

  goToTourPackages(): void {
    this.router.navigate(['/tour-packages']);
  }

  goToPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }

  private toBookingDetails(record: BookingRecord): BookingDetails {
    const currentUser = this.authService.getCurrentUser();
    const category = record.bookingType === 'TOUR_PACKAGE' ? 'TOUR' : record.bookingType;
    const isHotel = category === 'HOTEL';
    const isPaid = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(record.paymentStatus);
    const paymentTimelineText = record.paymentStatus === 'REFUNDED'
      ? 'The payment for this booking was refunded.'
      : record.paymentStatus === 'PARTIALLY_REFUNDED'
        ? 'A partial refund was recorded for this payment.'
        : isPaid
          ? `Transaction ${record.paymentTransactionId || 'verified'} was recorded.`
          : 'Complete payment to confirm this reservation.';
    const bookingDate = this.formatDate(record.createdAt || record.bookingDate);
    const startDate = record.startDate || record.bookingDate;
    const endDate = record.endDate;
    const nights = endDate
      ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000))
      : undefined;
    const statusLabel = record.bookingStatus.charAt(0) + record.bookingStatus.slice(1).toLowerCase();
    const serviceType = {
      HOTEL: 'Hotel Stay',
      TOUR: 'Tour Experience',
      TOUR_GUIDE: 'Tour guide hire',
      RESTAURANT: 'Dining Reservation',
      TRANSPORT: 'Transport Booking',
    }[category];
    const image = isHotel
      ? record.hotelDetails?.roomImageUrl || record.hotelDetails?.hotelImageUrl || ''
      : '';
    const primaryGuest = record.guests?.find((guest) => guest.leadGuest) ?? record.guests?.[0];
    const customerName = primaryGuest?.fullName || record.customerName || currentUser?.name || '—';
    const initials = customerName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();

    return {
      bookingId: record.id,
      reference: record.bookingReference,
      status: record.bookingStatus,
      category,
      statusLabel,
      serviceName: record.serviceName || serviceType,
      serviceType,
      serviceLocation: record.hotelDetails
        ? [record.hotelDetails.hotelName, record.hotelDetails.destinationName, record.hotelDetails.address].filter(Boolean).join(' · ')
        : '—',
      serviceImage: image,
      serviceRating: record.hotelDetails?.starRating ?? 0,
      serviceTags: [record.paymentStatus.replace('_', ' '), `${record.guestCount} guest${record.guestCount === 1 ? '' : 's'}`,
        ...(record.hotelDetails ? [record.hotelDetails.destinationName, record.hotelDetails.roomTypeName] : [])],
      bookingDate,
      guestsLabel: `${record.guestCount} guest${record.guestCount === 1 ? '' : 's'}`,
      paymentLabel: record.paymentStatus.replace('_', ' '),
      checkIn: isHotel
        ? `${this.formatDate(startDate)}${this.formatTime(record.hotelDetails?.checkInTime) ? ` · from ${this.formatTime(record.hotelDetails?.checkInTime)}` : ''}`
        : undefined,
      checkOut: isHotel && endDate
        ? `${this.formatDate(endDate)}${this.formatTime(record.hotelDetails?.checkOutTime) ? ` · by ${this.formatTime(record.hotelDetails?.checkOutTime)}` : ''}`
        : undefined,
      room: isHotel && record.hotelDetails
        ? [record.hotelDetails.roomTypeName, `Room ${record.hotelDetails.roomNumber}`,
          record.hotelDetails.floorLabel, record.hotelDetails.viewDescription].filter(Boolean).join(' · ')
        : isHotel ? 'Room allocation confirmed by property' : undefined,
      nights,
      guests: `${record.guestCount} guest${record.guestCount === 1 ? '' : 's'}`,
      cancellation: record.bookingStatus === 'CANCELLED'
        ? record.cancellationReason || 'Booking cancelled'
        : record.hotelDetails?.cancellationPolicy?.trim() || 'Cancellation terms were not supplied.',
      customerName,
      customerInitials: initials || 'T',
      customerEmail: primaryGuest?.email || record.customerEmail || currentUser?.email || '—',
      customerPhone: primaryGuest?.phoneNumber || currentUser?.phone || '—',
      timeline: [
        { date: bookingDate, title: 'Booking created', text: 'Your reservation request was created in TRAVIXA.', icon: '✎' },
        {
          date: isPaid ? bookingDate : 'Awaiting payment',
          title: isPaid ? 'Payment received' : 'Payment pending',
          text: paymentTimelineText,
          icon: isPaid ? '৳' : '◐',
          pending: !isPaid,
        },
        {
          date: statusLabel,
          title: `Booking ${statusLabel.toLowerCase()}`,
          text: record.bookingStatus === 'CANCELLED' ? record.cancellationReason || 'Cancellation was requested.' : 'Your booking status is up to date.',
          icon: record.bookingStatus === 'CANCELLED' ? '×' : '✓',
          pending: record.bookingStatus === 'PENDING',
        },
      ],
      requestTitle: 'Special request',
      requestBody: [record.personalTouch ? `Personal touch: ${record.personalTouch}` : '', record.specialRequest ? `Special request: ${record.specialRequest}` : ''].filter(Boolean).join('\n') || 'No optional preferences or special requests were provided.',
      priceLines: [
        ...(record.subtotalAmount != null ? [{ label: 'Subtotal', value: record.subtotalAmount }] : []),
        ...(record.discountAmount ? [{ label: record.couponCode ? `Promo (${record.couponCode})` : 'Discount', value: record.discountAmount, isDiscount: true }] : []),
        { label: 'Total payable', value: record.totalAmount },
      ],
      totalPaid: record.totalAmount,
      totalCurrency: record.currency || 'BDT',
      importantNotes: [
        { label: 'Payment', value: record.paymentStatus.replace('_', ' ') },
        { label: 'Invoice', value: record.invoiceNumber || 'Generated after payment confirmation' },
        { label: 'Support', value: 'TRAVIXA 24/7' },
      ],
    };
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatTime(value: string | null | undefined): string {
    return value ? value.slice(0, 5) : '';
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */
  formatCurrency(amount: number): string {
    return `${this.booking.totalCurrency}${amount.toLocaleString('en-BD')}`;
  }

  getStatusIcon(status: BookingStatus): string {
    return {
      CONFIRMED: '✓',
      PENDING: '◐',
      COMPLETED: '★',
      CANCELLED: '×',
      REFUNDED: '↶',
    }[status];
  }

  getCategoryIcon(cat: BookingCategory): string {
    return {
      HOTEL: '🏨',
      TOUR: '🧳',
      RESTAURANT: '🍽️',
      TOUR_GUIDE: '🧭',
      TRANSPORT: '🚌',
    }[cat];
  }
}
