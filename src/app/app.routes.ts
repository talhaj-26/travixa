import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import {
  ADMIN_ROLES,
  CONTENT_ROLES,
  CUSTOMER_ROLES,
  FINANCE_ROLES,
  GUIDE_ROLES,
  HOTEL_ROLES,
  PARTNER_ADMIN_ROLES,
  PARTNER_ROLES,
  TRANSPORT_ROLES,
} from './core/models/access-control.model';

export const routes: Routes = [
  // Home — Public landing page
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/public/about/about.component').then(
        (m) => m.AboutComponent,
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/public/contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
  },

  // Discover
  {
    path: 'discover',
    loadComponent: () =>
      import('./features/tourism/discover/discover.component').then(
        (m) => m.DiscoverComponent,
      ),
  },

  // Destinations
  {
    path: 'destinations',
    loadComponent: () =>
      import('./features/tourism/destinations/destinations.component').then(
        (m) => m.DestinationsComponent,
      ),
  },
  {
    path: 'destination-details',
    loadComponent: () =>
      import('./features/tourism/destination-details/destination-details.component').then(
        (m) => m.DestinationDetailsComponent,
      ),
  },

  // Tour Packages
  {
    path: 'tour-packages',
    loadComponent: () =>
      import('./features/tourism/tour-packages/tour-packages.component').then(
        (m) => m.TourPackagesComponent,
      ),
  },

  // Stays
  {
    path: 'stays',
    loadComponent: () =>
      import('./features/hospitality/stays/stays.component').then(
        (m) => m.StaysComponent,
      ),
  },

  // Booking
  {
    path: 'booking',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES },
    loadComponent: () =>
      import('./features/booking/booking/booking.component').then(
        (m) => m.BookingComponent,
      ),
  },

  // Payment
  {
    path: 'payment',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES },
    loadComponent: () =>
      import('./features/payment/payment/payment.component').then(
        (m) => m.PaymentComponent,
      ),
  },

  // Flights
  {
    path: 'flights',
    loadComponent: () =>
      import('./features/flights/flights.component').then(
        (m) => m.FlightsComponent,
      ),
  },

  // Holidays
  {
    path: 'holidays',
    loadComponent: () =>
      import('./features/holidays/holidays.component').then(
        (m) => m.HolidaysComponent,
      ),
  },

  // Transportation
  {
    path: 'transportation',
    loadComponent: () =>
      import('./features/transportation/transportation/transportation.component').then(
        (m) => m.TransportationComponent,
      ),
  },

  // Restaurants
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./features/restaurant/restaurants/restaurants.component').then(
        (m) => m.RestaurantsComponent,
      ),
  },

  // Tour Guides
  {
    path: 'tour-guides',
    loadComponent: () =>
      import('./features/tourism/tour-guides/tour-guides.component').then(
        (m) => m.TourGuidesComponent,
      ),
  },

  // User Management
  {
    path: 'user-management',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/user-management/user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
  },

  // Login
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },

  // Register
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },

  // AI Planner
  {
    path: 'ai-planner',
    loadComponent: () =>
      import('./features/ai-planner/ai-planner.component').then(
        (m) => m.AiPlannerComponent,
      ),
  },

  // Review & Rating
  {
    path: 'review-rating',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: CUSTOMER_ROLES,
    },
    loadComponent: () =>
      import('./features/review-rating/review-rating/review-rating.component').then(
        (m) => m.ReviewRatingComponent,
      ),
  },

  // Notification
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/inbox/inbox.component').then(
        (m) => m.InboxComponent,
      ),
  },

  // Dashboard
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },

  // Google Maps
  {
    path: 'maps',
    loadComponent: () =>
      import('./features/maps/google-maps/google-maps.component').then(
        (m) => m.GoogleMapsComponent,
      ),
  },

  // Forgot Password
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },

  // Reset Password
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },

  // User Profile
  {
    path: 'user-profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user-management/user-profile/user-profile.component').then(
        (m) => m.UserProfileComponent,
      ),
  },

  // My Bookings
  {
    path: 'my-bookings',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: CUSTOMER_ROLES,
    },
    loadComponent: () =>
      import('./features/booking/my-bookings/my-bookings.component').then(
        (m) => m.MyBookingsComponent,
      ),
  },

  // Wishlist
  {
    path: 'wishlist',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: CUSTOMER_ROLES,
    },
    loadComponent: () =>
      import('./features/user-management/wishlist/wishlist.component').then(
        (m) => m.WishlistComponent,
      ),
  },
  {
    path: 'custom-trip-request',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES },
    loadComponent: () =>
      import('./features/tourism/custom-trip-request/custom-trip-request.component').then(
        (m) => m.CustomTripRequestComponent,
      ),
  },

  {
    path: 'terms',
    loadComponent: () =>
      import('./features/public/legal/legal.component').then(
        (m) => m.LegalComponent,
      ),
    data: { type: 'terms' },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/public/legal/legal.component').then(
        (m) => m.LegalComponent,
      ),
    data: { type: 'privacy' },
  },
  {
    path: 'booking-policy',
    loadComponent: () =>
      import('./features/public/legal/legal.component').then(
        (m) => m.LegalComponent,
      ),
    data: { type: 'policy' },
  },

  // Personal travel memories
  {
    path: 'travel-journal',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES },
    loadComponent: () =>
      import('./features/user-management/travel-journal/travel-journal.component').then(
        (m) => m.TravelJournalComponent,
      ),
  },

  // Account privacy and local demo data controls
  {
    path: 'account-security',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user-management/account-security/account-security.component').then(
        (m) => m.AccountSecurityComponent,
      ),
  },

  // Booking History
  {
    path: 'booking-history',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: CUSTOMER_ROLES,
    },
    loadComponent: () =>
      import('./features/booking/my-bookings/my-bookings.component').then(
        (m) => m.MyBookingsComponent,
      ),
  },

  // Customer travel tools
  {
    path: 'payment-history',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES, tool: 'PAYMENT_HISTORY' },
    loadComponent: () =>
      import('./features/customer-tools/travel-companion/travel-companion.component').then(
        (m) => m.TravelCompanionComponent,
      ),
  },
  {
    path: 'loyalty-points',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES, tool: 'LOYALTY' },
    loadComponent: () =>
      import('./features/customer-tools/travel-companion/travel-companion.component').then(
        (m) => m.TravelCompanionComponent,
      ),
  },
  {
    path: 'expense-tracker',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES, tool: 'EXPENSES' },
    loadComponent: () =>
      import('./features/customer-tools/travel-companion/travel-companion.component').then(
        (m) => m.TravelCompanionComponent,
      ),
  },
  {
    path: 'emergency-contacts',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES, tool: 'EMERGENCY' },
    loadComponent: () =>
      import('./features/customer-tools/travel-companion/travel-companion.component').then(
        (m) => m.TravelCompanionComponent,
      ),
  },
  {
    path: 'travel-checklist',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES, tool: 'CHECKLIST' },
    loadComponent: () =>
      import('./features/customer-tools/travel-companion/travel-companion.component').then(
        (m) => m.TravelCompanionComponent,
      ),
  },
  {
    path: 'currency-converter',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES, tool: 'CURRENCY' },
    loadComponent: () =>
      import('./features/customer-tools/travel-companion/travel-companion.component').then(
        (m) => m.TravelCompanionComponent,
      ),
  },

  // Hotel Management
  {
    path: 'hotel-management',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/hospitality/hotel-management/hotel-management.component').then(
        (m) => m.HotelManagementComponent,
      ),
  },
  {
    path: 'hotel-inventory',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/hospitality/hotel-inventory/hotel-inventory.component').then(
        (m) => m.HotelInventoryComponent,
      ),
  },

  // Restaurant Management
  {
    path: 'restaurant-management',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/restaurant/restaurant-management/restaurant-management.component').then(
        (m) => m.RestaurantManagementComponent,
      ),
  },
  {
    path: 'restaurant-operations',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/restaurant/restaurant-operations/restaurant-operations.component').then(
        (m) => m.RestaurantOperationsComponent,
      ),
  },

  // Tour Package Management
  {
    path: 'tour-package-management',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/tourism/tour-package-management/tour-package-management.component').then(
        (m) => m.TourPackageManagementComponent,
      ),
  },
  {
    path: 'agency-operations',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/tourism/agency-operations/agency-operations.component').then(
        (m) => m.AgencyOperationsComponent,
      ),
  },

  // Tour Guide Management
  {
    path: 'tour-guide-management',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/tourism/tour-guide-management/tour-guide-management.component').then(
        (m) => m.TourGuideManagementComponent,
      ),
  },
  {
    path: 'guide-availability',
    pathMatch: 'full',
    redirectTo: 'tour-guide-management',
  },

  // Transport Management
  {
    path: 'transport-management',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/transport/transport-management/transport-management.component').then(
        (m) => m.TransportManagementComponent,
      ),
  },
  {
    path: 'transport-dispatch',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/transport/transport-dispatch/transport-dispatch.component').then(
        (m) => m.TransportDispatchComponent,
      ),
  },

  // Connected traveler and platform operations
  {
    path: 'traveler-safety',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/support/traveler-safety/traveler-safety.component').then(
        (m) => m.TravelerSafetyComponent,
      ),
  },
  {
    path: 'traveler-chat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/support/traveler-chat/traveler-chat.component').then(
        (m) => m.TravelerChatComponent,
      ),
  },
  {
    path: 'mobile-companion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/mobile/mobile-companion/mobile-companion.component').then(
        (m) => m.MobileCompanionComponent,
      ),
  },
  {
    path: 'localization',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/platform/localization/localization.component').then(
        (m) => m.LocalizationComponent,
      ),
  },

  // Support
  {
    path: 'support',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/support/support-center/support-center.component').then(
        (m) => m.SupportCenterComponent,
      ),
  },

  // Weather
  {
    path: 'weather',
    loadComponent: () =>
      import('./features/weather/weather-dashboard/weather-dashboard.component').then(
        (m) => m.WeatherDashboardComponent,
      ),
  },

  // Reports Analytics
  {
    path: 'reports-analytics',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: [...ADMIN_ROLES, ...FINANCE_ROLES],
    },
    loadComponent: () =>
      import('./features/reports/reports-analytics/reports-analytics.component').then(
        (m) => m.ReportsAnalyticsComponent,
      ),
  },

  // Content Management
  {
    path: 'content-management',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: CONTENT_ROLES,
    },
    loadComponent: () =>
      import('./features/cms/content-management/content-management.component').then(
        (m) => m.ContentManagementComponent,
      ),
  },

  // Settings
  {
    path: 'settings',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/settings/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
  },

  // User Directory
  {
    path: 'user-directory',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/user-management/user-directory/user-directory.component').then(
        (m) => m.UserDirectoryComponent,
      ),
  },

  // Admin Dashboard
    {
      path: 'partner-management',
      canActivate: [authGuard, roleGuard],
      data: { roles: ADMIN_ROLES },
      loadComponent: () =>
        import('./features/admin/partner-management/partner-management.component').then(
          (m) => m.PartnerManagementComponent,
        ),
    },
  {
    path: 'admin-dashboard',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/admin/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },

  // Admin Audit
  {
    path: 'admin-audit',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ADMIN_ROLES,
    },
    loadComponent: () =>
      import('./features/admin/admin-audit/admin-audit.component').then(
        (m) => m.AdminAuditComponent,
      ),
  },
  {
    path: 'admin-reports',
    canActivate: [authGuard, roleGuard],
    data: { roles: [...ADMIN_ROLES, ...FINANCE_ROLES] },
    loadComponent: () =>
      import('./features/admin/admin-reports/admin-reports.component').then(
        (m) => m.AdminReportsComponent,
      ),
  },
  {
    path: 'admin-booking-management',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES, operation: 'BOOKINGS' },
    loadComponent: () =>
      import('./features/admin/operations-console/operations-console.component').then(
        (m) => m.OperationsConsoleComponent,
      ),
  },
  {
    path: 'admin-payment-management',
    canActivate: [authGuard, roleGuard],
    data: { roles: [...ADMIN_ROLES, ...FINANCE_ROLES], operation: 'PAYMENTS' },
    loadComponent: () =>
      import('./features/admin/operations-console/operations-console.component').then(
        (m) => m.OperationsConsoleComponent,
      ),
  },
  {
    path: 'admin-coupon-management',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES, operation: 'COUPONS' },
    loadComponent: () =>
      import('./features/admin/operations-console/operations-console.component').then(
        (m) => m.OperationsConsoleComponent,
      ),
  },
  {
    path: 'listing-approvals',
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () =>
      import('./features/admin/listing-approvals/listing-approvals.component').then(
        (m) => m.ListingApprovalsComponent,
      ),
  },

  // Partner Performance
  {
    path: 'partner-dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: PARTNER_ROLES },
    loadComponent: () =>
      import('./features/partner-dashboard/partner-dashboard.component').then(
        (m) => m.PartnerDashboardComponent,
      ),
  },
  {
    path: 'partner-performance',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: PARTNER_ROLES,
    },
    loadComponent: () =>
      import('./features/partners/partner-performance/partner-performance.component').then(
        (m) => m.PartnerPerformanceComponent,
      ),
  },

  // Hotel details
  {
    path: 'hotel-details',
    loadComponent: () =>
      import('./features/hospitality/hotel-details/hotel-details.component').then(
        (m) => m.HotelDetailsComponent,
      ),
  },

  // Tour package details
  {
    path: 'tour-package-details',
    loadComponent: () =>
      import('./features/tourism/tour-package-details/tour-package-details.component').then(
        (m) => m.TourPackageDetailsComponent,
      ),
  },

  // Restaurant details
  {
    path: 'restaurant-details',
    loadComponent: () =>
      import('./features/restaurant/restaurant-details/restaurant-details.component').then(
        (m) => m.RestaurantDetailsComponent,
      ),
  },

  // Tour guide details
  {
    path: 'tour-guide-details',
    loadComponent: () =>
      import('./features/tourism/tour-guide-details/tour-guide-details.component').then(
        (m) => m.TourGuideDetailsComponent,
      ),
  },

  // Booking details
  {
    path: 'booking-details',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES },
    loadComponent: () =>
      import('./features/booking/booking-details/booking-details.component').then(
        (m) => m.BookingDetailsComponent,
      ),
  },

  // Checkout
  {
    path: 'checkout',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES },
    loadComponent: () =>
      import('./features/booking/checkout/checkout.component').then(
        (m) => m.CheckoutComponent,
      ),
  },

  // Payment result
  {
    path: 'payment-result',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES },
    loadComponent: () =>
      import('./features/payment/payment-result/payment-result.component').then(
        (m) => m.PaymentResultComponent,
      ),
  },

  // Search results
  {
    path: 'search-results',
    loadComponent: () =>
      import('./features/search/search-results/search-results.component').then(
        (m) => m.SearchResultsComponent,
      ),
  },

  // Compare services
  {
    path: 'compare-services',
    loadComponent: () =>
      import('./features/search/compare-services/compare-services.component').then(
        (m) => m.CompareServicesComponent,
      ),
  },

  // Coupons & Offers
  {
    path: 'coupons-offers',
    loadComponent: () =>
      import('./features/offers/coupons-offers/coupons-offers.component').then(
        (m) => m.CouponsOffersComponent,
      ),
  },

  // Partners registration
  {
    path: 'partner-registration',
    loadComponent: () =>
      import('./features/partners/partner-registration/partner-registration.component').then(
        (m) => m.PartnerRegistrationComponent,
      ),
  },

  // Partner profile
  {
    path: 'partner-profile',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: PARTNER_ROLES,
    },
    loadComponent: () =>
      import('./features/partners/partner-profile/partner-profile.component').then(
        (m) => m.PartnerProfileComponent,
      ),
  },
  {
    path: 'partner-team',
    canActivate: [authGuard, roleGuard],
    data: { roles: PARTNER_ADMIN_ROLES },
    loadComponent: () =>
      import('./features/partners/partner-team/partner-team.component').then(
        (m) => m.PartnerTeamComponent,
      ),
  },
  {
    path: 'partner-listings',
    canActivate: [authGuard, roleGuard],
    data: { roles: PARTNER_ROLES },
    loadComponent: () =>
      import('./features/partners/partner-listings/partner-listings.component').then(
        (m) => m.PartnerListingsComponent,
      ),
  },
  {
    path: 'partner-listings/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: PARTNER_ROLES },
    loadComponent: () =>
      import('./features/partners/add-listing/add-listing.component').then(
        (m) => m.AddListingComponent,
      ),
  },
  {
    path: 'partner-bookings',
    canActivate: [authGuard, roleGuard],
    data: { roles: PARTNER_ROLES },
    loadComponent: () =>
      import('./features/partners/partner-bookings/partner-bookings.component').then(
        (m) => m.PartnerBookingsComponent,
      ),
  },

  // Customer reviews
  {
    path: 'customer-reviews-management',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: PARTNER_ROLES,
    },
    loadComponent: () =>
      import('./features/reviews/customer-reviews-management/customer-reviews-management.component').then(
        (m) => m.CustomerReviewsManagementComponent,
      ),
  },

  // Refund request and administrative review use the same workflow component.
  {
    path: 'refund-request',
    canActivate: [authGuard, roleGuard],
    data: { roles: CUSTOMER_ROLES, management: false },
    loadComponent: () =>
      import('./features/refund/refund-management/refund-management.component').then(
        (m) => m.RefundManagementComponent,
      ),
  },
  {
    path: 'admin-refunds',
    canActivate: [authGuard, roleGuard],
    data: { roles: [...ADMIN_ROLES, ...FINANCE_ROLES], management: true },
    loadComponent: () =>
      import('./features/refund/refund-management/refund-management.component').then(
        (m) => m.RefundManagementComponent,
      ),
  },

  // Notifications center
  {
    path: 'notification-center',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/inbox/inbox.component').then(
        (m) => m.InboxComponent,
      ),
  },

  // FAQ
  {
    path: 'faq',
    loadComponent: () =>
      import('./features/support/faq-knowledge-base/faq-knowledge-base.component').then(
        (m) => m.FaqKnowledgeBaseComponent,
      ),
  },

  // Super Admin
  {
    path: 'super-admin',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['SUPER_ADMIN'],
    },
    loadComponent: () =>
      import('./features/admin/super-admin/super-admin.component').then(
        (m) => m.SuperAdminComponent,
      ),
  },

  // Unknown route
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
