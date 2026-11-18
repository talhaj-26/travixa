import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerOrganizationService } from '../../../core/services/partner-organization.service';
import { TourGuideApi, TourGuideRequest, TourGuideService, GuideAvailabilityApi, GuideAvailabilityRequest, GuideOfferingApi, GuideOfferingRequest } from '../../../core/services/tour-guide.service';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-tour-guide-management', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <main class="tg-page"><section class="tg-shell"><header><p>GUIDE OPERATIONS</p><h1>Tour guide management</h1><p>Guide profiles and availability are managed through the backend API.</p></header>
      @if (error) { <p role="alert">{{ error }}</p> } @if (message) { <p role="status">{{ message }}</p> }
      <section class="tg-card"><h2>{{ editingGuideId ? 'Edit guide profile' : 'Add guide profile' }}</h2><form (ngSubmit)="saveGuide()">
        <label>User account<select name="userName" [(ngModel)]="guideDraft.userName" required><option value="">Select user</option>@for (user of users; track user.username) { <option [value]="user.username">{{ user.username }} · {{ user.firstName }} {{ user.lastName }} ({{ user.email }})</option> }</select></label>
        <label>Organization<select name="organizationId" [(ngModel)]="guideDraft.organizationId" required><option [ngValue]="0">Select organization</option>@for (org of organizations; track org.id) { <option [ngValue]="org.id">{{ org.name }} · #{{ org.id }}</option> }</select></label>
        <label>License number<input name="licenseNumber" [(ngModel)]="guideDraft.licenseNumber"></label><label>Languages<input name="languageCodes" [(ngModel)]="guideDraft.languageCodes" placeholder="en,bn"></label>
        <label>Status<select name="guideStatus" [(ngModel)]="guideDraft.status"><option value="PENDING_VERIFICATION">Pending verification</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="INACTIVE">Inactive</option></select></label>
        <label>Biography<textarea name="biography" [(ngModel)]="guideDraft.biography" rows="3"></textarea></label>
        <button type="submit" [disabled]="busy || !guideDraft.userName || !guideDraft.organizationId">{{ editingGuideId ? 'Update guide' : 'Create guide' }}</button>@if (editingGuideId) { <button type="button" (click)="resetGuide()">Cancel edit</button> }
      </form></section>
      <section class="tg-list"><h2>Saved guides ({{ guides.length }})</h2>@if (loading) { <p>Loading guides…</p> } @else if (!guideRows.length) { <p>No guide profiles have been created.</p> } @else { @for (guide of guideRows; track guide.id) { <article><strong>{{ guide.userName }}</strong><span>Organization #{{ guide.organizationId }} · {{ guide.languageCodes || 'Languages not set' }} · {{ guide.status }}</span><p>{{ guide.biography }}</p><button type="button" (click)="editGuide(guide)">Edit</button><button type="button" (click)="deleteGuide(guide)">Deactivate</button></article> }
        <nav><button type="button" (click)="guidePage = guidePage - 1" [disabled]="guidePage === 0">Previous</button><span>Page {{ guidePage + 1 }} of {{ guidePageCount }}</span><button type="button" (click)="guidePage = guidePage + 1" [disabled]="guidePage + 1 >= guidePageCount">Next</button></nav> }
      </section>
      <section class="tg-card"><h2>{{ editingAvailabilityId ? 'Edit availability' : 'Add availability' }}</h2><form (ngSubmit)="saveAvailability()"><label>Guide<select name="availabilityGuide" [(ngModel)]="availabilityDraft.guideProfileId" required><option [ngValue]="0">Select guide</option>@for (guide of guides; track guide.id) { <option [ngValue]="guide.id">{{ guide.userName }} · #{{ guide.id }}</option> }</select></label><label>Starts at<input name="startsAt" type="datetime-local" [(ngModel)]="availabilityStartsAt" required></label><label>Ends at<input name="endsAt" type="datetime-local" [(ngModel)]="availabilityEndsAt" required></label><label>Status<select name="availabilityStatus" [(ngModel)]="availabilityDraft.status"><option value="AVAILABLE">Available</option><option value="BLOCKED">Blocked</option><option value="BOOKED">Booked</option></select></label><button type="submit" [disabled]="busy || !availabilityDraft.guideProfileId">{{ editingAvailabilityId ? 'Update availability' : 'Create availability' }}</button>@if (editingAvailabilityId) { <button type="button" (click)="resetAvailability()">Cancel edit</button> }</form></section>
      <section class="tg-list"><h2>Guide availability ({{ availabilities.length }})</h2>@if (!availabilityRows.length) { <p>No availability records have been created.</p> } @else { @for (item of availabilityRows; track item.id) { <article><strong>{{ guideName(item.guideProfileId) }}</strong><span>{{ item.startsAt | date:'medium' }} – {{ item.endsAt | date:'medium' }} · {{ item.status }}</span><button type="button" (click)="editAvailability(item)">Edit</button><button type="button" (click)="deleteAvailability(item)">Delete</button></article> }<nav><button type="button" (click)="availabilityPage = availabilityPage - 1" [disabled]="availabilityPage === 0">Previous</button><span>Page {{ availabilityPage + 1 }} of {{ availabilityPageCount }}</span><button type="button" (click)="availabilityPage = availabilityPage + 1" [disabled]="availabilityPage + 1 >= availabilityPageCount">Next</button></nav> }</section>
      <section class="tg-card"><h2>{{ editingOfferingId ? 'Edit guide service' : 'Add guide service' }}</h2><form (ngSubmit)="saveOffering()"><label>Guide<select name="offerGuide" [(ngModel)]="offeringDraft.guideProfileId" required><option [ngValue]="0">Select guide</option>@for (guide of guides; track guide.id) { <option [ngValue]="guide.id">{{ guide.userName }} · #{{ guide.id }}</option> }</select></label><label>Service name<input name="offeringName" [(ngModel)]="offeringDraft.name" required maxlength="140"></label><label>Description<textarea name="offeringDescription" [(ngModel)]="offeringDraft.description" rows="3"></textarea></label><label>Price per hour<input name="pricePerHour" type="number" min="0.01" step="0.01" [(ngModel)]="offeringDraft.pricePerHour" required></label><label>Currency<select name="offeringCurrency" [(ngModel)]="offeringDraft.currency"><option value="BDT">BDT</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label><button type="submit" [disabled]="busy || !offeringDraft.guideProfileId">{{ editingOfferingId ? 'Update service' : 'Create service' }}</button>@if (editingOfferingId) { <button type="button" (click)="resetOffering()">Cancel edit</button> }</form></section>
      <section class="tg-list"><h2>Guide services ({{ offerings.length }})</h2>@for (offer of offerings; track offer.id) { <article><strong>{{ offer.userName }} · {{ offer.name }}</strong><span>{{ offer.pricePerHour }} {{ offer.currency }}/hour · {{ offer.active ? 'Active' : 'Inactive' }}</span><p>{{ offer.description }}</p><button type="button" (click)="editOffering(offer)">Edit</button>@if (offer.active) { <button type="button" (click)="deactivateOffering(offer)">Deactivate</button> }</article> }@if (!offerings.length) { <p>No guide services have been created.</p> }</section>
    </section></main>
  `,
  styleUrl: './tour-guide-management.component.scss'
})
export class TourGuideManagementComponent implements OnInit {
  guides: TourGuideApi[] = []; availabilities: GuideAvailabilityApi[] = []; users: UserResponse[] = []; organizations: { id: number; name: string }[] = [];
  offerings: GuideOfferingApi[] = [];
  loading = true; busy = false; message = ''; error = ''; guidePage = 0; availabilityPage = 0; readonly pageSize = 6;
  editingGuideId: number | null = null; editingAvailabilityId: number | null = null;
  editingOfferingId: number | null = null;
  guideDraft: TourGuideRequest = this.emptyGuide(); availabilityDraft: GuideAvailabilityRequest = this.emptyAvailability();
  availabilityStartsAt = ''; availabilityEndsAt = '';
  offeringDraft: GuideOfferingRequest = this.emptyOffering();
  constructor(private readonly guideService: TourGuideService, private readonly organizationService: PartnerOrganizationService, private readonly userService: UserService) {}
  ngOnInit(): void {
    this.load();
    this.organizationService.getAll().subscribe({ next: data => this.organizations = data, error: () => this.error = 'Could not load organizations.' });
    this.userService.getAll().subscribe({ next: data => this.users = data, error: () => this.error = 'Could not load user accounts.' });
  }
  get guideRows(): TourGuideApi[] { return this.guides.slice(this.guidePage * this.pageSize, (this.guidePage + 1) * this.pageSize); }
  get availabilityRows(): GuideAvailabilityApi[] { return this.availabilities.slice(this.availabilityPage * this.pageSize, (this.availabilityPage + 1) * this.pageSize); }
  get guidePageCount(): number { return Math.max(1, Math.ceil(this.guides.length / this.pageSize)); }
  get availabilityPageCount(): number { return Math.max(1, Math.ceil(this.availabilities.length / this.pageSize)); }
  guideName(id: number): string { return this.guides.find(guide => guide.id === id)?.userName ?? `Guide #${id}`; }
  saveGuide(): void {
    if (!this.guideDraft.userName.trim() || !this.guideDraft.organizationId) return;
    this.run(this.editingGuideId ? this.guideService.updateGuide(this.editingGuideId, this.guideDraft) : this.guideService.createGuide(this.guideDraft), 'Guide profile saved.', () => this.resetGuide());
  }
  editGuide(guide: TourGuideApi): void { this.editingGuideId = guide.id; this.guideDraft = { userName: guide.userName, organizationId: guide.organizationId ?? 0, biography: guide.biography, licenseNumber: guide.licenseNumber, languageCodes: guide.languageCodes, status: guide.status }; }
  deleteGuide(guide: TourGuideApi): void { if (!confirm(`Deactivate guide profile for ${guide.userName}? Existing records will be retained.`)) return; this.run(this.guideService.deleteGuide(guide.id), 'Guide profile deactivated.'); }
  resetGuide(): void { this.editingGuideId = null; this.guideDraft = this.emptyGuide(); }
  saveAvailability(): void {
    const startsAt = new Date(this.availabilityStartsAt); const endsAt = new Date(this.availabilityEndsAt);
    if (!this.availabilityDraft.guideProfileId || !this.availabilityStartsAt || !this.availabilityEndsAt || endsAt <= startsAt) { this.error = 'Set a valid availability interval; end must be after start.'; return; }
    const request = { ...this.availabilityDraft, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
    this.run(this.editingAvailabilityId ? this.guideService.updateAvailability(this.editingAvailabilityId, request) : this.guideService.createAvailability(request), 'Availability saved.', () => this.resetAvailability());
  }
  editAvailability(item: GuideAvailabilityApi): void { this.editingAvailabilityId = item.id; this.availabilityDraft = { guideProfileId: item.guideProfileId, startsAt: item.startsAt, endsAt: item.endsAt, status: item.status }; this.availabilityStartsAt = this.toLocalDateTime(item.startsAt); this.availabilityEndsAt = this.toLocalDateTime(item.endsAt); }
  deleteAvailability(item: GuideAvailabilityApi): void { if (!confirm('Delete this guide availability record?')) return; this.run(this.guideService.deleteAvailability(item.id), 'Availability deleted.'); }
  saveOffering(): void { if (!this.offeringDraft.guideProfileId || !this.offeringDraft.name.trim()) return; const request = { ...this.offeringDraft, name: this.offeringDraft.name.trim() }; this.run(this.editingOfferingId ? this.guideService.updateOffering(this.editingOfferingId, request) : this.guideService.createOffering(request), 'Guide service saved.', () => this.resetOffering()); }
  editOffering(offer: GuideOfferingApi): void { this.editingOfferingId = offer.id; this.offeringDraft = { guideProfileId: offer.guideProfileId, name: offer.name, description: offer.description, pricePerHour: offer.pricePerHour, currency: offer.currency, active: offer.active }; }
  deactivateOffering(offer: GuideOfferingApi): void { if (!confirm(`Deactivate ${offer.name}?`)) return; this.run(this.guideService.deleteOffering(offer.id), 'Guide service deactivated.'); }
  resetOffering(): void { this.editingOfferingId = null; this.offeringDraft = this.emptyOffering(); }
  resetAvailability(): void { this.editingAvailabilityId = null; this.availabilityDraft = this.emptyAvailability(); this.availabilityStartsAt = ''; this.availabilityEndsAt = ''; }
  private run<T>(request: import('rxjs').Observable<T>, success: string, after?: () => void): void { this.error = ''; this.message = ''; this.busy = true; request.subscribe({ next: () => { this.message = success; after?.(); this.load(); }, error: e => { this.error = e?.error?.message ?? 'The request could not be completed.'; this.busy = false; } }); }
  private load(): void { this.loading = true; this.guideService.getGuides().subscribe({ next: values => { this.guides = values; this.guidePage = Math.min(this.guidePage, this.guidePageCount - 1); this.loading = false; this.busy = false; }, error: e => { this.error = e?.error?.message ?? 'Could not load guide profiles.'; this.loading = false; this.busy = false; } }); this.guideService.getAvailability().subscribe({ next: values => { this.availabilities = values; this.availabilityPage = Math.min(this.availabilityPage, this.availabilityPageCount - 1); }, error: e => this.error = e?.error?.message ?? 'Could not load guide availability.' }); this.guideService.getOfferings().subscribe({ next: values => this.offerings = values, error: e => this.error = e?.error?.message ?? 'Could not load guide services.' }); }
  private toLocalDateTime(value: string): string { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  private emptyGuide(): TourGuideRequest { return { userName: '', organizationId: 0, biography: null, licenseNumber: null, languageCodes: null, status: 'PENDING_VERIFICATION' }; }
  private emptyAvailability(): GuideAvailabilityRequest { return { guideProfileId: 0, startsAt: '', endsAt: '', status: 'AVAILABLE' }; }
  private emptyOffering(): GuideOfferingRequest { return { guideProfileId: 0, name: '', description: null, pricePerHour: 0, currency: 'BDT', active: true }; }
}
