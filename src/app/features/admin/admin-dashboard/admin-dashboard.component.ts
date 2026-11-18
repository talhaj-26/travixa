
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardResponse } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  data: DashboardResponse | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getOverview().subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Could not load live platform metrics. Check the API and your access permissions.';
        this.loading = false;
      },
    });
  }

  get bookingStatuses(): { label: string; value: number; className: string }[] {
    const data = this.data;

    if (!data) return [];

    return [
      {
        label: 'Pending payment',
        value: data.pendingBookings,
        className: 'pending',
      },
      {
        label: 'Confirmed',
        value: data.confirmedBookings,
        className: 'confirmed',
      },
      {
        label: 'Completed',
        value: data.completedBookings,
        className: 'completed',
      },
      {
        label: 'Cancelled',
        value: data.cancelledBookings,
        className: 'cancelled',
      },
    ];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  trackByLabel(_: number, item: { label: string }): string {
    return item.label;
  }

  trackByBooking(_: number, booking: { id: number }): number {
    return booking.id;
  }
}
