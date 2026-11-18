
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardResponse } from '../../../core/models/dashboard.model';
import { UserRole } from '../../../core/models/user.model';

interface DashboardAction {
  label: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  data: DashboardResponse | null = null;
  loading = true;
  errorMessage = '';

  actions: DashboardAction[] = [];

  ngOnInit(): void {
    const role = this.authService.getCurrentRole();

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      void this.router.navigateByUrl(this.authService.getRoleHome());
      return;
    }

    this.setActions(role ?? 'CUSTOMER');
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getOverview().subscribe({
      next: (response) => {
        this.data = response;
        this.setActions(response.role);
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Dashboard information could not be loaded. Please try again.';
        this.loading = false;
      },
    });
  }

  retry(): void {
    this.loadDashboard();
  }

  get role(): UserRole {
  const dashboardRole = this.data?.role;

  if (dashboardRole) {
    return dashboardRole as UserRole;
  }

  return this.authService.getCurrentRole() ?? 'CUSTOMER';
}

  get isCustomer(): boolean {
    return this.role === 'CUSTOMER' || this.role === 'ROLE_USER';
  }

  get isFinance(): boolean {
    return this.role === 'FINANCE_ACCOUNTANT';
  }

  get isContentManager(): boolean {
    return this.role === 'CONTENT_MANAGER';
  }

  get isPartner(): boolean {
    return [
      'HOTEL_PARTNER', 'HOTEL_STAFF',
      'RESTAURANT_PARTNER', 'RESTAURANT_STAFF',
      'TRAVEL_AGENCY_PARTNER', 'TRAVEL_AGENCY_STAFF',
      'TOUR_GUIDE', 'TRANSPORT_PROVIDER', 'DRIVER', 'PARTNER',
    ].includes(this.role);
  }

  get isSupport(): boolean {
    return this.role === 'SUPPORT_EXECUTIVE' || this.role === 'STAFF';
  }

  get pageTitle(): string {
    if (this.isCustomer) return 'Your travel dashboard';
    if (this.isFinance) return 'Finance overview';
    if (this.isContentManager) return 'Content workspace';
    if (this.isSupport) return 'Support workspace';
    if (this.isPartner) return 'Your business dashboard';
    return 'Your dashboard';
  }

  get displayName(): string {
  return (
    this.data?.displayName ??
    this.authService.getCurrentUser()?.name ??
    'Traveler'
  );
}

get greeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

  private setActions(role: string): void {
    const customerActions: DashboardAction[] = [
      {
        label: 'Explore stays',
        description: 'Discover hotels and places to stay',
        route: '/stays',
        icon: '⌂',
      },
      {
        label: 'Find tour packages',
        description: 'Explore trips and experiences',
        route: '/tour-packages',
        icon: '◇',
      },
      {
        label: 'My bookings',
        description: 'Review your travel reservations',
        route: '/my-bookings',
        icon: '▤',
      },
      {
        label: 'Plan a trip',
        description: 'Build your next itinerary',
        route: '/ai-planner',
        icon: '✧',
      },
    ];

    const partnerActions: DashboardAction[] = [
      {
        label: 'Partner workspace',
        description: 'Open your business workspace',
        route: '/partner-dashboard',
        icon: '⌂',
      },
      {
        label: 'Manage listings',
        description: 'Maintain your business listings',
        route: '/partner-listings',
        icon: '▤',
      },
      {
        label: 'Manage bookings',
        description: 'Review bookings available to your role',
        route: '/partner-bookings',
        icon: '◇',
      },
      {
        label: 'Business profile',
        description: 'Review your partner profile',
        route: '/partner-profile',
        icon: '◎',
      },
    ];

    const roleActions: Record<string, DashboardAction[]> = {
      FINANCE_ACCOUNTANT: [
        {
          label: 'Reports & analytics',
          description: 'Open financial reporting',
          route: '/reports-analytics',
          icon: '▥',
        },
        {
          label: 'Payment management',
          description: 'Review payment records',
          route: '/admin-payment-management',
          icon: '৳',
        },
        {
          label: 'Refund management',
          description: 'Review refund operations',
          route: '/admin-refunds',
          icon: '↺',
        },
      ],
      CONTENT_MANAGER: [
        {
          label: 'Content management',
          description: 'Review and maintain platform content',
          route: '/content-management',
          icon: '▤',
        },
        {
          label: 'Listing approvals',
          description: 'Review listings pending approval',
          route: '/listing-approvals',
          icon: '✓',
        },
      ],
      SUPPORT_EXECUTIVE: [
        {
          label: 'Support center',
          description: 'Open customer support',
          route: '/support',
          icon: '◎',
        },
        {
          label: 'Notifications',
          description: 'Review platform notifications',
          route: '/notifications',
          icon: '♧',
        },
      ],
      STAFF: [
        {
          label: 'Support center',
          description: 'Open your available support tools',
          route: '/support',
          icon: '◎',
        },
      ],
    };

    this.actions = roleActions[role] ??
      (this.isPartner ? partnerActions : customerActions);
  }

  formatCurrency(amount: number, currency = 'BDT'): string {
    try {
      return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  }

  bookingStatusLabel(status: string): string {
    return status.replaceAll('_', ' ').toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  trackBooking(_: number, booking: { id: number }): number {
    return booking.id;
  }
}
