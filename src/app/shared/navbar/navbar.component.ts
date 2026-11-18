import {
  Component,
  HostListener,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { AppLanguage, LanguageService } from '../../core/services/language.service';
import { LiveClockComponent } from '../components/live-clock/live-clock.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import {
  ADMIN_ROLES,
  AGENCY_ROLES,
  CONTENT_ROLES,
  CUSTOMER_ROLES,
  FINANCE_ROLES,
  GUIDE_ROLES,
  HOTEL_ROLES,
  PARTNER_ROLES,
  PARTNER_ADMIN_ROLES,
  RESTAURANT_ROLES,
  TRANSPORT_ROLES,
} from '../../core/models/access-control.model';

interface MegaItem {
  label: string;
  description: string;
  route: string;
  icon: string; // SVG id
  badge?: string;
}

interface MegaGroup {
  id: string;
  title: string;
  kicker: string;
  items: MegaItem[];
}

interface MegaMenu {
  id: string;
  label: string;
  icon: string;
  tagline: string;
  groups: MegaGroup[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, LiveClockComponent, ThemeToggleComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);
  private readonly sharedMenuIds = [
    'explore',
    'dining',
    'planning',
    'community',
  ];

  isLanguageOpen = false;
  mobileMenuOpen = false;
  menu!: MegaMenu;

  // AUTHENTICATION
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get currentRole() {
    return this.authService.getCurrentRole();
  }

  get userDisplayName(): string {
    const user = this.currentUser;

    return user?.name || user?.email || 'My Account';
  }

  get dashboardRoute(): string {
    return this.authService.getRoleHome();
  }

  get showBackButton(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return !['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(path);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/');
  }

  get language(): AppLanguage { return this.languageService.current; }

  logout(): void {
    this.authService.logout();

    this.mobileMenuOpen = false;
    this.activeMegaMenu.set(null);

    this.router.navigate(['/login']);
  }

  get isDarkMode(): boolean {
    return this.themeService.isDark();
  }

  activeMegaMenu = signal<string | null>(null);
  private megaMenuTimeout: ReturnType<typeof setTimeout> | null = null;

  isSearchOpen = false;
  searchQuery = '';

