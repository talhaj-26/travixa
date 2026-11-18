
export interface DashboardBooking {
  id: number;
  referenceNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  placedAt: string | null;
}

export interface DashboardResponse {
  role: string;
  displayName: string;
  scope: string;

  totalUsers: number;
  activeUsers: number;

  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;

  totalHotels: number;
  totalRestaurants: number;
  totalTourPackages: number;
  totalTourGuides: number;
  totalTransportRoutes: number;

  totalPartnerOrganizations: number;
  pendingPartnerOrganizations: number;
  pendingListings: number;

  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  paidRevenueBdt: number;

  recentBookings: DashboardBooking[];
}
