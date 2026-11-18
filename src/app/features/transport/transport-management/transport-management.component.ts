import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TransportRouteApi, TransportRouteRequest, TransportScheduleApi, TransportScheduleRequest, TransportService, TransportVehicleApi, TransportVehicleRequest } from '../../../core/services/transport.service';
import { PartnerOrganizationService } from '../../../core/services/partner-organization.service';

@Component({
  selector: 'app-transport-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="mobility-page"><section class="mobility-wrap">
      <header><p>TRANSPORT OPERATIONS</p><h1>Transport routes</h1><p>Route information is loaded from the Travixa API.</p></header>
      @if (error) { <p role="alert">{{ error }}</p> } @if (message) { <p role="status">{{ message }}</p> }
      <section class="route-form"><h2>{{ editingId ? 'Edit route' : 'Add route' }}</h2>
        <form (ngSubmit)="saveRoute()">
          <label>Organization<select name="organizationId" [(ngModel)]="draft.organizationId" required><option [ngValue]="0">Select organization</option>@for (org of organizations; track org.id) { <option [ngValue]="org.id">{{ org.name }} ({{ org.id }})</option> }</select></label>
          <label>Origin<input name="originName" [(ngModel)]="draft.originName" required maxlength="180"></label>
          <label>Destination<input name="destinationName" [(ngModel)]="draft.destinationName" required maxlength="180"></label>
          <label>Origin destination ID<input name="originDestinationId" type="number" min="1" [(ngModel)]="draft.originDestinationId"></label>
          <label>Destination ID<input name="destinationId" type="number" min="1" [(ngModel)]="draft.destinationId"></label>
          <label>Distance (km)<input name="distanceKm" type="number" min="0.01" step="0.01" [(ngModel)]="draft.distanceKm"></label>
          <label>Status<select name="status" [(ngModel)]="draft.status"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option></select></label>
          <button type="submit" [disabled]="busy || !draft.organizationId">{{ busy ? 'Saving…' : editingId ? 'Update route' : 'Create route' }}</button>
          @if (editingId) { <button type="button" (click)="resetForm()">Cancel edit</button> }
        </form>
      </section>
      <section class="routes"><h2>Saved routes ({{ routes.length }})</h2>
        @if (loading) { <p>Loading routes…</p> } @else if (!pageRows.length) { <p>No transport routes have been created.</p> } @else {
          @for (route of pageRows; track route.id) { <article><strong>{{ route.originName }} → {{ route.destinationName }}</strong><span>Organization #{{ route.organizationId }} · {{ route.distanceKm ?? '—' }} km · {{ route.status }}</span><div><button type="button" (click)="editRoute(route)">Edit</button>@if (route.status !== 'ARCHIVED') { <button type="button" (click)="deleteRoute(route)">Archive</button> }</div></article> }
          <nav aria-label="Transport routes pagination"><button type="button" (click)="page = page - 1" [disabled]="page === 0">Previous</button><span>Page {{ page + 1 }} of {{ pageCount }}</span><button type="button" (click)="page = page + 1" [disabled]="page + 1 >= pageCount">Next</button></nav>
        }
      </section>
      <section class="route-form"><h2>{{ editingScheduleId ? 'Edit schedule' : 'Add transport schedule' }}</h2>
        <form (ngSubmit)="saveSchedule()">
          <label>Organization<select name="scheduleOrganization" [(ngModel)]="scheduleDraft.organizationId" required><option [ngValue]="0">Select organization</option>@for (org of organizations; track org.id) { <option [ngValue]="org.id">{{ org.name }} ({{ org.id }})</option> }</select></label>
          <label>Route<select name="routeId" [(ngModel)]="scheduleDraft.routeId" required><option [ngValue]="0">Select active route</option>@for (route of routes; track route.id) { @if (route.status === 'ACTIVE') { <option [ngValue]="route.id">{{ route.originName }} → {{ route.destinationName }} · #{{ route.id }}</option> } }</select></label>
          <label>Vehicle<select name="vehicleId" [(ngModel)]="scheduleDraft.vehicleId" required><option [ngValue]="0">Select active vehicle</option>@for (vehicle of vehicles; track vehicle.id) { @if (vehicle.status === 'ACTIVE' && vehicle.organizationId === scheduleDraft.organizationId) { <option [ngValue]="vehicle.id">{{ vehicle.registrationNumber }} · {{ vehicle.vehicleType }} · {{ vehicle.seatCapacity }} seats</option> } }</select></label>
          <label>Departure<input name="departureAt" type="datetime-local" [(ngModel)]="scheduleDeparture" required></label>
          <label>Arrival<input name="arrivalAt" type="datetime-local" [(ngModel)]="scheduleArrival" required></label>
          <label>Ticket price<input name="ticketPrice" type="number" min="0.01" step="0.01" [(ngModel)]="scheduleDraft.ticketPrice" required></label>
          <label>Currency<select name="currency" [(ngModel)]="scheduleDraft.currency"><option value="BDT">BDT</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
          <label>Status<select name="scheduleStatus" [(ngModel)]="scheduleDraft.status"><option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label>
          <button type="submit" [disabled]="busy || !scheduleDraft.organizationId || !scheduleDraft.routeId || !scheduleDraft.vehicleId">{{ editingScheduleId ? 'Update schedule' : 'Create schedule' }}</button>@if (editingScheduleId) { <button type="button" (click)="resetSchedule()">Cancel edit</button> }
        </form>
      </section>
      <section class="routes"><h2>Schedules ({{ schedules.length }})</h2>@if (scheduleLoading) { <p>Loading schedules…</p> } @else if (!scheduleRows.length) { <p>No schedules have been created.</p> } @else { @for (schedule of scheduleRows; track schedule.id) { <article><strong>{{ schedule.originName }} → {{ schedule.destinationName }}</strong><span>{{ schedule.departureAt | date:'medium' }} · {{ schedule.ticketPrice }} {{ schedule.currency }} · {{ schedule.availableSeats }}/{{ schedule.seatCapacity }} seats · {{ schedule.status }}</span><div><button type="button" (click)="editSchedule(schedule)">Edit</button>@if (schedule.status === 'SCHEDULED') { <button type="button" (click)="cancelSchedule(schedule)">Cancel schedule</button> }</div></article> }<nav><button type="button" (click)="schedulePage = schedulePage - 1" [disabled]="schedulePage === 0">Previous</button><span>Page {{ schedulePage + 1 }} of {{ schedulePageCount }}</span><button type="button" (click)="schedulePage = schedulePage + 1" [disabled]="schedulePage + 1 >= schedulePageCount">Next</button></nav> }</section>
      <section class="route-form"><h2>{{ editingVehicleId ? 'Edit vehicle' : 'Add vehicle' }}</h2><form (ngSubmit)="saveVehicle()"><label>Organization<select name="vehicleOrganization" [(ngModel)]="vehicleDraft.organizationId" required><option [ngValue]="0">Select organization</option>@for (org of organizations; track org.id) { <option [ngValue]="org.id">{{ org.name }} · #{{ org.id }}</option> }</select></label><label>Type<select name="vehicleType" [(ngModel)]="vehicleDraft.vehicleType"><option value="BUS">Bus</option><option value="MINIBUS">Minibus</option><option value="CAR">Car</option><option value="VAN">Van</option><option value="BOAT">Boat</option><option value="TRAIN">Train</option><option value="OTHER">Other</option></select></label><label>Registration<input name="registration" [(ngModel)]="vehicleDraft.registrationNumber" required maxlength="32"></label><label>Make<input name="make" [(ngModel)]="vehicleDraft.make" maxlength="80"></label><label>Model<input name="modelName" [(ngModel)]="vehicleDraft.modelName" maxlength="80"></label><label>Seat capacity<input name="seatCapacity" type="number" min="1" [(ngModel)]="vehicleDraft.seatCapacity" required></label><label>Status<select name="vehicleStatus" [(ngModel)]="vehicleDraft.status"><option value="ACTIVE">Active</option><option value="IN_SERVICE">In service</option><option value="MAINTENANCE">Maintenance</option></select></label><button type="submit" [disabled]="busy || !vehicleDraft.organizationId">{{ editingVehicleId ? 'Update vehicle' : 'Create vehicle' }}</button>@if (editingVehicleId) { <button type="button" (click)="resetVehicle()">Cancel edit</button> }</form></section>
      <section class="routes"><h2>Vehicles ({{ vehicles.length }})</h2>@if (vehicleLoading) { <p>Loading vehicles…</p> } @else if (!vehicleRows.length) { <p>No vehicles have been created.</p> } @else { @for (vehicle of vehicleRows; track vehicle.id) { <article><strong>{{ vehicle.registrationNumber }} · {{ vehicle.vehicleType }}</strong><span>{{ vehicle.organizationName }} · {{ vehicle.make }} {{ vehicle.modelName }} · {{ vehicle.seatCapacity }} seats · {{ vehicle.status }}</span><div>@if (vehicle.status !== 'RETIRED') { <button type="button" (click)="editVehicle(vehicle)">Edit</button><button type="button" (click)="retireVehicle(vehicle)">Retire</button> }</div></article> }<nav><button type="button" (click)="vehiclePage = vehiclePage - 1" [disabled]="vehiclePage === 0">Previous</button><span>Page {{ vehiclePage + 1 }} of {{ vehiclePageCount }}</span><button type="button" (click)="vehiclePage = vehiclePage + 1" [disabled]="vehiclePage + 1 >= vehiclePageCount">Next</button></nav> }</section>
    </section></main>
  `,
  styleUrl: './transport-management.component.scss'
})
export class TransportManagementComponent implements OnInit {
  routes: TransportRouteApi[] = [];
  schedules: TransportScheduleApi[] = [];
  vehicles: TransportVehicleApi[] = [];
  organizations: { id: number; name: string }[] = [];
  loading = true; scheduleLoading = true; vehicleLoading = true;
  busy = false;
  page = 0;
  schedulePage = 0;
  vehiclePage = 0;
  readonly pageSize = 6;
  editingId: number | null = null;
  editingScheduleId: number | null = null;
  editingVehicleId: number | null = null;
  error = '';
  message = '';
  draft: TransportRouteRequest = this.emptyDraft();
  scheduleDraft: TransportScheduleRequest = this.emptyScheduleDraft(); scheduleDeparture = ''; scheduleArrival = '';
  vehicleDraft: TransportVehicleRequest = this.emptyVehicleDraft();

  constructor(private readonly transport: TransportService, private readonly organizationService: PartnerOrganizationService) {}
  ngOnInit(): void { this.load(); this.organizationService.getAll().subscribe({ next: values => this.organizations = values, error: () => this.error = 'Could not load organizations from the API.' }); }
  get pageRows(): TransportRouteApi[] { return this.routes.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize); }
  get pageCount(): number { return Math.max(1, Math.ceil(this.routes.length / this.pageSize)); }
  get scheduleRows(): TransportScheduleApi[] { return this.schedules.slice(this.schedulePage * this.pageSize, (this.schedulePage + 1) * this.pageSize); }
  get schedulePageCount(): number { return Math.max(1, Math.ceil(this.schedules.length / this.pageSize)); }
  get vehicleRows(): TransportVehicleApi[] { return this.vehicles.slice(this.vehiclePage * this.pageSize, (this.vehiclePage + 1) * this.pageSize); }
  get vehiclePageCount(): number { return Math.max(1, Math.ceil(this.vehicles.length / this.pageSize)); }

  saveRoute(): void {
    if (!this.draft.organizationId || !this.draft.originName.trim() || !this.draft.destinationName.trim()) return;
    this.busy = true; this.error = ''; this.message = '';
    const request = { ...this.draft, originName: this.draft.originName.trim(), destinationName: this.draft.destinationName.trim(), originDestinationId: this.draft.originDestinationId || null, destinationId: this.draft.destinationId || null, distanceKm: this.draft.distanceKm || null };
    const operation = this.editingId ? this.transport.updateRoute(this.editingId, request) : this.transport.createRoute(request);
    operation.subscribe({ next: () => { this.message = this.editingId ? 'Route updated.' : 'Route created.'; this.resetForm(); this.load(); }, error: e => { this.error = e?.error?.message ?? 'Route could not be saved.'; this.busy = false; } });
  }
  editRoute(route: TransportRouteApi): void { this.editingId = route.id; this.draft = { organizationId: route.organizationId, originDestinationId: route.originDestinationId, destinationId: route.destinationId, originName: route.originName, destinationName: route.destinationName, distanceKm: route.distanceKm, status: route.status }; this.message = ''; }
  deleteRoute(route: TransportRouteApi): void { if (!confirm(`Archive ${route.originName} → ${route.destinationName}? Existing schedules will remain linked.`)) return; this.error = ''; this.transport.deleteRoute(route.id).subscribe({ next: () => { this.message = 'Route archived.'; this.load(); }, error: e => this.error = e?.error?.message ?? 'Route could not be archived.' }); }
  resetForm(): void { this.editingId = null; this.draft = this.emptyDraft(); this.busy = false; }
  saveSchedule(): void {
    if (!this.scheduleDraft.organizationId || !this.scheduleDraft.routeId || !this.scheduleDraft.vehicleId || !this.scheduleDeparture || !this.scheduleArrival) return;
    const departureAt = new Date(this.scheduleDeparture); const arrivalAt = new Date(this.scheduleArrival);
    if (arrivalAt <= departureAt) { this.error = 'Arrival must be after departure.'; return; }
    const request = { ...this.scheduleDraft, departureAt: departureAt.toISOString(), arrivalAt: arrivalAt.toISOString() };
    this.busy = true; this.error = '';
    (this.editingScheduleId ? this.transport.updateSchedule(this.editingScheduleId, request) : this.transport.createSchedule(request)).subscribe({ next: () => { this.message = this.editingScheduleId ? 'Schedule updated.' : 'Schedule created.'; this.resetSchedule(); this.loadSchedules(); }, error: e => { this.error = e?.error?.message ?? 'Schedule could not be saved.'; this.busy = false; } });
  }
  editSchedule(schedule: TransportScheduleApi): void { this.editingScheduleId = schedule.id; this.scheduleDraft = { organizationId: schedule.organizationId, routeId: schedule.routeId, vehicleId: schedule.vehicleId, departureAt: schedule.departureAt, arrivalAt: schedule.arrivalAt, ticketPrice: schedule.ticketPrice, currency: schedule.currency, status: schedule.status }; this.scheduleDeparture = this.toLocal(schedule.departureAt); this.scheduleArrival = this.toLocal(schedule.arrivalAt); }
  cancelSchedule(schedule: TransportScheduleApi): void { if (!confirm('Cancel this schedule? Existing bookings must be refunded or cancelled first.')) return; this.transport.cancelSchedule(schedule.id).subscribe({ next: () => { this.message = 'Schedule cancelled.'; this.loadSchedules(); }, error: e => this.error = e?.error?.message ?? 'Schedule could not be cancelled.' }); }
  resetSchedule(): void { this.editingScheduleId = null; this.scheduleDraft = this.emptyScheduleDraft(); this.scheduleDeparture = ''; this.scheduleArrival = ''; this.busy = false; }
  saveVehicle(): void {
    if (!this.vehicleDraft.organizationId || !this.vehicleDraft.registrationNumber.trim() || this.vehicleDraft.seatCapacity < 1) return;
    const request: TransportVehicleRequest = { ...this.vehicleDraft, registrationNumber: this.vehicleDraft.registrationNumber.trim(), make: this.vehicleDraft.make || null, modelName: this.vehicleDraft.modelName || null };
    this.busy = true; this.error = '';
    const operation = this.editingVehicleId ? this.transport.updateVehicle(this.editingVehicleId, request) : this.transport.createVehicle(request);
    operation.subscribe({ next: () => { this.message = this.editingVehicleId ? 'Vehicle updated.' : 'Vehicle created.'; this.resetVehicle(); this.loadVehicles(); }, error: e => { this.error = e?.error?.message ?? 'Vehicle could not be saved.'; this.busy = false; } });
  }
  editVehicle(vehicle: TransportVehicleApi): void { this.editingVehicleId = vehicle.id; this.vehicleDraft = { organizationId: vehicle.organizationId, vehicleType: vehicle.vehicleType, registrationNumber: vehicle.registrationNumber, make: vehicle.make, modelName: vehicle.modelName, seatCapacity: vehicle.seatCapacity, status: vehicle.status }; }
  retireVehicle(vehicle: TransportVehicleApi): void { if (!confirm(`Retire ${vehicle.registrationNumber}?`)) return; this.transport.retireVehicle(vehicle.id).subscribe({ next: () => { this.message = 'Vehicle retired.'; this.loadVehicles(); }, error: e => this.error = e?.error?.message ?? 'Vehicle could not be retired.' }); }
  resetVehicle(): void { this.editingVehicleId = null; this.vehicleDraft = this.emptyVehicleDraft(); this.busy = false; }
  private load(): void { this.loading = true; this.transport.getRoutes().subscribe({ next: values => { this.routes = values; this.page = Math.min(this.page, this.pageCount - 1); this.loading = false; this.busy = false; }, error: e => { this.error = e?.error?.message ?? 'Could not load routes from the API.'; this.loading = false; this.busy = false; } }); this.loadSchedules(); this.loadVehicles(); }
  private loadVehicles(): void { this.vehicleLoading = true; this.transport.getVehicles().subscribe({ next: values => { this.vehicles = values; this.vehiclePage = Math.min(this.vehiclePage, this.vehiclePageCount - 1); this.vehicleLoading = false; this.busy = false; }, error: e => { this.error = e?.error?.message ?? 'Could not load vehicles.'; this.vehicleLoading = false; this.busy = false; } }); }
  private loadSchedules(): void { this.scheduleLoading = true; this.transport.getSchedules().subscribe({ next: values => { this.schedules = values; this.schedulePage = Math.min(this.schedulePage, this.schedulePageCount - 1); this.scheduleLoading = false; this.busy = false; }, error: e => { this.error = e?.error?.message ?? 'Could not load schedules.'; this.scheduleLoading = false; this.busy = false; } }); }
  private toLocal(value: string): string { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  private emptyScheduleDraft(): TransportScheduleRequest { return { organizationId: 0, routeId: 0, vehicleId: 0, departureAt: '', arrivalAt: '', ticketPrice: 0, currency: 'BDT', status: 'SCHEDULED' }; }
  private emptyVehicleDraft(): TransportVehicleRequest { return { organizationId: 0, vehicleType: 'BUS', registrationNumber: '', make: null, modelName: null, seatCapacity: 1, status: 'ACTIVE' }; }
  private emptyDraft(): TransportRouteRequest { return { organizationId: 0, originDestinationId: null, destinationId: null, originName: '', destinationName: '', distanceKm: null, status: 'DRAFT' }; }
}
