export interface Hotel {
  id: number;

  name: string;
  description: string;

  destinationId: number;

  address: string;
  phone: string;
  email?: string;

  imageUrl?: string;

  starRating: 1 | 2 | 3 | 4 | 5;

  rating?: number;

  pricePerNight: number;

  amenities: string[];

  featured: boolean;

  status: 'ACTIVE' | 'INACTIVE';

  createdAt?: string;
  updatedAt?: string;
}