  // ═══════════════════════════════════════════════════
  // MEGA MENUS — All 56+ pages with real SVG icons
  // ═══════════════════════════════════════════════════
  megaMenus: MegaMenu[] = [
    {
      id: 'explore',
      label: 'Explore',
      icon: 'compass',
      tagline: 'Discover the world',
      groups: [
        {
          id: 'discover',
          title: 'Discover',
          kicker: 'WHERE TO GO',
          items: [
            {
              label: 'Discover',
              description: 'Curated travel inspiration',
              route: '/discover',
              icon: 'sparkle',
            },
            {
              label: 'Destinations',
              description: 'Browse 64+ places worldwide',
              route: '/destinations',
              icon: 'pin',
              badge: '64+',
            },
            {
              label: 'Tour Packages',
              description: 'Handpicked multi-day journeys',
              route: '/tour-packages',
              icon: 'package',
            },
            {
              label: 'Holidays',
              description: 'Seasonal deals & getaways',
              route: '/holidays',
              icon: 'sun',
            },
          ],
        },
        {
          id: 'stay-move',
          title: 'Stay & Move',
          kicker: 'HOW TO TRAVEL',
          items: [
            {
              label: 'Hotels & Stays',
              description: 'Resorts, villas & boutique stays',
              route: '/stays',
              icon: 'bed',
            },
            {
              label: 'Flights',
              description: 'Search & book air tickets',
              route: '/flights',
              icon: 'plane',
            },
            {
              label: 'Transportation',
              description: 'Bus, train, car & cruise',
              route: '/transportation',
              icon: 'bus',
            },
            {
              label: 'Google Maps',
              description: 'Explore location intelligence',
              route: '/maps',
              icon: 'map',
            },
          ],
        },
      ],
    },
    {
      id: 'dining',
      label: 'Dining',
      icon: 'utensils',
      tagline: 'Taste the world',
      groups: [
        {
          id: 'food',
          title: 'Dining',
          kicker: 'WHAT TO EAT',
          items: [
            {
              label: 'Restaurants',
              description: 'Local flavors & fine dining',
              route: '/restaurants',
              icon: 'utensils',
            },
            {
              label: 'Cafés & Bars',
              description: 'Coffee, cocktails, nightlife',
              route: '/restaurants',
              icon: 'coffee',
            },
            {
              label: 'Street Food',
              description: 'Authentic local experiences',
              route: '/restaurants',
              icon: 'bowl',
            },
          ],
        },
        {
          id: 'experts',
          title: 'Local Experts',
          kicker: 'MEET LOCALS',
          items: [
            {
              label: 'Tour Guides',
              description: 'Verified local storytellers',
              route: '/tour-guides',
              icon: 'user',
            },
            {
              label: 'Travel Agencies',
              description: 'Plan trips with experts',
              route: '/partner-registration',
              icon: 'building',
            },
            {
              label: 'Reviews',
              description: 'Real traveler experiences',
              route: '/review-rating',
              icon: 'star',
            },
          ],
        },
      ],
    },
    {
      id: 'planning',
      label: 'Plan',
      icon: 'wand',
      tagline: 'AI-powered planning',
      groups: [
        {
          id: 'ai',
          title: 'Smart Planning',
          kicker: 'AI-POWERED',
          items: [
            {
              label: 'AI Trip Planner',
              description: 'Plan journeys in minutes',
              route: '/ai-planner',
              icon: 'wand',
              badge: 'NEW',
            },
            {
              label: 'Wishlist',
              description: 'Save your favorites',
              route: '/wishlist',
              icon: 'heart',
            },
            {
              label: 'Compare Services',
              description: 'Side-by-side comparisons',
              route: '/compare-services',
              icon: 'compare',
            },
          ],
        },
        {
          id: 'search',
          title: 'Find & Discover',
          kicker: 'SEARCH',
          items: [
            {
              label: 'Search Results',
              description: 'Unified search experience',
              route: '/search-results',
              icon: 'search',
            },
            {
              label: 'Weather',
              description: 'Destination weather insight',
              route: '/weather',
              icon: 'cloud',
            },
            {
              label: 'Coupons & Offers',
              description: 'Save on every journey',
              route: '/coupons-offers',
              icon: 'tag',
            },
          ],
        },
      ],
    },
    {
      id: 'booking',
      label: 'Bookings',
      icon: 'ticket',
      tagline: 'Manage your journeys',
      groups: [
        {
          id: 'my-bookings',
          title: 'My Journeys',
          kicker: 'YOUR TRIPS',
          items: [
            {
              label: 'My Bookings',
              description: 'Active & upcoming trips',
              route: '/my-bookings',
              icon: 'ticket',
            },
            {
              label: 'Booking History',
              description: 'Past journeys & receipts',
              route: '/booking-history',
              icon: 'history',
            },
            {
              label: 'Payment History',
              description: 'Transactions & invoices',
              route: '/payment-result',
              icon: 'wallet',
            },
          ],
        },
        {
          id: 'checkout',
          title: 'Booking Flow',
          kicker: 'RESERVE NOW',
          items: [
            {
              label: 'Booking',
              description: 'Start a new reservation',
              route: '/booking',
              icon: 'calendar',
            },
            {
              label: 'Checkout',
              description: 'Finalize your booking',
              route: '/checkout',
              icon: 'card',
            },
            {
              label: 'Payment',
              description: 'Secure payment processing',
              route: '/payment',
              icon: 'shield',
            },
          ],
        },
      ],
    },
    {
      id: 'community',
      label: 'Community',
      icon: 'users',
      tagline: 'Connect & share',
      groups: [
        {
          id: 'connect',
          title: 'Connect',
          kicker: 'STAY IN TOUCH',
          items: [
            {
              label: 'Notifications',
              description: 'Your alerts & updates',
              route: '/notifications',
              icon: 'bell',
            },
            {
              label: 'Notification Center',
              description: 'Manage all notifications',
              route: '/notification-center',
              icon: 'bell',
            },
            {
              label: 'Reviews & Rating',
              description: 'Share your experience',
              route: '/review-rating',
              icon: 'star',
            },
          ],
        },
        {
          id: 'help',
          title: 'Help & Support',
          kicker: 'WE ARE HERE',
          items: [
            {
              label: 'Support Center',
              description: '24/7 traveler support',
              route: '/support',
              icon: 'help',
            },
            {
              label: 'FAQ',
              description: 'Answers to common questions',
              route: '/faq',
              icon: 'message',
            },
          ],
        },
      ],
    },
    {
      id: 'partner',
      label: 'Partner',
      icon: 'briefcase',
      tagline: 'Grow your business',
      groups: [
        {
          id: 'partner-main',
          title: 'Partner Portal',
          kicker: 'FOR BUSINESSES',
          items: [
            {
              label: 'Partner Registration',
              description: 'Join as a business partner',
              route: '/partner-registration',
              icon: 'handshake',
              badge: 'NEW',
            },
            {
              label: 'Partner Profile',
              description: 'Manage business identity',
              route: '/partner-profile',
              icon: 'user',
            },
            {
              label: 'Partner Performance',
              description: 'KPI & analytics dashboard',
              route: '/partner-performance',
              icon: 'chart',
            },
            {
              label: 'Team & Drivers',
              description: 'Manage staff and driver sub-accounts',
              route: '/partner-team',
              icon: 'users',
            },
            {
              label: 'Listings',
              description: 'Manage your visible services',
              route: '/partner-listings',
              icon: 'building',
            },
            {
              label: 'Partner Bookings',
              description: 'Review operational reservations',
              route: '/partner-bookings',
              icon: 'calendar',
            },
          ],
        },
        {
          id: 'partner-ops',
          title: 'Operations',
          kicker: 'MANAGE',
          items: [
            {
              label: 'Hotel Management',
              description: 'Manage your properties',
              route: '/hotel-management',
              icon: 'building',
            },
            {
              label: 'Restaurant Management',
              description: 'Menu & reservations',
              route: '/restaurant-management',
              icon: 'utensils',
            },
            {
              label: 'Tour Management',
              description: 'Create & publish tours',
              route: '/tour-package-management',
              icon: 'package',
            },
            {
              label: 'Transport Management',
              description: 'Fleet & routes',
              route: '/transport-management',
              icon: 'bus',
            },
          ],
        },
      ],
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'crown',
      tagline: 'Platform control',
      groups: [
        {
          id: 'admin-core',
          title: 'Administration',
          kicker: 'PLATFORM CONTROL',
          items: [
            {
              label: 'Admin Dashboard',
              description: 'Command center overview',
              route: '/admin-dashboard',
              icon: 'dashboard',
            },
            {
              label: 'User Management',
              description: 'Manage all platform users',
              route: '/user-management',
              icon: 'users',
            },
            {
              label: 'User Directory',
              description: 'Browse user registry',
              route: '/user-directory',
              icon: 'book',
            },
            {
              label: 'Admin Audit',
              description: 'Security & activity log',
              route: '/admin-audit',
              icon: 'shield',
            },
          ],
        },
        {
          id: 'admin-catalog',
          title: 'Service inventory',
          kicker: 'CATALOG & OPERATIONS',
          items: [
            { label: 'Hotels', description: 'Hotels, rooms and rates', route: '/hotel-management', icon: 'building' },
            { label: 'Restaurants', description: 'Menus, photos and reservations', route: '/restaurant-management', icon: 'utensils' },
            { label: 'Tour packages', description: 'Packages and itineraries', route: '/tour-package-management', icon: 'package' },
            { label: 'Agency operations', description: 'Departures and package gallery', route: '/agency-operations', icon: 'map' },
            { label: 'Tour guides', description: 'Guide profiles and availability', route: '/tour-guide-management', icon: 'compass' },
            { label: 'Transport & tickets', description: 'Routes and dispatch', route: '/transport-management', icon: 'bus' },
          ],
        },
        {
          id: 'admin-platform',
          title: 'Platform',
          kicker: 'GOVERNANCE',
          items: [
            {
              label: 'Reports & Analytics',
              description: 'Business intelligence',
              route: '/reports-analytics',
              icon: 'chart',
            },
            {
              label: 'Content Management',
              description: 'CMS & editorial tools',
              route: '/content-management',
              icon: 'edit',
            },
            {
              label: 'Reviews Moderation',
              description: 'Moderate user reviews',
              route: '/customer-reviews-management',
              icon: 'star',
            },
            {
              label: 'Settings',
              description: 'Platform preferences',
              route: '/settings',
              icon: 'settings',
            },
            {
              label: 'Super Admin',
              description: 'Highest-level controls',
              route: '/super-admin',
              icon: 'crown',
              badge: 'MASTER',
            },
          ],
        },
      ],
    },
  ];

