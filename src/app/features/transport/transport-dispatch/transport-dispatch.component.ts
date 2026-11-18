import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerOrganizationService } from '../../../core/services/partner-organization.service';
import { TransportService, TransportVehicleApi, DriverProfileApi, DriverProfileRequest, TransportAssignmentApi, TransportAssignmentRequest } from '../../../core/services/transport.service';
import { UserResponse } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-transport-dispatch', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <main class="dispatch-page"><div class="dispatch-shell">
      <header class="dispatch-hero"><div><span class="eyebrow">FLEET CONTROL · LIVE INVENTORY</span><h1>Transport dispatch</h1><p>Manage verified drivers, assign vehicles and review the current dispatch schedule.</p></div><div class="hero-stat"><strong>{{ assignments.length }}</strong><span>active assignments</span></div></header>
      @if (error) { <p class="notice error" role="alert">{{ error }}</p> } @if (message) { <p class="notice success" role="status">{{ message }}</p> }
      <section class="stats"><article><span>Vehicles</span><strong>{{ vehicles.length }}</strong></article><article><span>Active drivers</span><strong>{{ activeDrivers.length }}</strong></article><article><span>Dispatches</span><strong>{{ assignments.length }}</strong></article></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">OPERATIONS</span><h2>{{ editingAssignmentId ? 'Update assignment' : 'Assign a vehicle' }}</h2></div></div>
        <form class="dispatch-form" (ngSubmit)="saveAssignment()"><label>Vehicle<select name="vehicleId" [(ngModel)]="assignmentDraft.vehicleId" required><option [ngValue]="0">Choose an active vehicle</option>@for (vehicle of availableVehicles; track vehicle.id) { <option [ngValue]="vehicle.id">{{ vehicle.registrationNumber }} · {{ vehicle.vehicleType }} · {{ vehicle.organizationName }}</option> }</select></label><label>Driver<select name="driverId" [(ngModel)]="assignmentDraft.driverProfileId" required><option [ngValue]="0">Choose an active driver</option>@for (driver of activeDrivers; track driver.id) { <option [ngValue]="driver.id">{{ driver.userName }} · {{ driver.organizationName }}</option> }</select></label><label>Starts at<input name="startsAt" type="datetime-local" [(ngModel)]="startsAt" required></label><label>Ends at <small>(optional)</small><input name="endsAt" type="datetime-local" [(ngModel)]="endsAt"></label><div class="form-actions"><button class="primary" type="submit" [disabled]="busy || !assignmentDraft.vehicleId || !assignmentDraft.driverProfileId">{{ busy ? 'Saving…' : editingAssignmentId ? 'Save changes' : 'Create dispatch' }}</button>@if (editingAssignmentId) { <button class="secondary" type="button" (click)="resetForm()">Cancel</button> }</div></form>
      </section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">DISPATCH BOARD</span><h2>Vehicle assignments</h2></div><span class="count">{{ assignments.length }} records</span></div>
        @if (loading) { <p class="empty">Loading dispatch records…</p> } @else if (!assignments.length) { <p class="empty">No vehicle assignments yet. Create one above to schedule a driver.</p> } @else { <div class="table-wrap"><table><thead><tr><th>Vehicle</th><th>Driver</th><th>Start</th><th>End</th><th></th></tr></thead><tbody>@for (assignment of rows; track assignment.id) { <tr><td><strong>{{ vehicleLabel(assignment.vehicleId) }}</strong><small>{{ vehicleOrg(assignment.vehicleId) }}</small></td><td>{{ driverName(assignment.driverProfileId) }}</td><td>{{ assignment.startsAt | date:'medium' }}</td><td>{{ assignment.endsAt ? (assignment.endsAt | date:'medium') : 'Open-ended' }}</td><td class="actions"><button type="button" (click)="edit(assignment)">Edit</button><button type="button" class="danger" (click)="remove(assignment)">Remove</button></td></tr> }</tbody></table></div><nav class="pagination"><button type="button" (click)="page = page - 1" [disabled]="page === 0">Previous</button><span>Page {{ page + 1 }} of {{ pageCount }}</span><button type="button" (click)="page = page + 1" [disabled]="page + 1 >= pageCount">Next</button></nav> }
      </section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">DRIVER ROSTER</span><h2>{{ editingDriverId ? 'Update driver profile' : 'Register a driver' }}</h2></div></div><form class="dispatch-form" (ngSubmit)="saveDriver()"><label>User account<select name="userName" [(ngModel)]="driverDraft.userName" required><option value="">Choose a driver account</option>@for (user of driverUsers; track user.username) { <option [value]="user.username">{{ user.username }} · {{ user.email }}</option> }</select></label><label>Organization<select name="driverOrg" [(ngModel)]="driverDraft.organizationId" required><option [ngValue]="0">Choose organization</option>@for (org of organizations; track org.id) { <option [ngValue]="org.id">{{ org.name }}</option> }</select></label><label>License reference<input name="license" [(ngModel)]="driverDraft.licenseReference" maxlength="80"></label><label>Verification status<select name="driverStatus" [(ngModel)]="driverDraft.status"><option value="PENDING_VERIFICATION">Pending verification</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="INACTIVE">Inactive</option></select></label><div class="form-actions"><button class="primary" type="submit" [disabled]="busy || !driverDraft.userName || !driverDraft.organizationId">{{ editingDriverId ? 'Save driver' : 'Add driver' }}</button>@if (editingDriverId) { <button class="secondary" type="button" (click)="resetDriver()">Cancel</button> }</div></form><div class="driver-list">@for (driver of drivers; track driver.id) { <article><div><strong>{{ driver.userName }}</strong><span>{{ driver.organizationName }} · {{ driver.licenseReference || 'No license reference' }}</span></div><span class="status" [class.active]="driver.status === 'ACTIVE'">{{ driver.status.replace('_', ' ') }}</span><div class="actions"><button type="button" (click)="editDriver(driver)">Edit</button>@if (driver.status !== 'INACTIVE') { <button type="button" class="danger" (click)="deactivate(driver)">Deactivate</button> }</div></article>}@if (!drivers.length && !loading) { <p class="empty">No driver profiles found.</p> }</div></section>
    </div></main>
  `,
  styleUrl: './transport-dispatch.component.scss'
})
export class TransportDispatchComponent implements OnInit {
  vehicles: TransportVehicleApi[] = []; drivers: DriverProfileApi[] = []; assignments: TransportAssignmentApi[] = [];
  organizations: { id: number; name: string }[] = []; driverUsers: UserResponse[] = [];
  loading = true; busy = false; error = ''; message = ''; page = 0; readonly pageSize = 8;
  editingAssignmentId: number | null = null; editingDriverId: number | null = null; startsAt = ''; endsAt = '';
  assignmentDraft: TransportAssignmentRequest = this.emptyAssignment(); driverDraft: DriverProfileRequest = this.emptyDriver();
  constructor(private readonly transport: TransportService, private readonly orgService: PartnerOrganizationService, private readonly userService: UserService) {}
  ngOnInit(): void {
    this.load();
    this.orgService.getAll().subscribe({ next: rows => this.organizations = rows.map(({ id, name }) => ({ id, name })), error: () => this.error = 'Could not load organizations.' });
    this.userService.getAll().subscribe({ next: rows => this.driverUsers = rows.filter(user => user.roles.includes('DRIVER')), error: () => this.error = 'Could not load driver accounts.' });
  }
  get activeDrivers(): DriverProfileApi[] { return this.drivers.filter(driver => driver.status === 'ACTIVE'); }
  get availableVehicles(): TransportVehicleApi[] { return this.vehicles.filter(vehicle => vehicle.status === 'ACTIVE'); }
  get rows(): TransportAssignmentApi[] { return this.assignments.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize); }
  get pageCount(): number { return Math.max(1, Math.ceil(this.assignments.length / this.pageSize)); }
  vehicleLabel(id: number): string { const item = this.vehicles.find(value => value.id === id); return item ? `${item.registrationNumber} · ${item.vehicleType}` : `Vehicle #${id}`; }
  vehicleOrg(id: number): string { return this.vehicles.find(value => value.id === id)?.organizationName ?? ''; }
  driverName(id: number): string { return this.drivers.find(value => value.id === id)?.userName ?? `Driver #${id}`; }
  saveAssignment(): void {
    const start = new Date(this.startsAt); const end = this.endsAt ? new Date(this.endsAt) : null;
    if (end && end <= start) { this.error = 'Assignment end must be after its start.'; return; }
    this.busy = true; this.error = ''; this.message = '';
    const payload = { ...this.assignmentDraft, startsAt: start.toISOString(), endsAt: end?.toISOString() ?? null };
    const operation = this.editingAssignmentId ? this.transport.updateAssignment(this.editingAssignmentId, payload) : this.transport.createAssignment(payload);
    operation.subscribe({ next: () => { this.message = this.editingAssignmentId ? 'Assignment updated.' : 'Vehicle dispatched.'; this.resetForm(); this.loadAssignments(); }, error: error => { this.error = error?.error?.message ?? 'Assignment could not be saved.'; this.busy = false; } });
  }
  edit(item: TransportAssignmentApi): void { this.editingAssignmentId = item.id; this.assignmentDraft = { vehicleId: item.vehicleId, driverProfileId: item.driverProfileId, startsAt: item.startsAt, endsAt: item.endsAt }; this.startsAt = this.localTime(item.startsAt); this.endsAt = item.endsAt ? this.localTime(item.endsAt) : ''; }
  remove(item: TransportAssignmentApi): void { if (!confirm(`Remove dispatch assignment #${item.id}?`)) return; this.transport.deleteAssignment(item.id).subscribe({ next: () => { this.message = 'Assignment removed.'; this.loadAssignments(); }, error: e => this.error = e?.error?.message ?? 'Assignment could not be removed.' }); }
  resetForm(): void { this.editingAssignmentId = null; this.assignmentDraft = this.emptyAssignment(); this.startsAt = ''; this.endsAt = ''; this.busy = false; }
  saveDriver(): void { if (!this.driverDraft.userName || !this.driverDraft.organizationId) return; this.busy = true; this.error = ''; const payload = { ...this.driverDraft, licenseReference: this.driverDraft.licenseReference?.trim() || null }; const operation = this.editingDriverId ? this.transport.updateDriverProfile(this.editingDriverId, payload) : this.transport.createDriverProfile(payload); operation.subscribe({ next: () => { this.message = this.editingDriverId ? 'Driver profile updated.' : 'Driver profile created.'; this.resetDriver(); this.loadDrivers(); }, error: e => { this.error = e?.error?.message ?? 'Driver profile could not be saved.'; this.busy = false; } }); }
  editDriver(driver: DriverProfileApi): void { this.editingDriverId = driver.id; this.driverDraft = { userName: driver.userName, organizationId: driver.organizationId, licenseReference: driver.licenseReference, status: driver.status }; }
  deactivate(driver: DriverProfileApi): void { if (!confirm(`Deactivate ${driver.userName}?`)) return; this.transport.deactivateDriverProfile(driver.id).subscribe({ next: () => { this.message = 'Driver profile deactivated.'; this.loadDrivers(); }, error: e => this.error = e?.error?.message ?? 'Driver could not be deactivated.' }); }
  resetDriver(): void { this.editingDriverId = null; this.driverDraft = this.emptyDriver(); this.busy = false; }
  private load(): void { this.loading = true; this.transport.getVehicles().subscribe({ next: values => this.vehicles = values, error: e => this.error = e?.error?.message ?? 'Could not load vehicles.' }); this.loadDrivers(); this.loadAssignments(); }
  private loadDrivers(): void { this.transport.getDriverProfiles().subscribe({ next: values => this.drivers = values, error: e => this.error = e?.error?.message ?? 'Could not load driver profiles.' }); }
  private loadAssignments(): void { this.transport.getAssignments().subscribe({ next: values => { this.assignments = values; this.page = Math.min(this.page, this.pageCount - 1); this.loading = false; this.busy = false; }, error: e => { this.error = e?.error?.message ?? 'Could not load assignments.'; this.loading = false; this.busy = false; } }); }
  private localTime(value: string): string { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  private emptyAssignment(): TransportAssignmentRequest { return { vehicleId: 0, driverProfileId: 0, startsAt: '', endsAt: null }; }
  private emptyDriver(): DriverProfileRequest { return { userName: '', organizationId: 0, licenseReference: null, status: 'PENDING_VERIFICATION' }; }
}
