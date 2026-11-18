import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  RestaurantApiResponse,
  RestaurantRequest,
  RestaurantService,
} from '../../../core/services/restaurant.service';
import {
  PartnerOrganizationApiResponse,
  PartnerOrganizationService,
} from '../../../core/services/partner-organization.service';
import {
  DestinationApiResponse,
  DestinationService,
} from '../../../core/services/destination.service';

@Component({
  selector: 'app-restaurant-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './restaurant-management.component.scss',
  template: `
    <main class="restaurant-management-page">
      <header class="restaurant-page-header">
        <div>
          <h1 class="h2 mb-1">Restaurant Management</h1>
          <p class="text-muted mb-0">Create and manage restaurant profiles stored in the TRAVIXA database.</p>
        </div>
        <button type="button" class="btn btn-outline-secondary" (click)="load()" [disabled]="loading">
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </header>

      <div *ngIf="error" class="alert alert-danger" role="alert">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success" role="status">{{ success }}</div>

      <form #restaurantForm="ngForm" (ngSubmit)="save()" class="card card-body mb-4" novalidate>
        <h2 class="h5 mb-3">{{ editingId === null ? 'Add restaurant' : 'Edit restaurant' }}</h2>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="organizationId">Partner organization</label>
            <select id="organizationId" class="form-select" name="organizationId" required
                    [(ngModel)]="draft.organizationId" [disabled]="saving || loadingOptions">
              <option [ngValue]="0" disabled>Select organization</option>
              <option *ngFor="let organization of organizations" [ngValue]="organization.id">
                {{ organization.name }} — {{ organization.businessType }}
              </option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label" for="destinationId">Destination</label>
            <select id="destinationId" class="form-select" name="destinationId"
                    [(ngModel)]="draft.destinationId" [disabled]="saving || loadingOptions">
              <option [ngValue]="null">No destination</option>
              <option *ngFor="let destination of destinations" [ngValue]="destination.id">
                {{ destination.name }}{{ destination.published ? '' : ' (unpublished)' }}
              </option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label" for="name">Restaurant name</label>
            <input id="name" class="form-control" name="name" required maxlength="160"
                   [(ngModel)]="draft.name" [disabled]="saving">
          </div>

          <div class="col-md-6">
            <label class="form-label" for="slug">Slug</label>
            <input id="slug" class="form-control" name="slug" required maxlength="180"
                   [(ngModel)]="draft.slug" [disabled]="saving">
          </div>

          <div class="col-md-6">
            <label class="form-label" for="cuisineType">Cuisine type</label>
            <input id="cuisineType" class="form-control" name="cuisineType" maxlength="100"
                   [(ngModel)]="draft.cuisineType" [disabled]="saving"
                   placeholder="Bangladeshi, Seafood, Continental">
          </div>

          <div class="col-md-6">
            <label class="form-label" for="listingStatus">Listing status</label>
            <select id="listingStatus" class="form-select" name="listingStatus" required
                    [(ngModel)]="draft.listingStatus" [disabled]="saving">
              <option value="DRAFT">DRAFT</option>
              <option value="PENDING_REVIEW">PENDING_REVIEW</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label" for="address">Address</label>
            <input id="address" class="form-control" name="address" required maxlength="500"
                   [(ngModel)]="draft.address" [disabled]="saving">
          </div>

          <div class="col-md-6">
            <label class="form-label" for="contactEmail">Contact email</label>
            <input id="contactEmail" class="form-control" name="contactEmail" required type="email"
                   maxlength="254" [(ngModel)]="draft.contactEmail" [disabled]="saving">
          </div>

          <div class="col-md-6">
            <label class="form-label" for="contactPhone">Contact phone</label>
            <input id="contactPhone" class="form-control" name="contactPhone" maxlength="32"
                   [(ngModel)]="draft.contactPhone" [disabled]="saving">
          </div>

          <div class="col-12">
            <label class="form-label" for="openingHours">Opening hours</label>
            <input id="openingHours" class="form-control" name="openingHours" maxlength="500"
                   [(ngModel)]="draft.openingHours" [disabled]="saving"
                   placeholder="Daily · 11:00 AM–10:00 PM">
          </div>

          <div class="col-12">
            <label class="form-label" for="cancellationPolicy">Reservation cancellation policy</label>
            <textarea id="cancellationPolicy" class="form-control" name="cancellationPolicy" rows="2" maxlength="2000"
                      [(ngModel)]="draft.cancellationPolicy" [disabled]="saving"
                      placeholder="Explain how guests can cancel or change a reservation."></textarea>
          </div>

          <div class="col-12">
            <label class="form-label" for="description">Description</label>
            <textarea id="description" class="form-control" name="description" rows="3" maxlength="5000"
                      [(ngModel)]="draft.description" [disabled]="saving"></textarea>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-primary" [disabled]="restaurantForm.invalid || saving || loadingOptions">
            {{ saving ? 'Saving…' : editingId === null ? 'Create restaurant' : 'Update restaurant' }}
          </button>
          <button *ngIf="editingId !== null" type="button" class="btn btn-outline-secondary"
                  (click)="resetForm()" [disabled]="saving">Cancel</button>
        </div>
      </form>

      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead><tr><th>Name</th><th>Cuisine</th><th>Address</th><th>Opening hours</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let restaurant of restaurants; trackBy: trackById">
              <td><strong>{{ restaurant.name }}</strong><br><small class="text-muted">{{ restaurant.slug }}</small></td>
              <td>{{ restaurant.cuisineType || '—' }}</td>
              <td>{{ restaurant.address }}</td>
              <td>{{ restaurant.openingHours || '—' }}</td>
              <td><span class="listing-status" [attr.data-status]="restaurant.listingStatus">{{ restaurant.listingStatus }}</span></td>
              <td class="text-nowrap">
                <button type="button" class="btn btn-sm btn-outline-secondary me-2" (click)="edit(restaurant)">Edit</button>
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="remove(restaurant)"
                        [disabled]="deletingId === restaurant.id">{{ deletingId === restaurant.id ? 'Deleting…' : 'Delete' }}</button>
              </td>
            </tr>
            <tr *ngIf="!loading && restaurants.length === 0"><td colspan="6" class="text-muted">No restaurant profiles found.</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  `,
})
export class RestaurantManagementComponent implements OnInit {
  private readonly restaurantsApi = inject(RestaurantService);
  private readonly organizationsApi = inject(PartnerOrganizationService);
  private readonly destinationsApi = inject(DestinationService);

