
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { RefundService } from '../../../core/services/refund.service';
import { Payment } from '../../../shared/models/payment';
import { Booking } from '../../../shared/models/booking';
import {
  CreateRefundRequest,
  RefundRequest,
  RefundRequestStatus,
} from '../../../shared/models/refund';

type RefundReason =
  | 'CUSTOMER_REQUEST'
  | 'SERVICE_CANCELLED'
  | 'DUPLICATE_PAYMENT'
  | 'BOOKING_ERROR'
  | 'OTHER';

@Component({
  selector: 'app-refund-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refund-management.component.html',
  styleUrl: './refund-management.component.scss',
})
export class RefundManagementComponent implements OnInit {
  isManagementMode = false;
  selectedPayment?: Payment;
  selectedBooking?: Booking;
  refundAmount = 0;
  reason: RefundReason = 'CUSTOMER_REQUEST';
  customerNote = '';
  rejectionReason = '';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  selectedRequest?: RefundRequest;

  payments: Payment[] = [];
  requests: RefundRequest[] = [];
  bookings: Booking[] = [];

  readonly reasons = [
    { value: 'CUSTOMER_REQUEST' as RefundReason, label: 'Customer request' },
    { value: 'SERVICE_CANCELLED' as RefundReason, label: 'Service cancelled' },
    { value: 'DUPLICATE_PAYMENT' as RefundReason, label: 'Duplicate payment' },
    { value: 'BOOKING_ERROR' as RefundReason, label: 'Booking error' },
    { value: 'OTHER' as RefundReason, label: 'Other' },
  ];

  readonly statusLabels: Record<RefundRequestStatus, string> = {
    REQUESTED: 'Requested',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly bookingService: BookingService,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
  ) { }

  ngOnInit(): void {
    this.isManagementMode = this.route.snapshot.data['management'] === true;
    this.refresh();

    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref) {
      this.bookingService.getByReference(ref).subscribe({
        next: (booking) => {
          this.selectedBooking = booking;
          this.payments.find((payment) => payment.bookingId === booking.id)
            && this.selectPayment(
              this.payments.find((payment) => payment.bookingId === booking.id)!,
            );
        },
        error: () => {
          this.errorMessage = 'Booking was not found.';
        },
      });
    }
  }

  refresh(): void {
    forkJoin({
      payments: this.paymentService.getAll(),
      requests: this.refundService.getAll(),
      bookings: this.bookingService.getAll(),
    }).subscribe({
      next: ({ payments, requests, bookings }) => {
        this.payments = payments;
        this.requests = requests;
        this.bookings = bookings;
      },
      error: () => {
        this.errorMessage = 'Could not load payment and refund records.';
      },
    });
  }

  prepareFromBookingReference(reference: string): void {
    this.bookingService.getByReference(reference).subscribe({
      next: (booking) => {
        this.selectedBooking = booking;
        const payment = this.payments.find((item) => item.bookingId === booking.id);
        if (payment) this.selectPayment(payment);
      },
      error: () => {
        this.errorMessage = 'Booking was not found.';
      },
    });
  }

  selectPayment(payment: Payment): void {
    this.selectedPayment = payment;
    this.selectedBooking = this.bookings.find(
      (booking) => booking.id === payment.bookingId,
    );
    this.refundAmount = this.remainingRefundable(payment);
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitRequest(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedPayment || !this.selectedBooking) {
      this.errorMessage = 'Select a booking and payment first.';
      return;
    }

    if (this.selectedPayment.status !== 'SUCCEEDED') {
      this.errorMessage = 'Only successfully paid transactions can be refunded.';
      return;
    }

    if (this.selectedBooking.bookingStatus !== 'CANCELLED') {
      this.errorMessage = 'Please cancel the booking before requesting a refund.';
      return;
    }

    const request: CreateRefundRequest = {
      paymentId: this.selectedPayment.id,
      amount: Number(this.refundAmount),
      reason: `${this.reason}${this.customerNote.trim() ? `: ${this.customerNote.trim()}` : ''}`,
      idempotencyKey: crypto.randomUUID(),
    };

    this.isSubmitting = true;
    this.refundService.requestRefund(request).subscribe({
      next: (refund) => {
        this.isSubmitting = false;
        this.successMessage = `Refund request ${refund.referenceNumber} submitted.`;
        this.customerNote = '';
        this.refresh();
      },
      error: (error: { error?: { detail?: string; message?: string }; message?: string }) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.detail ||
          error.error?.message ||
          error.message ||
          'Refund request could not be submitted.';
      },
    });
  }

  processStatus(
    request: RefundRequest,
    status: RefundRequestStatus,
  ): void {
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      this.errorMessage = 'Only approval or rejection is available for review.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.refundService.updateStatus(request.id, status).subscribe({
      next: (updated) => {
        this.successMessage =
          `${updated.referenceNumber} is now ${this.statusLabels[updated.status]}.`;
        this.rejectionReason = '';
        this.refresh();
      },
      error: (error: { error?: { detail?: string; message?: string }; message?: string }) => {
        this.errorMessage =
          error.error?.detail ||
          error.error?.message ||
          error.message ||
          'Refund status could not be updated.';
      },
    });
  }

  completeDemoRefund(request: RefundRequest): void {
    if (request.status !== 'APPROVED' || !this.isDemoRefund(request)) return;
    this.errorMessage = '';
    this.refundService.completeDemo(request.id).subscribe({
      next: (updated) => {
        this.successMessage = `${updated.referenceNumber} was completed in demo mode; no external funds were transferred.`;
        this.refresh();
      },
      error: (error: { error?: { detail?: string; message?: string }; message?: string }) => {
        this.errorMessage = error.error?.detail || error.error?.message || error.message || 'Demo refund could not be completed.';
      },
    });
  }

  isDemoRefund(request: RefundRequest): boolean {
    return this.payments.some((payment) => payment.id === request.paymentId && payment.method === 'DEMO');
  }

  get eligiblePayments(): Payment[] {
    return this.payments.filter((payment) => {
      const booking = this.bookings.find(
        (item) => item.id === payment.bookingId,
      );
      return payment.status === 'SUCCEEDED' &&
        booking?.bookingStatus === 'CANCELLED';
    });
  }

  remainingRefundable(payment: Payment): number {
    const completed = this.requests
      .filter(
        (request) =>
          request.paymentId === payment.id && request.status === 'COMPLETED',
      )
      .reduce((sum, request) => sum + request.amount, 0);

    return Math.max(0, payment.amount - completed);
  }

  bookingFor(payment: Payment): Booking | undefined {
    return this.bookings.find((booking) => booking.id === payment.bookingId);
  }

  hasOpenRequest(payment: Payment): boolean {
    return this.requests.some(
      (request) =>
        request.paymentId === payment.id &&
        ['REQUESTED', 'APPROVED', 'PROCESSING'].includes(request.status),
    );
  }

  statusClass(status: RefundRequestStatus): string {
    return status.toLowerCase().replace('_', '-');
  }

  paymentReferenceFor(request: RefundRequest): string {
    const payment = this.payments.find(
      (item) => item.id === request.paymentId,
    );

    return payment?.referenceNumber ?? `Payment #${request.paymentId}`;
  }

  bookingReferenceFor(request: RefundRequest): string {
    const payment = this.payments.find(
      (item) => item.id === request.paymentId,
    );

    const booking = payment
      ? this.bookings.find((item) => item.id === payment.bookingId)
      : undefined;

    return booking?.bookingReference ?? `Booking #${payment?.bookingId ?? '—'}`;
  }
}
