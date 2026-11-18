import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Booking } from '../../../shared/models/booking';
import { Payment } from '../../../shared/models/payment';

type Operation = 'BOOKINGS' | 'PAYMENTS' | 'COUPONS';
interface OperationRecord { icon: string; title: string; reference: string; detail: string; amount: string; status: string; bookingId?: number; }

@Component({
  selector: 'app-operations-console',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ops-page">
      <header>
        <p>ADMIN OPERATIONS</p>
        <h1>{{ title }}</h1>
        <span>{{ description }}</span>
      </header>
      <section class="ops-stats">
        <article>
          <small>OPEN ITEMS</small><strong>{{ records.length }}</strong>
        </article>
        <article>
          <small>TODAY</small><strong>{{ todayValue }}</strong>
        </article>
        <article>
          <small>STATUS</small><strong class="healthy">Operational</strong>
        </article>
      </section>
      <section class="ops-panel">
        <div class="ops-panel__head">
          <div>
            <p>{{ sectionLabel }}</p>
            <h2>Operational queue</h2>
          </div>
        </div>
        @if (error) { <p role="alert">{{ error }}</p> }
        @if (loading) { <p role="status">Loading records from the API…</p> }
        <div class="ops-table">
          <article *ngFor="let record of records">
            <div class="record-mark">{{ record.icon }}</div>
            <div>
              <strong>{{ record.title }}</strong
              ><small>{{ record.reference }} · {{ record.detail }}</small>
            </div>
            <b>{{ record.amount }}</b
            ><span class="status">{{ record.status }}</span>
            <button *ngIf="operation === 'BOOKINGS' && record.bookingId" type="button" (click)="viewBooking(record.bookingId)">Details</button>
          </article>
          <p *ngIf="!loading && !error && records.length === 0">{{ emptyMessage }}</p>
        </div>
        <p *ngIf="detailError" role="alert">{{ detailError }}</p>
        <p *ngIf="detailMessage" role="status">{{ detailMessage }}</p>
        <section *ngIf="selectedBooking as booking" class="booking-detail" aria-live="polite">
          <header class="booking-detail__header">
            <div><p>BOOKING DETAILS</p><h2>{{ booking.bookingReference }}</h2></div>
            <button type="button" (click)="selectedBooking = null">Close</button>
          </header>
          <div class="booking-detail__grid">
            <p><strong>Customer</strong><span>{{ booking.customerName || '—' }}</span></p>
            <p><strong>Contact</strong><span>{{ booking.customerEmail || '—' }}</span></p>
            <p><strong>Service</strong><span>{{ booking.serviceName || booking.bookingType }}</span></p>
            <p><strong>Dates</strong><span>{{ booking.startDate || '—' }}{{ booking.endDate ? ' to ' + booking.endDate : '' }}</span></p>
            <p><strong>Guests</strong><span>{{ booking.guestCount }}</span></p>
            <p><strong>Booking status</strong><span>{{ booking.bookingStatus }}</span></p>
            <p><strong>Payment status</strong><span>{{ booking.paymentStatus }}</span></p>
            <p><strong>Total</strong><span>{{ booking.currency || 'BDT' }} {{ booking.totalAmount | number:'1.2-2' }}</span></p>
          </div>
          <div *ngIf="booking.items?.length" class="booking-detail__items">
            <h3>Booked inventory</h3>
            <p *ngFor="let item of booking.items">{{ item.description }} · {{ item.quantity }} × {{ item.currency }} {{ item.unitPrice | number:'1.2-2' }}</p>
          </div>
          <div *ngIf="booking.guests?.length" class="booking-detail__items">
            <h3>Travel companions</h3>
            <p *ngFor="let guest of booking.guests">{{ guest.fullName }}{{ guest.leadGuest ? ' · Lead guest' : '' }}{{ guest.email ? ' · ' + guest.email : '' }}{{ guest.phoneNumber ? ' · ' + guest.phoneNumber : '' }}</p>
          </div>
          <p *ngIf="booking.personalTouch" class="booking-detail__request"><strong>Personal touch:</strong> {{ booking.personalTouch }}</p>
          <p *ngIf="booking.specialRequest" class="booking-detail__request"><strong>Special request:</strong> {{ booking.specialRequest }}</p>
          <button *ngIf="operation === 'BOOKINGS' && booking.bookingStatus === 'PENDING'" type="button" class="booking-detail__cancel" (click)="cancelSelectedPendingBooking()">Cancel pending booking</button>
        </section>
      </section>
      <p class="note">{{ note }}</p>
    </section>
  `,
  styles: [
    `
      .ops-page {
        min-height: calc(100vh - 76px);
        padding: 5.5rem clamp(1.2rem, 4vw, 4rem) 4rem;
        background:
          radial-gradient(
            circle at 92% 0,
            rgba(139, 92, 246, 0.13),
            transparent 28%
          ),
          var(--color-bg, #f8fafc);
        color: var(--color-text, #334155);
      }
      header p,
      .ops-panel__head p {
        margin: 0;
        color: #7c3aed;
        font: 800 0.65rem var(--font-mono, monospace);
        letter-spacing: 0.15em;
      }
      h1 {
        margin: 0.55rem 0;
        color: var(--color-heading, #0f172a);
        font: 800 clamp(2.2rem, 5vw, 4rem)/1 var(--font-display, serif);
      }
      header > span {
        color: var(--color-muted, #64748b);
        line-height: 1.6;
      }
      .ops-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin: 2rem 0 1rem;
      }
      .ops-stats article,
      .ops-panel {
        padding: 1.25rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 1.1rem;
        background: var(--color-surface, #fff);
        box-shadow: var(--shadow-sm);
      }
      .ops-stats small {
        color: var(--color-muted, #64748b);
        font: 800 0.65rem var(--font-mono, monospace);
        letter-spacing: 0.1em;
      }
      .ops-stats strong {
        display: block;
        margin-top: 0.35rem;
        color: var(--color-heading, #0f172a);
        font: 800 2rem var(--font-display, serif);
      }
      .ops-stats .healthy {
        color: #059669;
        font-size: 1.2rem;
      }
      .ops-panel__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }
      .ops-panel h2 {
        margin: 0.3rem 0 0;
        color: var(--color-heading, #0f172a);
        font: 800 1.45rem var(--font-display, serif);
      }
      button {
        border: 0;
        border-radius: 0.65rem;
        padding: 0.63rem 0.76rem;
        color: #fff;
        background: #6d28d9;
        font: 800 0.7rem var(--font-body, sans-serif);
        cursor: pointer;
      }
      .ops-table {
        margin-top: 1rem;
      }
      .ops-table article {
        display: grid;
        grid-template-columns: 2.3rem 1fr auto auto;
        align-items: center;
        gap: 0.8rem;
        padding: 0.9rem 0;
        border-top: 1px solid var(--color-border, #e2e8f0);
      }
      .record-mark {
        display: grid;
        place-items: center;
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.65rem;
        background: #f3e8ff;
        color: #7e22ce;
      }
      .ops-table strong,
      .ops-table small {
        display: block;
      }
      .ops-table small {
        margin-top: 0.18rem;
        color: var(--color-muted, #64748b);
        font-size: 0.72rem;
      }
      .status {
        display: inline-block;
        background: #ecfdf5;
        color: #047857;
        border-radius: 0.65rem;
        padding: 0.63rem 0.76rem;
        font-size: 0.7rem;
      }
      .note {
        margin: 1rem 0;
        color: var(--color-muted, #64748b);
        font-size: 0.76rem;
        line-height: 1.6;
      }
      :host-context([data-theme='dark']) .ops-stats article,
      :host-context([data-theme='dark']) .ops-panel {
        background: #0d1a2b;
      }
      :host-context([data-theme='dark']) h1,
      :host-context([data-theme='dark']) .ops-panel h2,
      :host-context([data-theme='dark']) .ops-stats strong {
        color: #f8fafc;
      }
      .booking-detail {
        margin-top: 1.25rem;
        padding: 1.25rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 1rem;
        background: var(--color-bg, #f8fafc);
      }
      .booking-detail__header,
      .booking-detail__grid p {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .booking-detail__header { align-items: center; }
      .booking-detail__header p { margin: 0; color: #7c3aed; font-size: .68rem; font-weight: 800; letter-spacing: .12em; }
      .booking-detail__header h2 { margin: .3rem 0 0; }
      .booking-detail__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .2rem 1.5rem; margin-top: 1rem; }
      .booking-detail__grid p { margin: .35rem 0; }
      .booking-detail__grid strong { color: var(--color-heading, #0f172a); }
      .booking-detail__items { margin-top: 1rem; }
      .booking-detail__items h3 { font-size: 1rem; }
      .booking-detail__items p, .booking-detail__request { margin: .35rem 0; color: var(--color-muted, #64748b); }
      .booking-detail__cancel { margin-top: 1rem; background: #b42318; }
      @media (max-width: 750px) {
        .ops-page {
          padding-top: 5.2rem;
        }
        .ops-stats {
          grid-template-columns: 1fr;
        }
        .ops-panel__head {
          align-items: start;
          flex-direction: column;
        }
        .ops-table article {
          grid-template-columns: 2.3rem 1fr auto;
        }
        .ops-table article > b {
          display: none;
        }
      }
      @media (max-width: 650px) {
        .booking-detail__grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class OperationsConsoleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  readonly operation = (this.route.snapshot.data['operation'] ??
    'BOOKINGS') as Operation;
  records: OperationRecord[] = [];
  loading = true;
  error = '';
  selectedBooking: Booking | null = null;
  detailError = '';
  detailMessage = '';
  private todayCount = 0;
  private todaySuccessfulPaymentTotal = 0;
  ngOnInit(): void { this.loadRecords(); }
  viewBooking(id: number): void {
    this.detailError = '';
    this.detailMessage = '';
    this.selectedBooking = null;
    this.bookingService.getById(id).subscribe({
      next: (booking) => { this.selectedBooking = booking; },
      error: () => { this.detailError = 'Booking details could not be loaded for your admin account.'; },
    });
  }
  cancelSelectedPendingBooking(): void {
    const booking = this.selectedBooking;
    if (!booking || booking.bookingStatus !== 'PENDING') return;
    if (!window.confirm(`Cancel pending booking ${booking.bookingReference}?`)) return;
    this.detailError = '';
    this.bookingService.cancelBooking(booking.id).subscribe({
      next: (updated) => {
        this.selectedBooking = updated;
        this.detailMessage = `Booking ${updated.bookingReference} was cancelled.`;
        this.loadRecords();
      },
      error: (error: { error?: { message?: string } }) => {
        this.detailError = error?.error?.message ?? 'This booking could not be cancelled.';
      },
    });
  }
  get title(): string {
    return {
      BOOKINGS: 'Booking management',
      PAYMENTS: 'Payment management',
      COUPONS: 'Coupon management',
    }[this.operation];
  }
  get description(): string {
    return {
      BOOKINGS: 'Review booking lifecycle signals across the platform.',
      PAYMENTS:
        'Monitor payment state, refund-ready records and gateway reconciliation.',
      COUPONS:
        'Prepare campaign codes and promotional rules for the booking engine.',
    }[this.operation];
  }
  get sectionLabel(): string {
    return {
      BOOKINGS: 'BOOKING QUEUE',
      PAYMENTS: 'PAYMENT QUEUE',
      COUPONS: 'CAMPAIGN QUEUE',
    }[this.operation];
  }
  get todayValue(): string {
    return this.operation === 'PAYMENTS'
      ? `${this.todaySuccessfulPaymentTotal.toLocaleString('en-BD')} BDT paid`
      : this.operation === 'COUPONS'
        ? 'Unavailable'
        : `${this.todayCount} today`;
  }
  get emptyMessage(): string {
    return this.operation === 'COUPONS'
      ? 'Coupon management is unavailable because no coupon API is configured.'
      : `No ${this.operation.toLowerCase()} were returned by the API.`;
  }
  get note(): string {
    return this.operation === 'COUPONS'
      ? 'No coupon API is currently available.'
      : 'Records are read from the backend. Use booking or payment detail pages for supported actions.';
  }
  private loadRecords(): void {
    this.loading = true;
    this.error = '';
    if (this.operation === 'COUPONS') { this.loading = false; return; }
    const source: Observable<Booking[] | Payment[]> = this.operation === 'PAYMENTS'
      ? this.paymentService.getAll()
      : this.bookingService.getAll();
    source.subscribe({
      next: (items: Booking[] | Payment[]) => {
        if (this.operation === 'PAYMENTS') {
          const payments = items as Payment[];
          const today = new Date().toDateString();
          this.todaySuccessfulPaymentTotal = payments.filter((item) => item.status === 'SUCCEEDED' && item.paidAt && new Date(item.paidAt).toDateString() === today).reduce((sum, item) => sum + item.amount, 0);
          this.records = payments.map((item) => ({ icon: '৳', title: `Payment ${item.status.toLowerCase()}`, reference: item.referenceNumber, detail: `Booking #${item.bookingId} · ${item.method}`, amount: `${item.amount} ${item.currency}`, status: item.status }));
        } else {
          const bookings = items as Booking[];
          const today = new Date().toDateString();
          this.todayCount = bookings.filter((item) => new Date(item.createdAt || item.bookingDate).toDateString() === today).length;
          this.records = bookings.map((item) => ({ icon: '□', title: item.serviceName || `${item.bookingType} booking`, reference: item.bookingReference, detail: `${item.guestCount} guest(s)`, amount: `${item.totalAmount} ${item.currency || 'BDT'}`, status: item.bookingStatus, bookingId: item.id }));
        }
        this.loading = false;
      },
      error: (error: { error?: { message?: string } }) => { this.error = error?.error?.message ?? 'Could not load records from the API.'; this.loading = false; },
    });
  }
}
