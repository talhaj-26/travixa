
import { UserRole } from './user.model';

export const CUSTOMER_ROLES: readonly UserRole[] = ['CUSTOMER'];

export const HOTEL_ROLES: readonly UserRole[] = [
  'HOTEL_PARTNER',
  'HOTEL_STAFF',
  'PARTNER',
];

export const RESTAURANT_ROLES: readonly UserRole[] = [
  'RESTAURANT_PARTNER',
  'RESTAURANT_STAFF',
  'PARTNER',
];

export const AGENCY_ROLES: readonly UserRole[] = [
  'TRAVEL_AGENCY_PARTNER',
  'TRAVEL_AGENCY_STAFF',
  'PARTNER',
];

export const GUIDE_ROLES: readonly UserRole[] = [
  'TOUR_GUIDE',
  'PARTNER',
];

export const TRANSPORT_ROLES: readonly UserRole[] = [
  'TRANSPORT_PROVIDER',
  'DRIVER',
  'PARTNER',
];

export const SUPPORT_ROLES: readonly UserRole[] = [
  'SUPPORT_EXECUTIVE',
  'STAFF',
];

export const FINANCE_ROLES: readonly UserRole[] = [
  'FINANCE_ACCOUNTANT',
];

export const ADMIN_ROLES: readonly UserRole[] = [
  'ADMIN',
  'SUPER_ADMIN',
];

export const SUPER_ADMIN_ROLES: readonly UserRole[] = [
  'SUPER_ADMIN',
];

export const CONTENT_ROLES: readonly UserRole[] = [
  'CONTENT_MANAGER',
];

export const PARTNER_ROLES: readonly UserRole[] = [
  'HOTEL_PARTNER',
  'HOTEL_STAFF',
  'RESTAURANT_PARTNER',
  'RESTAURANT_STAFF',
  'TRAVEL_AGENCY_PARTNER',
  'TRAVEL_AGENCY_STAFF',
  'TOUR_GUIDE',
  'TRANSPORT_PROVIDER',
  'DRIVER',
  'PARTNER',
];

export const PARTNER_ADMIN_ROLES: readonly UserRole[] = [
  'HOTEL_PARTNER',
  'RESTAURANT_PARTNER',
  'TRAVEL_AGENCY_PARTNER',
  'TOUR_GUIDE',
  'TRANSPORT_PROVIDER',
  'PARTNER',
];
