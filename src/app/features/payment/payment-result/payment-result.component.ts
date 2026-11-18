import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { InvoiceService, InvoiceRecord } from '../../../core/services/invoice.service';
import { Booking } from '../../../shared/models/booking';
import { Payment } from '../../../shared/models/payment';
import { forkJoin } from 'rxjs';

interface PaymentReceipt {
  reference: string;
  invoiceNumber: string;
  transactionId: string;
  paymentDate: string;
  paymentStatus: string;
  serviceName: string;
  serviceType: string;
  amount: number;
  currency: string;
  travelerName: string;
  travelerEmail: string;
}

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-result.component.html',
  styleUrl: './payment-result.component.scss',
})
export class PaymentResultComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly authService = inject(AuthService);

  loading = true;
  errorMessage = '';
  receipt: PaymentReceipt | null = null;
  private invoiceId: number | null = null;

constructor() {
  this.route.queryParamMap.subscribe((params) => {
    const reference =
      params.get('ref') || params.get('bookingReference');

    if (!reference) {
      this.loading = false;
      this.errorMessage =
        'Choose a paid booking to view its payment receipt.';
      return;
    }

    forkJoin({
      booking: this.bookingService.getByReference(reference),
      payments: this.paymentService.getAll(),
      invoices: this.invoiceService.getAll(),
    }).subscribe({
      next: ({ booking, payments, invoices }) => {
        if (booking.paymentStatus !== 'PAID') {
          this.loading = false;
          this.errorMessage =
            'Payment is still pending for this booking.';
          return;
        }

        const payment = payments.find((item) => item.bookingId === booking.id && item.status === 'SUCCEEDED');
        const invoice = invoices.find((item) => item.bookingId === booking.id && item.status === 'PAID');
        if (!payment || !invoice) {
          this.loading = false;
          this.errorMessage = 'The payment or invoice record is not available yet.';
          return;
        }
        this.receipt = this.toReceipt(booking, payment, invoice);
        this.invoiceId = invoice.id;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage =
          'This payment receipt is unavailable in the current session.';
      },
    });
  });
}

  printReceipt(): void {
    document.body.classList.add('travixa-payment-print');
    window.addEventListener(
      'afterprint',
      () => document.body.classList.remove('travixa-payment-print'),
      { once: true },
    );
    window.print();
  }

  downloadReceipt(): void {
    if (!this.receipt || this.invoiceId === null) return;
    this.invoiceService.downloadPdf(this.invoiceId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${this.receipt!.invoiceNumber}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.errorMessage = 'Invoice PDF could not be downloaded.'; },
    });
  }

  viewBooking(): void {
    if (this.receipt) {
      this.router.navigate(['/booking-details'], {
        queryParams: { ref: this.receipt.reference },
      });
    }
  }

  private toReceipt(booking: Booking, payment: Payment, invoice: InvoiceRecord): PaymentReceipt {
    const currentUser = this.authService.getCurrentUser();
    return {
      reference: booking.bookingReference,
      invoiceNumber: invoice.invoiceNumber,
      transactionId: payment.referenceNumber,
      paymentDate: new Date(payment.paidAt || invoice.issuedOn).toLocaleDateString(
        'en-GB',
        { day: '2-digit', month: 'long', year: 'numeric' },
      ),
      paymentStatus: 'Paid',
      serviceName: booking.serviceName || this.formatServiceType(booking.bookingType),
      serviceType: this.formatServiceType(booking.bookingType),
      amount: invoice.totalAmount,
      currency: invoice.currency,
      travelerName: currentUser?.name || 'TRAVIXA Traveler',
      travelerEmail: currentUser?.email || '—',
    };
  }

  private formatServiceType(type: Booking['bookingType']): string {
    return {
      HOTEL: 'Hotel stay',
      TOUR_PACKAGE: 'Tour package',
      RESTAURANT: 'Restaurant reservation',
      TRANSPORT: 'Transport booking',
      TOUR_GUIDE: 'Tour guide service',
    }[type];
  }
}
