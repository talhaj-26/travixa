import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  message = 'Opening your secure booking payment…';

  constructor(private readonly route: ActivatedRoute, private readonly router: Router) {}

  ngOnInit(): void {
    const bookingReference = this.route.snapshot.queryParamMap.get('bookingReference')
      || this.route.snapshot.queryParamMap.get('ref');
    if (bookingReference) {
      void this.router.navigate(['/payment'], { queryParams: { bookingReference } });
      return;
    }
    this.message = 'Choose a booking from My Bookings to continue to payment.';
  }

  goToBookings(): void {
    void this.router.navigate(['/my-bookings']);
  }
}
