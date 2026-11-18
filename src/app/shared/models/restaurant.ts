export interface Restaurant {
  id: number;

  name: string;
  description: string;

  destinationId: number;

  address: string;
  phone: string;
  email?: string;

  imageUrl?: string;

  cuisineTypes: string[];

  rating?: number;

  priceRange: '$' | '$$' | '$$$' | '$$$$';

  openingTime?: string;
  closingTime?: string;

  featured: boolean;

  status: 'ACTIVE' | 'INACTIVE';

  createdAt?: string;
  updatedAt?: string;
}
