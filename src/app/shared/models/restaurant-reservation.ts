export type RestaurantReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface RestaurantReservation {
  id: number;
  reference: string;
  restaurantId: number;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  tableId?: number;
  specialRequest?: string;
  status: RestaurantReservationStatus;
  createdAt: string;
}
