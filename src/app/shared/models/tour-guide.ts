export type TourGuideStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
export type GuideAvailability = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export interface GuideOffering {
  id: number;
  name: string;
  description: string;
  price: number;
  pricingUnit: 'PER_DAY' | 'PER_HOUR' | 'PER_GROUP';
  active: boolean;
}

export interface TourGuideReview {
  id: number;
  guideId: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface TourGuideBooking {
  id: number;
  guideId: number;
  customerName: string;
  travelDate: string;
  guests: number;
  serviceName: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface TourGuide {
  id: number;
  guideId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  bio: string;
  languages: string[];
  expertise: string[];
  location: string;
  phone: string;
  email: string;
  status: TourGuideStatus;
  availability: GuideAvailability;
  pricePerDay: number;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  yearsExperience: number;
  services: GuideOffering[];
}
