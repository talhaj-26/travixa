export interface TourPackage {
  id: number;

  title: string;
  description: string;

  destinationId: number;
  destinationName: string;

  imageUrl?: string;

  price: number;

  durationDays: number;

  activities: string[];

  featured: boolean;

  status: 'ACTIVE' | 'INACTIVE';

  createdAt?: string;
  updatedAt?: string;
}
