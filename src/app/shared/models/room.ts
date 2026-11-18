export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';

export interface Room {
  id: number;
  hotelId: number;
  roomNumber: string;
  type: 'STANDARD' | 'DELUXE' | 'SUITE' | 'FAMILY';
  description?: string;
  capacity: number;
  bedType: 'SINGLE' | 'DOUBLE' | 'TWIN' | 'KING' | 'QUEEN';
  pricePerNight: number;
  available: boolean;
  amenities: string[];
  status: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
}
