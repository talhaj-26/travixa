export type MenuItemStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'INACTIVE';

export interface RestaurantMenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  vegetarian: boolean;
  featured: boolean;
  status: MenuItemStatus;
}
