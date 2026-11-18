import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';
import { PARTNER_ADMIN_ROLES } from '../../../core/models/access-control.model';
import { LiveClockComponent } from '../live-clock/live-clock.component';
import { ThemeToggleComponent } from '../../theme-toggle/theme-toggle.component';

interface WorkspaceItem {
  label: string;
  route: string;
  icon: string;
}

interface WorkspaceGroup {
  label?: string;
  items: WorkspaceItem[];
}

/**
 * The shared private-workspace navigation. Menus are intentionally derived
 * from the signed-in role so the UI does not expose another partner's tools.
 * Route guards remain the authority until the backend enforces tenant scopes.
 */
@Component({
  selector: 'app-role-workspace-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LiveClockComponent, ThemeToggleComponent],
  templateUrl: './role-workspace-nav.component.html',
  styleUrl: './role-workspace-nav.component.scss',
})
export class RoleWorkspaceNavComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isOpen = false;
  isHovered = false;
  @Output() readonly expandedChange = new EventEmitter<boolean>();

  get userName(): string {
    return this.auth.getCurrentUser()?.name ?? 'Workspace member';
  }

  get role(): UserRole {
    return this.auth.getCurrentRole() ?? 'CUSTOMER';
  }

  get groups(): WorkspaceGroup[] {
    const common: WorkspaceItem[] = [
      { label: 'Notifications', route: '/notifications', icon: '◌' },
      { label: 'My profile', route: '/user-profile', icon: '◎' },
    ];

    switch (this.role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'CONTROL', items: [
            { label: 'System overview', route: '/super-admin', icon: '◈' },
            { label: 'Admin command', route: '/admin-dashboard', icon: '▦' },
          ] },
          { label: 'GOVERNANCE', items: [
            { label: 'Partner organizations & destinations', route: '/partner-management', icon: '◇' },
            { label: 'Hotel management', route: '/hotel-management', icon: '◈' },
            { label: 'Hotel inventory', route: '/hotel-inventory', icon: '⌂' },
            { label: 'Restaurant management', route: '/restaurant-management', icon: '♨' },
            { label: 'Restaurant operations', route: '/restaurant-operations', icon: '▣' },
            { label: 'Tour packages', route: '/tour-package-management', icon: '✧' },
            { label: 'Agency operations', route: '/agency-operations', icon: '◇' },
            { label: 'Tour guides', route: '/tour-guide-management', icon: '♧' },
            { label: 'Guide availability', route: '/guide-availability', icon: '◷' },
            { label: 'Transport routes & tickets', route: '/transport-management', icon: '⇄' },
            { label: 'Transport dispatch', route: '/transport-dispatch', icon: '▤' },
            { label: 'Partner approvals', route: '/listing-approvals', icon: '✓' },
            { label: 'User management', route: '/user-management', icon: '♙' },
            { label: 'User directory', route: '/user-directory', icon: '♙' },
            { label: 'Audit trail', route: '/admin-audit', icon: '◫' },
            { label: 'System settings', route: '/settings', icon: '⚙' },
            { label: 'Languages', route: '/localization', icon: '文' },
          ] },
          { label: 'INSIGHTS', items: [{ label: 'Platform reports', route: '/admin-reports', icon: '↗' }, { label: 'Payments', route: '/admin-payment-management', icon: '৳' }, { label: 'Refunds', route: '/admin-refunds', icon: '↩' }, ...common] },
        ];
      case 'ADMIN':
        return [
          { items: [{ label: 'Command center', route: '/admin-dashboard', icon: '▦' }] },
          { label: 'OPERATIONS', items: [
            { label: 'Partner organizations & destinations', route: '/partner-management', icon: '◇' },
            { label: 'Partner approvals', route: '/listing-approvals', icon: '✓' },
            { label: 'Partner directory', route: '/partner-performance', icon: '◇' },
            { label: 'User directory', route: '/user-directory', icon: '♙' },
            { label: 'Content studio', route: '/content-management', icon: '✦' },
          ] },
          { label: 'CONTROL', items: [
            { label: 'Hotel management', route: '/hotel-management', icon: '◈' }, { label: 'Hotel inventory', route: '/hotel-inventory', icon: '⌂' },
            { label: 'Restaurant management', route: '/restaurant-management', icon: '♨' }, { label: 'Restaurant operations', route: '/restaurant-operations', icon: '▣' },
            { label: 'Tour packages', route: '/tour-package-management', icon: '✧' }, { label: 'Agency operations', route: '/agency-operations', icon: '◇' },
            { label: 'Tour guides', route: '/tour-guide-management', icon: '♧' }, { label: 'Guide availability', route: '/guide-availability', icon: '◷' },
            { label: 'Transport routes & tickets', route: '/transport-management', icon: '⇄' }, { label: 'Transport dispatch', route: '/transport-dispatch', icon: '▤' },
            { label: 'User management', route: '/user-management', icon: '♙' }, { label: 'User directory', route: '/user-directory', icon: '♙' },
            { label: 'Bookings', route: '/admin-booking-management', icon: '□' }, { label: 'Payments', route: '/admin-payment-management', icon: '৳' }, { label: 'Refunds', route: '/admin-refunds', icon: '↩' },
            { label: 'Coupons', route: '/admin-coupon-management', icon: '%' }, { label: 'Audit trail', route: '/admin-audit', icon: '◫' }, { label: 'Reports', route: '/admin-reports', icon: '↗' }, { label: 'Languages', route: '/localization', icon: '文' }, { label: 'Settings', route: '/settings', icon: '⚙' }, ...common] },
        ];
      case 'FINANCE_ACCOUNTANT':
        return [
          { items: [{ label: 'Financial overview', route: '/reports-analytics', icon: '▦' }] },
          { label: 'FINANCE', items: [{ label: 'Payments', route: '/admin-payment-management', icon: '৳' }, { label: 'Refunds', route: '/admin-refunds', icon: '↩' }, { label: 'Platform reports', route: '/admin-reports', icon: '↗' }] },
          { label: 'ACCOUNT', items: common },
        ];
      case 'SUPPORT_EXECUTIVE':
      case 'STAFF':
        return [
          { items: [{ label: 'Daily overview', route: '/dashboard', icon: '▦' }] },
          { label: 'SERVICE', items: [{ label: 'Support center', route: '/support', icon: '?' }, { label: 'Knowledge base', route: '/faq', icon: 'i' }, { label: 'Booking records', route: '/partner-bookings', icon: '□' }] },
          { label: 'ACCOUNT', items: common },
        ];
      case 'CONTENT_MANAGER':
        return [
          { items: [{ label: 'Content studio', route: '/content-management', icon: '✦' }] },
          { label: 'PUBLISHING', items: [{ label: 'Explore site', route: '/discover', icon: '⌁' }, { label: 'Offers', route: '/coupons-offers', icon: '◇' }] },
          { label: 'ACCOUNT', items: common },
        ];
      case 'HOTEL_PARTNER':
      case 'HOTEL_STAFF':
        return this.partnerGroups('Hotel overview', '/hotel-management');
      case 'RESTAURANT_PARTNER':
      case 'RESTAURANT_STAFF':
        return this.partnerGroups('Restaurant overview', '/restaurant-management');
      case 'TRAVEL_AGENCY_PARTNER':
      case 'TRAVEL_AGENCY_STAFF':
      case 'PARTNER':
        return this.partnerGroups('Package overview', '/tour-package-management');
      case 'TOUR_GUIDE':
        return this.partnerGroups('Guide overview', '/tour-guide-management');
      case 'TRANSPORT_PROVIDER':
      case 'DRIVER':
        return this.partnerGroups('Fleet overview', '/transport-management');
      case 'CUSTOMER':
      default:
        return [
          { items: [{ label: 'My dashboard', route: '/dashboard', icon: '▦' }] },
          { label: 'MY TRAVEL', items: [
            { label: 'My bookings', route: '/my-bookings', icon: '□' },
            { label: 'Saved trips', route: '/wishlist', icon: '♡' },
            { label: 'Travel journal', route: '/travel-journal', icon: '✎' },
            { label: 'AI trip planner', route: '/ai-planner', icon: '✦' },
            { label: 'Travel checklist', route: '/travel-checklist', icon: '✓' },
            { label: 'Travel safety', route: '/traveler-safety', icon: '♥' },
          ] },
          { label: 'MONEY & SAFETY', items: [
            { label: 'Payment history', route: '/payment-history', icon: '◫' },
            { label: 'Loyalty points', route: '/loyalty-points', icon: '✦' },
            { label: 'Expense tracker', route: '/expense-tracker', icon: '↗' },
            { label: 'Emergency contacts', route: '/emergency-contacts', icon: '♥' },
            { label: 'Currency converter', route: '/currency-converter', icon: '৳' },
            { label: 'Refund request', route: '/refund-request', icon: '↩' },
          ] },
          { label: 'ACCOUNT', items: [...common, { label: 'Travel chat', route: '/traveler-chat', icon: '◌' }, { label: 'Mobile companion', route: '/mobile-companion', icon: '▣' }, { label: 'Account security', route: '/account-security', icon: '⌾' }] },
        ];
    }
  }

  get isExpanded(): boolean { return this.isOpen || this.isHovered; }

  get canManageTeam(): boolean { return PARTNER_ADMIN_ROLES.includes(this.role); }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.expandedChange.emit(this.isOpen);
  }

  openOnHover(): void {
    if (window.innerWidth > 1100 && !this.isHovered) {
      this.isHovered = true;
      this.expandedChange.emit(true);
    }
  }

  closeOnLeave(): void {
    if (window.innerWidth > 1100 && this.isHovered) {
      this.isHovered = false;
      this.expandedChange.emit(false);
    }
  }

  close(): void {
    this.isOpen = false;
    this.isHovered = false;
    this.expandedChange.emit(false);
  }

  logout(): void {
    this.auth.logout();
    this.close();
    void this.router.navigate(['/login']);
  }

  private partnerGroups(overviewLabel: string, overviewRoute: string): WorkspaceGroup[] {
    return [
      { items: [
        { label: 'Partner dashboard', route: '/partner-dashboard', icon: '▦' },
        { label: overviewLabel, route: overviewRoute, icon: '◈' },
      ] },
      { label: 'OPERATIONS', items: [
        { label: 'My listings', route: '/partner-listings', icon: '◇' },
        { label: 'Booking inbox', route: '/partner-bookings', icon: '□' },
        ...this.roleSpecificOperations(),
        { label: 'Performance', route: '/partner-performance', icon: '↗' },
        { label: 'Guest reviews', route: '/customer-reviews-management', icon: '★' },
      ] },
      { label: 'BUSINESS', items: [
        ...(this.canManageTeam ? [{ label: 'My team', route: '/partner-team', icon: '♙' }] : []),
        { label: 'Business profile', route: '/partner-profile', icon: '◎' },
        { label: 'Support chat', route: '/traveler-chat', icon: '◌' },
        { label: 'Notifications', route: '/notifications', icon: '◌' },
      ] },
    ];
  }

  private roleSpecificOperations(): WorkspaceItem[] {
    switch (this.role) {
      case 'HOTEL_PARTNER':
      case 'HOTEL_STAFF':
        return [{ label: 'Rooms & rates', route: '/hotel-inventory', icon: '⌂' }];
      case 'RESTAURANT_PARTNER':
      case 'RESTAURANT_STAFF':
        return [{ label: 'Menu & tables', route: '/restaurant-operations', icon: '☷' }];
      case 'TRAVEL_AGENCY_PARTNER':
      case 'TRAVEL_AGENCY_STAFF':
      case 'PARTNER':
      case 'TOUR_GUIDE':
        // Agency and guide catalog administration is restricted to admins.
        return [];
      case 'TRANSPORT_PROVIDER':
      case 'DRIVER':
        return [{ label: 'Dispatch board', route: '/transport-dispatch', icon: '⌁' }];
      default:
        return [];
    }
  }
}
