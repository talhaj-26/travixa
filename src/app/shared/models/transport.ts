export type VehicleStatus = 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE' | 'INACTIVE';
export type RouteStatus = 'ACTIVE' | 'INACTIVE';
export type ScheduleStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'COMPLETED' | 'CANCELLED';
export type DriverStatus = 'AVAILABLE' | 'ASSIGNED' | 'ON_LEAVE' | 'INACTIVE';

export interface TransportVehicle {
  id: number;
  registrationNumber: string;
  type: 'BUS' | 'CAR' | 'VAN' | 'TRAIN' | 'BOAT' | 'MICROBUS';
  brand: string;
  model: string;
  capacity: number;
  pricePerTrip: number;
  availability: boolean;
  status: VehicleStatus;
  providerId?: number;
  driverId?: number;
  amenities: string[];
}

export interface TransportRoute {
  id: number;
  code: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  stops: string[];
  status: RouteStatus;
}

export interface TransportSchedule {
  id: number;
  routeId: number;
  vehicleId: number;
  departureAt: string;
  arrivalAt: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: ScheduleStatus;
}

export interface TransportDriver {
  id: number;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  vehicleId?: number;
}
