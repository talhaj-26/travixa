
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  HotelApiResponse,
  HotelAmenityApiResponse,
  HotelAmenityRequest,
  HotelImageApiResponse,
  HotelRequest,
  HotelService,
} from '../../../core/services/hotel.service';
import { MediaService } from '../../../core/services/media.service';

import {
  PartnerOrganizationApiResponse,
  PartnerOrganizationService,
} from '../../../core/services/partner-organization.service';

import {
  DestinationApiResponse,
  DestinationService,
} from '../../../core/services/destination.service';

@Component({
  selector: 'app-hotel-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-management.component.html',
  styleUrls: ['./hotel-management.component.scss'],
})
export class HotelManagementComponent implements OnInit, OnDestroy {
  private readonly hotelsApi = inject(HotelService);
  private readonly organizationsApi = inject(PartnerOrganizationService);
  private readonly destinationsApi = inject(DestinationService);
  private readonly mediaApi = inject(MediaService);

  hotels: HotelApiResponse[] = [];
  filteredHotels: HotelApiResponse[] = [];

  organizations: PartnerOrganizationApiResponse[] = [];
  destinations: DestinationApiResponse[] = [];
  hotelImages: HotelImageApiResponse[] = [];
  hotelImagePreviews: Record<number, string> = {};
  hotelAmenities: HotelAmenityApiResponse[] = [];
  amenityDraft = { name: '', description: '', included: true };
  editingAmenityId: number | null = null;
  savingAmenity = false;
  selectedImages: File[] = [];
  selectedImagePreviews: Array<{ url: string; alt: string }> = [];
  imageAltText = '';

  editingId: number | null = null;
  saving = false;
  loading = false;
  deletingId: number | null = null;
  loadingOptions = false;

  error = '';
  success = '';
  searchTerm = '';
  statusFilter = 'ALL';

  draft: HotelRequest = this.empty();

  get totalHotels(): number {
    return this.hotels.length;
  }

  get publishedHotels(): number {
    return this.hotels.filter(
      (hotel) => hotel.listingStatus === 'PUBLISHED',
    ).length;
  }

  get draftHotels(): number {
    return this.hotels.filter(
      (hotel) => hotel.listingStatus === 'DRAFT',
    ).length;
  }

  get pendingHotels(): number {
    return this.hotels.filter(
      (hotel) => hotel.listingStatus === 'PENDING_REVIEW',
    ).length;
  }

  ngOnInit(): void {
    this.loadOptions();
    this.load();
  }

  ngOnDestroy(): void {
    this.clearHotelImagePreviews();
    this.clearSelectedImagePreviews();
  }

