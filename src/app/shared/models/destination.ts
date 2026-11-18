export interface Destination {
  id: number;

  name: string;
  country: string;
  city?: string;

  description: string;

  imageUrl?: string;

  category: 'BEACH' | 'MOUNTAIN' | 'CITY' | 'CULTURAL' | 'ADVENTURE' | 'NATURE';

  rating?: number;

  featured: boolean;

  status: 'ACTIVE' | 'INACTIVE';

  createdAt?: string;
  updatedAt?: string;
}