  // ROLE-BASED NAVIGATION
  get visibleMegaMenus(): MegaMenu[] {
    const role = this.currentRole;

    let allowedMenuIds = [...this.sharedMenuIds];

    if (this.isLoggedIn) {
      switch (role) {
        case 'CUSTOMER':
          allowedMenuIds.push('booking');
          break;

        case 'HOTEL_PARTNER':
        case 'HOTEL_STAFF':
        case 'RESTAURANT_PARTNER':
        case 'RESTAURANT_STAFF':
        case 'TRAVEL_AGENCY_PARTNER':
        case 'TRAVEL_AGENCY_STAFF':
        case 'TOUR_GUIDE':
        case 'TRANSPORT_PROVIDER':
        case 'DRIVER':
        case 'PARTNER':
          allowedMenuIds.push('partner');
          break;

        case 'STAFF':
          // Staff gets shared services and staff dashboard.
          break;

        case 'SUPER_ADMIN':
        case 'ADMIN':
        case 'CONTENT_MANAGER':
        case 'FINANCE_ACCOUNTANT':
          allowedMenuIds.push('admin');

          if (role === 'SUPER_ADMIN') {
            allowedMenuIds.push('super-admin');
          }
          break;
      }
    }

    return this.megaMenus
      .filter((menu) => allowedMenuIds.includes(menu.id))
      .map((menu) => ({
        ...menu,
        groups: this.visibleGroups(menu),
      }))
      .filter((menu) => menu.groups.length > 0);
  }

