export type RestaurantTableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'INACTIVE';

export interface RestaurantTable {
  id: number;
  restaurantId: number;
  tableNumber: string;
  capacity: number;
  location: string;
  status: RestaurantTableStatus;
}
