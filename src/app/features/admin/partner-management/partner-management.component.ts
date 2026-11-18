import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  DestinationApiResponse,
  DestinationRequest,
  DestinationService,
} from '../../../core/services/destination.service';
import {
  PartnerOrganizationApiResponse,
  PartnerOrganizationRequest,
  PartnerOrganizationService,
} from '../../../core/services/partner-organization.service';

type CatalogTab = 'organizations' | 'destinations';

@Component({
  selector: 'app-partner-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-management.component.html',
  styleUrl: './partner-management.component.scss',
})
export class PartnerManagementComponent implements OnInit {
  private readonly organizationsApi = inject(PartnerOrganizationService);
  private readonly destinationsApi = inject(DestinationService);
  tab: CatalogTab = 'organizations';
  organizations: PartnerOrganizationApiResponse[] = [];
  destinations: DestinationApiResponse[] = [];
  editingId: number | null = null;
  loading = false;
  saving = false;
  error = '';
  notice = '';
  organization: PartnerOrganizationRequest = this.emptyOrganization();
  destination: DestinationRequest = this.emptyDestination();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.organizationsApi.getAll().subscribe({
      next: (items) => {
        this.organizations = items;
        this.loading = false;
      },
      error: () => {
        this.error =
          'Could not load organizations. Check your admin access and API connection.';
        this.loading = false;
      },
    });
    this.destinationsApi.getAdminFromApi().subscribe({
      next: (items) => {
        this.destinations = items;
      },
      error: () => {
        this.error =
          'Could not load destinations. Check your admin access and API connection.';
      },
    });
  }

  chooseTab(tab: CatalogTab): void {
    this.tab = tab;
    this.resetForm();
    this.error = '';
    this.notice = '';
  }
  editOrganization(item: PartnerOrganizationApiResponse): void {
    this.tab = 'organizations';
    this.editingId = item.id;
    this.organization = {
      name: item.name,
      slug: item.slug,
      businessType: item.businessType,
      legalName: item.legalName ?? '',
      registrationNumber: item.registrationNumber ?? '',
      contactEmail: item.contactEmail ?? '',
      contactPhone: item.contactPhone ?? '',
      status: item.status,
    };
  }
  editDestination(item: DestinationApiResponse): void {
    this.tab = 'destinations';
    this.editingId = item.id;
    this.destination = {
      name: item.name,
      slug: item.slug,
      countryCode: item.countryCode,
      region: item.region ?? '',
      description: item.description ?? '',
      latitude: item.latitude,
      longitude: item.longitude,
      category: item.category ?? '',
      imageUrl: item.imageUrl ?? '',
      featured: item.featured,
      published: item.published,
    };
  }
  save(): void {
    this.saving = true;
    this.error = '';
    this.notice = '';
    let operation: Observable<unknown>;
    if (this.tab === 'organizations') {
      const request: PartnerOrganizationRequest = {
        ...this.organization,
        name: this.organization.name.trim(),
        slug: this.toSlug(this.organization.slug || this.organization.name),
        legalName: (this.organization.legalName ?? '').trim(),
        registrationNumber: (this.organization.registrationNumber ?? '').trim(),
        contactEmail: (this.organization.contactEmail ?? '').trim().toLowerCase(),
        contactPhone: (this.organization.contactPhone ?? '').trim(),
      };
      if (!request.name || !request.slug || !request.contactEmail) {
        this.saving = false;
        this.error = 'Organization name, slug, and contact email are required.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.contactEmail)) {
        this.saving = false;
        this.error = 'Enter a valid organization contact email.';
        return;
      }
      operation = this.editingId
        ? this.organizationsApi.update(this.editingId, request)
        : this.organizationsApi.create(request);
    } else {
      const request: DestinationRequest = {
        ...this.destination,
        name: this.destination.name.trim(),
        slug: this.toSlug(this.destination.slug || this.destination.name),
        countryCode: this.destination.countryCode.trim().toUpperCase(),
        region: (this.destination.region ?? '').trim(),
        description: (this.destination.description ?? '').trim(),
        category: (this.destination.category ?? '').trim().toUpperCase(),
        imageUrl: (this.destination.imageUrl ?? '').trim(),
      };
      if (!request.name || !request.slug || !/^[A-Z]{2}$/.test(request.countryCode)) {
        this.saving = false;
        this.error = 'Destination name, URL slug, and a two-letter country code are required.';
        return;
      }
      if (request.imageUrl && !/^https?:\/\//i.test(request.imageUrl)) {
        this.saving = false;
        this.error = 'Destination image must use a public http or https URL.';
        return;
      }
      operation = this.editingId
        ? this.destinationsApi.update(this.editingId, request)
        : this.destinationsApi.create(request);
    }
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.notice = this.editingId ? 'Changes saved.' : 'Record created.';
        this.resetForm();
        this.load();
      },
      error: (e: any) => {
        this.saving = false;
        const validationErrors = Object.entries(e?.error?.validationErrors ?? {})
          .map(([field, message]) => `${field}: ${message}`)
          .join(' · ');
        this.error = validationErrors
          ? `${e?.error?.message || 'Request validation failed'} — ${validationErrors}`
          : e?.error?.message || 'Save failed. Check required fields and unique slug.';
      },
    });
  }
  remove(id: number, label: string): void {
    if (
      !window.confirm(
        `Delete ${label}? Records linked to it may prevent deletion.`,
      )
    )
      return;
    const request =
      this.tab === 'organizations'
        ? this.organizationsApi.delete(id)
        : this.destinationsApi.delete(id);
    request.subscribe({
      next: () => {
        this.notice = 'Record deleted.';
        if (this.editingId === id) this.resetForm();
        this.load();
      },
      error: (e) => {
        this.error =
          e?.error?.message ||
          'Delete failed. This record may be linked to existing listings.';
      },
    });
  }
  resetForm(): void {
    this.editingId = null;
    this.organization = this.emptyOrganization();
    this.destination = this.emptyDestination();
  }
  private emptyOrganization(): PartnerOrganizationRequest {
    return {
      name: '',
      slug: '',
      businessType: 'HOTEL',
      legalName: '',
      registrationNumber: '',
      contactEmail: '',
      contactPhone: '',
      status: 'ACTIVE',
    };
  }
  private emptyDestination(): DestinationRequest {
    return {
      name: '',
      slug: '',
      countryCode: 'BD',
      region: '',
      description: '',
      latitude: null,
      longitude: null,
      category: '',
      imageUrl: '',
      featured: false,
      published: false,
    };
  }
  private toSlug(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  get featuredDestinationsCount(): number {
    return this.destinations.filter(d => d.featured).length;
  }

  get publishedDestinationsCount(): number {
    return this.destinations.filter(d => d.published).length;
  }
}
