import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface TransportRouteApi { id: number; organizationId: number; originDestinationId: number | null; destinationId: number | null; originName: string; destinationName: string; distanceKm: number | null; status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'; }
export type TransportRouteRequest = Omit<TransportRouteApi, 'id'>;
export interface TransportAssignmentApi { id: number; vehicleId: number; driverProfileId: number; startsAt: string; endsAt: string | null; }
export type TransportAssignmentRequest = Omit<TransportAssignmentApi, 'id'>;
export interface DriverProfileApi { id: number; userName: string; organizationId: number; organizationName: string; licenseReference: string | null; status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'; }
export type DriverProfileRequest = Pick<DriverProfileApi, 'userName' | 'organizationId' | 'licenseReference' | 'status'>;
export interface TransportTicketApi { id: number; scheduleId: number; seatNumber: string; status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED'; price: number; currency: string; }
export interface TransportScheduleApi { id: number; organizationId: number; routeId: number; originName: string; destinationName: string; vehicleId: number; vehicleType: 'BUS' | 'MINIBUS' | 'CAR' | 'VAN' | 'BOAT' | 'TRAIN' | 'OTHER'; providerName: string; vehicleLabel: string; departureAt: string; arrivalAt: string; ticketPrice: number; currency: 'BDT' | 'USD' | 'EUR' | 'GBP'; status: 'SCHEDULED' | 'FULL' | 'CANCELLED' | 'COMPLETED'; seatCapacity: number; availableSeats: number; }
export interface TransportVehicleApi { id: number; organizationId: number; organizationName: string; vehicleType: 'BUS' | 'MINIBUS' | 'CAR' | 'VAN' | 'BOAT' | 'TRAIN' | 'OTHER'; registrationNumber: string; make: string | null; modelName: string | null; seatCapacity: number; status: 'ACTIVE' | 'IN_SERVICE' | 'MAINTENANCE' | 'RETIRED'; }
export type TransportVehicleRequest = Omit<TransportVehicleApi, 'id' | 'organizationName'>;
export type TransportScheduleRequest = Pick<TransportScheduleApi, 'organizationId' | 'routeId' | 'vehicleId' | 'departureAt' | 'arrivalAt' | 'ticketPrice' | 'currency' | 'status'>;

@Injectable({ providedIn: 'root' })
export class TransportService {
  private readonly base: string;
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) config: ApiConfig) {
    this.base = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}`;
  }
  getRoutes(): Observable<TransportRouteApi[]> { return this.http.get<TransportRouteApi[]>(`${this.base}/transport-routes`); }
  getRoute(id: number): Observable<TransportRouteApi> { return this.http.get<TransportRouteApi>(`${this.base}/transport-routes/${id}`); }
  createRoute(request: TransportRouteRequest): Observable<TransportRouteApi> { return this.http.post<TransportRouteApi>(`${this.base}/transport-routes`, request); }
  updateRoute(id: number, request: TransportRouteRequest): Observable<TransportRouteApi> { return this.http.put<TransportRouteApi>(`${this.base}/transport-routes/${id}`, request); }
  deleteRoute(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/transport-routes/${id}`); }
  getSchedules(): Observable<TransportScheduleApi[]> { return this.http.get<TransportScheduleApi[]>(`${this.base}/transport-schedules`); }
  getPublicSchedules(): Observable<TransportScheduleApi[]> { return this.http.get<TransportScheduleApi[]>(`${this.base}/transport-schedules/public`); }
  createSchedule(request: TransportScheduleRequest): Observable<TransportScheduleApi> { return this.http.post<TransportScheduleApi>(`${this.base}/transport-schedules`, request); }
  updateSchedule(id: number, request: TransportScheduleRequest): Observable<TransportScheduleApi> { return this.http.put<TransportScheduleApi>(`${this.base}/transport-schedules/${id}`, request); }
  cancelSchedule(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/transport-schedules/${id}`); }
  getVehicles(): Observable<TransportVehicleApi[]> { return this.http.get<TransportVehicleApi[]>(`${this.base}/transport-vehicles`); }
  createVehicle(request: TransportVehicleRequest): Observable<TransportVehicleApi> { return this.http.post<TransportVehicleApi>(`${this.base}/transport-vehicles`, request); }
  updateVehicle(id: number, request: TransportVehicleRequest): Observable<TransportVehicleApi> { return this.http.put<TransportVehicleApi>(`${this.base}/transport-vehicles/${id}`, request); }
  retireVehicle(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/transport-vehicles/${id}`); }
  getAssignments(): Observable<TransportAssignmentApi[]> { return this.http.get<TransportAssignmentApi[]>(`${this.base}/transport-assignments`); }
  getAssignment(id: number): Observable<TransportAssignmentApi> { return this.http.get<TransportAssignmentApi>(`${this.base}/transport-assignments/${id}`); }
  createAssignment(request: TransportAssignmentRequest): Observable<TransportAssignmentApi> { return this.http.post<TransportAssignmentApi>(`${this.base}/transport-assignments`, request); }
  updateAssignment(id: number, request: TransportAssignmentRequest): Observable<TransportAssignmentApi> { return this.http.put<TransportAssignmentApi>(`${this.base}/transport-assignments/${id}`, request); }
  deleteAssignment(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/transport-assignments/${id}`); }
  getDriverProfiles(): Observable<DriverProfileApi[]> { return this.http.get<DriverProfileApi[]>(`${this.base}/driver-profiles`); }
  createDriverProfile(request: DriverProfileRequest): Observable<DriverProfileApi> { return this.http.post<DriverProfileApi>(`${this.base}/driver-profiles`, request); }
  updateDriverProfile(id: number, request: DriverProfileRequest): Observable<DriverProfileApi> { return this.http.put<DriverProfileApi>(`${this.base}/driver-profiles/${id}`, request); }
  deactivateDriverProfile(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/driver-profiles/${id}`); }
}
