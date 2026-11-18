import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { BookingService } from '../../../core/services/booking.service';

type PaymentMethod = 'DEMO' | 'CARD' | 'MOBILE_FINANCIAL_SERVICE' | 'BANK_TRANSFER';

interface PaymentForm {
  bookingReference: string;
  amount: number;
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  currency: string;
  paymentMethod: PaymentMethod;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  mobileNumber: string;
  transactionId: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent implements OnInit {
  isPaid = false;
  isDemoPayment = false;
  isSubmitting = false;
  errorMessage = '';

  payment: PaymentForm = {
    bookingReference: '',
    amount: 0,
    subtotal: 0,
    discountAmount: 0,
    couponCode: null,
    currency: 'BDT',
    paymentMethod: 'DEMO',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    mobileNumber: '',
    transactionId: '',
  };

  paymentMethods: {
    value: PaymentMethod;
    label: string;
    icon: string;
    description: string;
  }[] = [
    {
      value: 'DEMO',
      label: 'Instructor demo payment',
      icon: '🧪',
      description: 'Simulates a successful payment; no money is charged.',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.payment.bookingReference =
        params['bookingReference'] || '';

      this.payment.amount = 0;
      if (this.payment.bookingReference) {
        this.bookingService.getByReference(this.payment.bookingReference).subscribe({
          next: (booking) => {
            this.payment.amount = booking.totalAmount;
            this.payment.subtotal = booking.subtotalAmount ?? booking.totalAmount;
            this.payment.discountAmount = booking.discountAmount ?? 0;
            this.payment.couponCode = booking.couponCode ?? null;
            this.payment.currency = booking.currency || 'BDT';
            if (booking.bookingStatus === 'CANCELLED') this.errorMessage = 'This booking was cancelled and cannot be paid.';
          },
          error: () => { this.errorMessage = 'Booking details could not be loaded. Please return to My Bookings.'; },
        });
      }
    });
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.payment.paymentMethod = method;

    this.payment.cardNumber = '';
    this.payment.cardHolder = '';
    this.payment.expiryDate = '';
    this.payment.cvv = '';
    this.payment.mobileNumber = '';
    this.payment.transactionId = '';

    this.isPaid = false;
  }

  processPayment(): void {
    this.errorMessage = '';
    if (!this.isPaymentInputValid) {
      this.errorMessage = 'Please complete the required payment details.';
      return;
    }

    this.isSubmitting = true;
    this.paymentService
      .confirmPayment(this.payment.bookingReference, this.payment.paymentMethod)
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          this.payment.amount = result.amount;
          this.payment.currency = result.currency;
          this.isDemoPayment = result.demoMode;
          this.isPaid = result.status === 'SUCCEEDED';
          if (!this.isPaid) {
            this.errorMessage = result.message || 'Payment has not been completed by a payment gateway.';
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.errorMessage =
            'We could not confirm this booking. Return to your booking and try again.';
        },
      });
  }

  resetPayment(): void {
    this.payment.cardNumber = '';
    this.payment.cardHolder = '';
    this.payment.expiryDate = '';
    this.payment.cvv = '';
    this.payment.mobileNumber = '';
    this.payment.transactionId = '';

    this.isPaid = false;
  }

  goToBooking(): void {
    this.router.navigate(['/booking-details'], {
      queryParams: { ref: this.payment.bookingReference },
    });
  }

  goToReceipt(): void {
    this.router.navigate(['/payment-result'], {
      queryParams: { ref: this.payment.bookingReference },
    });
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }

  goBack(): void {
    window.history.back();
  }

  get isPaymentInputValid(): boolean {
    if (!this.payment.bookingReference || this.payment.amount <= 0) return false;

    switch (this.payment.paymentMethod) {
      case 'DEMO':
        return true;
      default:
        return false;
    }
  }
}
