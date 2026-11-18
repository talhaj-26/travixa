export type UserRole =
  | 'CUSTOMER'
  | 'HOTEL_PARTNER'
  | 'HOTEL_STAFF'
  | 'RESTAURANT_PARTNER'
  | 'RESTAURANT_STAFF'
  | 'TRAVEL_AGENCY_PARTNER'
  | 'TRAVEL_AGENCY_STAFF'
  | 'TOUR_GUIDE'
  | 'TRANSPORT_PROVIDER'
  | 'DRIVER'
  | 'SUPPORT_EXECUTIVE'
  | 'FINANCE_ACCOUNTANT'
  | 'CONTENT_MANAGER'
  | 'ADMIN'
  | 'ROLE_USER'
  | 'SUPER_ADMIN'
  | 'PARTNER'
  | 'STAFF';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BLOCKED'
  | 'SUSPENDED'
  | 'PENDING_APPROVAL';

export type Gender = 'Male' | 'Female' | 'Other';

export interface User {
  id: number;
  username?: string;
  // Identity
  usersid: string;
  name: string;
  email: string;

  // Personal Information
  age: number;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  address: string;

  // Professional / Account Information
  department: string;
  skills: string[];
  salary?: number;

  // Account Status
  role: UserRole;
  active: boolean;
  status: UserStatus;

  // Profile
  profileImage?: string;

  // Security
  // Password must NEVER be returned by the backend.
  // It will be handled securely by Spring Security.
  password?: never;

  // Audit
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  enabled: boolean;
  roles: string[];
  dateCreated: string | null;
  lastUpdated: string | null;
}

export interface UserProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Request sent to POST /api/users */
export interface UserCreateRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
}

/** Response returned by the backend UserController */
export interface UserResponse {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  enabled: boolean;
  roles: string[];
  dateCreated: string | null;
  lastUpdated: string | null;
}

/** Request sent to PUT /api/users/{username} */
export interface UserUpdateRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Request sent to PATCH /api/users/{username}/status */
export interface UserStatusUpdateRequest {
  enabled: boolean;
}