  /**
   * Filters restricted items inside each mega-menu.
   * Also used by desktop/mobile navbar templates.
   */

  visibleGroups(menu: MegaMenu): MegaGroup[] {
    return menu.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => this.canAccessRoute(item.route)),
      }))
      .filter((group) => group.items.length > 0);
  }

  visibleItemCount(menu: MegaMenu): number {
    return this.visibleGroups(menu).reduce(
      (total, group) => total + group.items.length,
      0,
    );
  }

  /**
   * Navbar visibility only.
   * Route guards must remain enabled for real access control.
   */
  private canAccessRoute(route: string): boolean {
    const role = this.currentRole;

    // Public pages
    const publicRoutes = [
      '/',
      '/discover',
      '/destinations',
      '/tour-packages',
      '/holidays',
      '/stays',
      '/flights',
      '/transportation',
      '/maps',
      '/restaurants',
      '/tour-guides',
      '/partner-registration',
      '/compare-services',
      '/ai-planner',
      '/search-results',
      '/weather',
      '/faq',
      '/coupons-offers',
    ];

    if (publicRoutes.includes(route)) {
      return true;
    }

    // Not logged in: public pages only
    if (!this.isLoggedIn || !role) {
      return false;
    }

    // Customer-only pages
    const customerRoutes = [
      '/review-rating',
      '/wishlist',
      '/my-bookings',
      '/booking-history',
    ];

    if (customerRoutes.includes(route)) {
      return this.authService.hasRole(CUSTOMER_ROLES);
    }

    // Available to all authenticated roles
    const authenticatedRoutes = [
      '/dashboard',
      '/user-profile',
      '/notifications',
      '/notification-center',
      '/support',
    ];

    if (authenticatedRoutes.includes(route)) {
      return true;
    }

    if (['/booking', '/checkout', '/payment', '/payment-result', '/booking-details'].includes(route)) {
      return this.authService.hasRole(CUSTOMER_ROLES);
    }

    if (['/partner-profile', '/partner-performance', '/customer-reviews-management', '/partner-listings', '/partner-bookings'].includes(route)) {
      return this.authService.hasRole(PARTNER_ROLES);
    }

    if (route === '/partner-team') {
      return this.authService.hasRole(PARTNER_ADMIN_ROLES);
    }

    if (route === '/hotel-management') {
      return this.authService.hasRole(HOTEL_ROLES);
    }
    if (route === '/restaurant-management') {
      return this.authService.hasRole(RESTAURANT_ROLES);
    }
    if (route === '/tour-package-management') {
      return this.authService.hasRole(AGENCY_ROLES);
    }
    if (route === '/tour-guide-management') {
      return this.authService.hasRole(GUIDE_ROLES);
    }
    if (route === '/transport-management') {
      return this.authService.hasRole(TRANSPORT_ROLES);
    }

    // Admin operations
    const adminRoutes = [
      '/admin-dashboard',
      '/user-management',
      '/user-directory',
      '/admin-audit',
      '/settings',
    ];

    if (adminRoutes.includes(route)) {
      return this.authService.hasRole(ADMIN_ROLES);
    }

    if (route === '/reports-analytics') {
      return this.authService.hasRole([...ADMIN_ROLES, ...FINANCE_ROLES]);
    }

    if (route === '/content-management') {
      return this.authService.hasRole(CONTENT_ROLES);
    }

    // Super Admin only
    if (route === '/super-admin') {
      return role === 'SUPER_ADMIN';
    }

    // Unknown routes remain hidden until explicitly assigned.
    return false;
  }

  // ═══════════════════════════════════════════════════
  // MEGA MENU
  // ═══════════════════════════════════════════════════
  openMegaMenu(id: string): void {
    this.clearMegaMenuTimeout();
    this.activeMegaMenu.set(id);
  }

  toggleMegaMenu(id: string): void {
    if (this.activeMegaMenu() === id) {
      this.activeMegaMenu.set(null);
    } else {
      this.openMegaMenu(id);
    }
  }

  closeMegaMenu(): void {
    this.clearMegaMenuTimeout();
    this.megaMenuTimeout = setTimeout(() => {
      this.activeMegaMenu.set(null);
    }, 180);
  }

  keepMegaMenuOpen(): void {
    this.clearMegaMenuTimeout();
  }

  private clearMegaMenuTimeout(): void {
    if (this.megaMenuTimeout !== null) {
      clearTimeout(this.megaMenuTimeout);
      this.megaMenuTimeout = null;
    }
  }

  // ═══════════════════════════════════════════════════
  // LANGUAGE
  // ═══════════════════════════════════════════════════
  toggleLanguage(): void {
    this.isLanguageOpen = !this.isLanguageOpen;
  }
  closeLanguage(): void {
    this.isLanguageOpen = false;
  }

  selectLanguage(language: AppLanguage): void {
    this.languageService.set(language);
    this.closeLanguage();
  }

  // ═══════════════════════════════════════════════════
  // THEME
  // ═══════════════════════════════════════════════════
  toggleTheme(): void {
    this.themeService.toggle();
  }

  // ═══════════════════════════════════════════════════
  // MOBILE
  // ═══════════════════════════════════════════════════
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
  }
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  // ═══════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════
  openSearch(): void {
    this.isSearchOpen = true;
  }
  closeSearch(): void {
    this.isSearchOpen = false;
    this.searchQuery = '';
  }
  submitSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.closeSearch();
    this.router.navigate(['/search-results'], { queryParams: { q } });
  }

  // ═══════════════════════════════════════════════════
  // GLOBAL
  // ═══════════════════════════════════════════════════
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-wrapper')) this.isLanguageOpen = false;
    if (!target.closest('.mega-nav')) {
      this.clearMegaMenuTimeout();
      this.activeMegaMenu.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isLanguageOpen = false;
    this.isSearchOpen = false;
    this.closeMobileMenu();
    this.clearMegaMenuTimeout();
    this.activeMegaMenu.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  ngOnDestroy(): void {
    this.clearMegaMenuTimeout();
    document.body.style.overflow = '';
  }
}