  loadOptions(): void {
    this.loadingOptions = true;

    let organizationsLoaded = false;
    let destinationsLoaded = false;
    let organizationsFailed = false;
    let destinationsFailed = false;

    const finishLoading = (): void => {
      if (organizationsLoaded && destinationsLoaded) {
        this.loadingOptions = false;

        if (organizationsFailed || destinationsFailed) {
          this.error =
            'Organization or destination options could not be loaded. ' +
            'Check your admin access and API connection, then reload.';
        }
      }
    };

    this.organizationsApi.getAll().subscribe({
      next: (items) => {
        this.organizations = items ?? [];
        organizationsLoaded = true;
        finishLoading();
      },
      error: () => {
        organizationsFailed = true;
        organizationsLoaded = true;
        finishLoading();
      },
    });

    this.destinationsApi.getAdminFromApi().subscribe({
      next: (items) => {
        this.destinations = items ?? [];
        destinationsLoaded = true;
        finishLoading();
      },
      error: () => {
        destinationsFailed = true;
        destinationsLoaded = true;
        finishLoading();
      },
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';

    this.hotelsApi.getAdminHotels().subscribe({
      next: (hotels) => {
        this.hotels = hotels ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = this.getErrorMessage(
          err,
          'Hotel records could not be loaded.',
        );
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredHotels = this.hotels.filter((hotel) => {
      const matchesSearch =
        !term ||
        hotel.name?.toLowerCase().includes(term) ||
        hotel.address?.toLowerCase().includes(term) ||
        hotel.destinationName?.toLowerCase().includes(term) ||
        hotel.slug?.toLowerCase().includes(term);

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        hotel.listingStatus === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  save(): void {
    if (this.saving) return;

    this.error = '';
    this.success = '';

    const organizationId = Number(this.draft.organizationId);
    const destinationId = Number(this.draft.destinationId);

    if (
      !Number.isInteger(organizationId) ||
      organizationId <= 0 ||
      !this.organizations.some((item) => item.id === organizationId)
    ) {
      this.error = 'Please select a valid organization.';
      return;
    }

    if (
      !Number.isInteger(destinationId) ||
      destinationId <= 0 ||
      !this.destinations.some((item) => item.id === destinationId)
    ) {
      this.error = 'Please select a valid destination.';
      return;
    }

    const request: HotelRequest = {
      ...this.draft,
      organizationId,
      destinationId,
      name: this.draft.name.trim(),
      slug: this.draft.slug.trim().toLowerCase(),
      address: this.draft.address.trim(),
      contactEmail: this.draft.contactEmail.trim(),
      description: this.draft.description?.trim() || null,
      contactPhone: this.draft.contactPhone?.trim() || null,
      checkInTime: this.draft.checkInTime || null,
      checkOutTime: this.draft.checkOutTime || null,
      cancellationPolicy: this.draft.cancellationPolicy?.trim() || null,
      childPolicy: this.draft.childPolicy?.trim() || null,
      additionalCharges: this.draft.additionalCharges?.trim() || null,
    };

    this.saving = true;

    const editingId = this.editingId;

    const result =
      editingId !== null
        ? this.hotelsApi.updateHotel(editingId, request)
        : this.hotelsApi.createHotel(request);

    result.subscribe({
      next: () => {
        this.success =
          editingId !== null
            ? 'Hotel information updated successfully.'
            : 'Hotel created successfully.';

        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.error = this.getErrorMessage(
          err,
          'Hotel could not be saved. Please check the form and try again.',
        );
        this.saving = false;
      },
    });
  }

  edit(hotel: HotelApiResponse): void {
    this.editingId = hotel.id;
    this.resetAmenityForm();
    this.error = '';
    this.success = '';

    this.draft = {
      organizationId: hotel.organizationId,
      destinationId: hotel.destinationId,
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description ?? null,
      address: hotel.address,
      contactEmail: hotel.contactEmail,
      contactPhone: hotel.contactPhone ?? null,
      latitude: hotel.latitude ?? null,
      longitude: hotel.longitude ?? null,
      starRating: hotel.starRating,
      listingStatus: hotel.listingStatus,
      checkInTime: hotel.checkInTime?.slice(0, 5) ?? null,
      checkOutTime: hotel.checkOutTime?.slice(0, 5) ?? null,
      cancellationPolicy: hotel.cancellationPolicy ?? null,
      childPolicy: hotel.childPolicy ?? null,
      additionalCharges: hotel.additionalCharges ?? null,
    };

    // If the selected IDs are not in the loaded options, reload them.
    if (
      !this.organizations.some((item) => item.id === hotel.organizationId) ||
      !this.destinations.some((item) => item.id === hotel.destinationId)
    ) {
      this.loadOptions();
    }

    document
      .getElementById('hotel-editor')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.loadHotelImages(hotel.id);
    this.loadHotelAmenities(hotel.id);
  }

  private loadHotelImages(id: number): void {
    this.clearHotelImagePreviews();
    this.hotelsApi.getAdminImages(id).subscribe({
      next: (items) => {
        this.hotelImages = items ?? [];
        for (const image of this.hotelImages) {
          this.mediaApi.previewUrl(image.publicUrl).subscribe({
            next: (url) => {
              if (this.editingId !== id || !this.hotelImages.some((current) => current.id === image.id)) {
                URL.revokeObjectURL(url);
                return;
              }
              this.hotelImagePreviews[image.id] = url;
            },
          });
        }
      },
      error: () => this.hotelImages = [],
    });
  }

  private loadHotelAmenities(id: number): void {
    this.hotelsApi.getAdminAmenities(id).subscribe({
      next: (items) => this.hotelAmenities = items ?? [],
      error: (err) => this.error = this.getErrorMessage(err, 'Hotel facilities could not be loaded.'),
    });
  }

  saveAmenity(): void {
    const hotelId = this.editingId;
    const name = this.amenityDraft.name.trim();
    if (hotelId === null || !name || this.savingAmenity) return;
    const request: HotelAmenityRequest = {
      hotelId,
      name,
      description: this.amenityDraft.description.trim() || null,
      included: this.amenityDraft.included,
    };
    this.savingAmenity = true;
    const operation = this.editingAmenityId === null
      ? this.hotelsApi.createAmenity(hotelId, request)
      : this.hotelsApi.updateAmenity(hotelId, this.editingAmenityId, request);
    operation.subscribe({
      next: () => {
        this.success = this.editingAmenityId === null ? 'Hotel facility added.' : 'Hotel facility updated.';
        this.resetAmenityForm();
        this.loadHotelAmenities(hotelId);
        this.savingAmenity = false;
      },
      error: (err) => {
        this.error = this.getErrorMessage(err, 'Hotel facility could not be saved.');
        this.savingAmenity = false;
      },
    });
  }

  editAmenity(amenity: HotelAmenityApiResponse): void {
    this.editingAmenityId = amenity.id;
    this.amenityDraft = { name: amenity.name, description: amenity.description || '', included: amenity.included };
  }

  removeAmenity(amenity: HotelAmenityApiResponse): void {
    const hotelId = this.editingId;
    if (hotelId === null || !confirm(`Remove ${amenity.name} from this hotel?`)) return;
    this.hotelsApi.deleteAmenity(hotelId, amenity.id).subscribe({
      next: () => { this.success = 'Hotel facility removed.'; this.loadHotelAmenities(hotelId); },
      error: (err) => this.error = this.getErrorMessage(err, 'Hotel facility could not be removed.'),
    });
  }

  resetAmenityForm(): void {
    this.amenityDraft = { name: '', description: '', included: true };
    this.editingAmenityId = null;
  }

  selectHotelImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clearSelectedImagePreviews();
    this.selectedImages = Array.from(input.files ?? []);
    this.selectedImagePreviews = this.selectedImages.map((file) => ({
      url: URL.createObjectURL(file),
      alt: this.imageAltText.trim() || file.name,
    }));
    input.value = '';
  }

  uploadHotelImages(): void {
    const id = this.editingId;
    if (id === null || !this.selectedImages.length || this.saving) return;
    this.saving = true; this.error = ''; this.success = '';
    this.mediaApi.upload('HOTEL', id, this.selectedImages, this.selectedImages.map(() => this.imageAltText), 0).subscribe({
      next: () => { this.saving = false; this.success = 'Hotel photos uploaded.'; this.selectedImages = []; this.clearSelectedImagePreviews(); this.imageAltText = ''; this.loadHotelImages(id); },
      error: (err) => { this.saving = false; this.error = this.getErrorMessage(err, 'Hotel photos could not be uploaded.'); },
    });
  }

  deleteHotelImage(id: number): void {
    if (!confirm('Delete this hotel photo?')) return;
    this.mediaApi.delete('HOTEL', id).subscribe({
      next: () => {
        const preview = this.hotelImagePreviews[id];
        if (preview) URL.revokeObjectURL(preview);
        delete this.hotelImagePreviews[id];
        this.hotelImages = this.hotelImages.filter((image) => image.id !== id);
      },
      error: (err) => this.error = this.getErrorMessage(err, 'Hotel photo could not be deleted.'),
    });
  }

  cancelEdit(): void {
    this.resetForm();
    this.error = '';
    this.success = '';
  }

  remove(hotel: HotelApiResponse): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${hotel.name}"?`,
    );

    if (!confirmed || this.deletingId !== null) return;

    this.error = '';
    this.success = '';
    this.deletingId = hotel.id;

    this.hotelsApi.deleteHotel(hotel.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.success = `"${hotel.name}" deleted successfully.`;
        this.load();
      },
      error: (err) => {
        this.error = this.getErrorMessage(
          err,
          'Hotel could not be deleted.',
        );
        this.deletingId = null;
      },
    });
  }

  trackByHotelId(_index: number, hotel: HotelApiResponse): number {
    return hotel.id;
  }

  hotelImageUrl(url: string | null): string {
    return this.hotelsApi.resolveMediaUrl(url);
  }

  handleHotelImageError(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  trackByOrganizationId(
    _index: number,
    organization: PartnerOrganizationApiResponse,
  ): number {
    return organization.id;
  }

  trackByDestinationId(
    _index: number,
    destination: DestinationApiResponse,
  ): number {
    return destination.id;
  }

  private resetForm(): void {
    this.draft = this.empty();
    this.editingId = null;
    this.saving = false;
    this.clearHotelImagePreviews();
    this.hotelImages = [];
    this.hotelAmenities = [];
    this.resetAmenityForm();
    this.selectedImages = [];
    this.clearSelectedImagePreviews();
    this.imageAltText = '';
  }

  private clearHotelImagePreviews(): void {
    Object.values(this.hotelImagePreviews).forEach((url) => URL.revokeObjectURL(url));
    this.hotelImagePreviews = {};
  }

  private clearSelectedImagePreviews(): void {
    this.selectedImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    this.selectedImagePreviews = [];
  }

  private empty(): HotelRequest {
    return {
      organizationId: 0,
      destinationId: 0,
      name: '',
      slug: '',
      description: null,
      address: '',
      contactEmail: '',
      contactPhone: null,
      latitude: null,
      longitude: null,
      starRating: 0,
      listingStatus: 'DRAFT',
      checkInTime: null,
      checkOutTime: null,
      cancellationPolicy: null,
      childPolicy: null,
      additionalCharges: null,
    };
  }

  private getErrorMessage(err: any, fallback: string): string {
    const status = err?.status;
    const message =
      err?.error?.detail ||
      err?.error?.message ||
      (typeof err?.error === 'string' ? err.error : null);

    if (status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (status === 403) {
      return 'Access denied. Please sign in with an ADMIN or SUPER_ADMIN account.';
    }

    if (status === 0) {
      return 'Cannot connect to the backend API. Check that the server is running.';
    }

    if (status === 400) {
      return message || 'Invalid form data. Check the required fields.';
    }

    if (status === 404) {
      return message || 'The selected organization, destination, or hotel was not found.';
    }

    if (status === 409) {
      return message || 'This record conflicts with existing data. Check the slug and linked records.';
    }

    return message || fallback;
  }
}
