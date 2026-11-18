import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResponse } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partner-dashboard.component.html',
  styleUrl: './partner-dashboard.component.scss',
})
export class PartnerDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);

  data: DashboardResponse | null = null;
  loading = true;
  errorMessage = '';

  readonly primaryActions = [
    { label: 'Manage listings', route: '/partner-listings', icon: '◇' },
    { label: 'Review booking inbox', route: '/partner-bookings', icon: '□' },
    { label: 'See performance', route: '/partner-performance', icon: '↗' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboard.getOverview().subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Partner workspace data could not be loaded. Check your connection and permissions.';
        this.loading = false;
      },
    });
  }

  get userName(): string {
    return this.data?.displayName ?? this.auth.getCurrentUser()?.name ?? 'Partner';
  }

  get roleLabel(): string {
    return (this.data?.role ?? this.auth.getCurrentRole() ?? 'PARTNER')
      .replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  get totalListings(): number {
    const data = this.data;
    return data ? data.totalHotels + data.totalRestaurants + data.totalTourPackages + data.totalTourGuides + data.totalTransportRoutes : 0;
  }
}