  restaurants: RestaurantApiResponse[] = [];
  organizations: PartnerOrganizationApiResponse[] = [];
  destinations: DestinationApiResponse[] = [];
  draft: RestaurantRequest = this.empty();
  editingId: number | null = null;
  deletingId: number | null = null;
  loading = false;
  loadingOptions = false;
  saving = false;
  error = '';
  success = '';

  ngOnInit(): void {
    this.loadOptions();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.restaurantsApi.getAdminRestaurants().subscribe({
      next: (restaurants) => {
        this.restaurants = restaurants ?? [];
        this.loading = false;
      },
      error: (error) => {
        this.error = this.message(error, 'Restaurant profiles could not be loaded.');
        this.loading = false;
      },
    });
  }

  private loadOptions(): void {
    this.loadingOptions = true;
    let pending = 2;
    const complete = (): void => {
      pending -= 1;
      if (pending === 0) this.loadingOptions = false;
    };

    this.organizationsApi.getAll().subscribe({
      next: (items) => { this.organizations = items ?? []; complete(); },
      error: (error) => { this.error = this.message(error, 'Organizations could not be loaded.'); complete(); },
    });
    this.destinationsApi.getAdminFromApi().subscribe({
      next: (items) => { this.destinations = items ?? []; complete(); },
      error: (error) => { this.error = this.message(error, 'Destinations could not be loaded.'); complete(); },
    });
  }

  save(): void {
    if (this.saving) return;
    const organizationId = Number(this.draft.organizationId);
    if (!Number.isInteger(organizationId) || organizationId < 1) {
      this.error = 'Select a valid partner organization.';
      return;
    }

    const request: RestaurantRequest = {
      ...this.draft,
      organizationId,
      name: this.draft.name.trim(),
      slug: this.draft.slug.trim().toLowerCase(),
      address: this.draft.address.trim(),
      contactEmail: this.draft.contactEmail.trim(),
      contactPhone: this.draft.contactPhone?.trim() || null,
      openingHours: this.draft.openingHours?.trim() || null,
      cancellationPolicy: this.draft.cancellationPolicy?.trim() || null,
      cuisineType: this.draft.cuisineType?.trim() || null,
      description: this.draft.description?.trim() || null,
    };

    this.saving = true;
    this.error = '';
    this.success = '';
    const request$ = this.editingId === null
      ? this.restaurantsApi.create(request)
      : this.restaurantsApi.update(this.editingId, request);

    request$.subscribe({
      next: () => {
        this.success = this.editingId === null ? 'Restaurant created successfully.' : 'Restaurant updated successfully.';
        this.saving = false;
        this.resetForm();
        this.load();
      },
      error: (error) => {
        this.error = this.message(error, 'Restaurant could not be saved.');
        this.saving = false;
      },
    });
  }

  edit(restaurant: RestaurantApiResponse): void {
    this.editingId = restaurant.id;
    this.draft = {
      organizationId: restaurant.organizationId,
      destinationId: restaurant.destinationId,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      address: restaurant.address,
      contactEmail: restaurant.contactEmail ?? '',
      contactPhone: restaurant.contactPhone,
      cuisineType: restaurant.cuisineType,
      openingHours: restaurant.openingHours,
      cancellationPolicy: restaurant.cancellationPolicy,
      listingStatus: restaurant.listingStatus,
    };
    this.error = '';
    this.success = '';
  }

  remove(restaurant: RestaurantApiResponse): void {
    if (!confirm(`Delete "${restaurant.name}"?`) || this.deletingId !== null) return;
    this.deletingId = restaurant.id;
    this.error = '';
    this.success = '';
    this.restaurantsApi.delete(restaurant.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.success = `"${restaurant.name}" deleted successfully.`;
        this.load();
      },
      error: (error) => {
        this.deletingId = null;
        this.error = this.message(error, 'Restaurant could not be deleted.');
      },
    });
  }

  resetForm(): void {
    this.draft = this.empty();
    this.editingId = null;
  }

  trackById(_index: number, restaurant: RestaurantApiResponse): number {
    return restaurant.id;
  }

  private empty(): RestaurantRequest {
    return {
      organizationId: 0,
      destinationId: null,
      name: '',
      slug: '',
      description: null,
      address: '',
      contactEmail: '',
      contactPhone: null,
      cuisineType: null,
      openingHours: null,
      cancellationPolicy: null,
      listingStatus: 'DRAFT',
    };
  }

  private message(error: any, fallback: string): string {
    if (error?.status === 401) return 'Your session has expired. Please sign in again.';
    if (error?.status === 403) return 'Access denied. Sign in with an ADMIN or SUPER_ADMIN account.';
    if (error?.status === 0) return 'Cannot connect to the backend API.';
    return error?.error?.detail || error?.error?.message || fallback;
  }
}
