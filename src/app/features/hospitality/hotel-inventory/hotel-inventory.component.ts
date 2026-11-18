import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminRoomTypeApiResponse,
  HotelApiResponse,
  HotelService,
  RoomApiResponse,
  RoomAvailabilityApiResponse,
  RoomAvailabilityRequest,
  RoomRateApiResponse,
  RoomRateRequest,
  RoomRequest,
  RoomTypeRequest,
} from '../../../core/services/hotel.service';
import { MediaService } from '../../../core/services/media.service';

@Component({
  selector: 'app-hotel-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-inventory.component.html',
  styleUrl: './hotel-inventory.component.scss',
}) 
export class HotelInventoryComponent implements OnInit, OnDestroy {
  readonly api = inject(HotelService);
  readonly media = inject(MediaService);

  hotels: HotelApiResponse[] = [];
  roomTypes: AdminRoomTypeApiResponse[] = [];
  rooms: RoomApiResponse[] = [];
  rates: RoomRateApiResponse[] = [];
  availability: RoomAvailabilityApiResponse[] = [];

  error = '';
  success = '';
  busy = false;
  roomTypeFiles: File[] = [];
  roomImagePreviews: string[] = [];
  editingTypeImages: Array<import('../../../core/services/hotel.service').RoomTypeImageApiResponse & { previewUrl?: string }> = [];
  physicalRoomFiles: File[] = [];
  physicalRoomPreviews: string[] = [];
  editingRoomImages: Array<import('../../../core/services/hotel.service').RoomImageApiResponse & { previewUrl?: string }> = [];

  editingTypeId: number | null = null;
  editingRoomId: number | null = null;
  editingRateId: number | null = null;
  editingAvailabilityId: number | null = null;

  typeDraft: RoomTypeRequest = this.emptyType();
  roomAmenitiesText = '';
  roomDraft: RoomRequest = this.emptyRoom();
  rateDraft: RoomRateRequest = this.emptyRate();
  availabilityDraft: RoomAvailabilityRequest = this.emptyAvailability();

  ngOnInit(): void {
    this.api.getAdminHotels().subscribe({ next: (hotels) => (this.hotels = hotels), error: (e) => this.showError(e, 'Could not load hotels.') });
    this.load();
  }

  ngOnDestroy(): void {
    this.clearRoomTypePreviews();
    this.clearPhysicalRoomPreviews();
  }

  load(): void {
    this.api.getAdminRoomTypes().subscribe({
      next: (types) => (this.roomTypes = types),
      error: (e) => this.showError(e, 'Could not load room types.'),
    });

    this.api.getAdminRooms().subscribe({
      next: (rooms) => (this.rooms = rooms),
      error: (e) => this.showError(e, 'Could not load physical rooms.'),
    });

    this.api.getAdminRates().subscribe({
      next: (rates) => (this.rates = rates),
      error: (e) => this.showError(e, 'Could not load room rates.'),
    });

    this.api.getAdminAvailability().subscribe({
      next: (items) => (this.availability = items),
      error: (e) => this.showError(e, 'Could not load room availability.'),
    });
  }

  saveType(): void {
    this.busy = true;
    this.error = '';
    this.success = '';

    const amenities = [...new Set(this.roomAmenitiesText.split(/[\n,]/).map((value) => value.trim()).filter(Boolean))];
    if (amenities.length > 30 || amenities.some((amenity) => amenity.length > 80)) {
      this.busy = false;
      this.showError(null, 'Enter no more than 30 amenities, with up to 80 characters each.');
      return;
    }
    const request: RoomTypeRequest = { ...this.typeDraft, amenities };
    const call = this.editingTypeId
      ? this.api.updateRoomType(this.editingTypeId, request)
      : this.api.createRoomType(request);

    call.subscribe({
      next: (saved) => {
        const finishSave = () => {
        this.busy = false;
        this.cancelTypeEdit();
        this.success = 'Room type saved successfully.';
        this.load();
        };
        if (this.roomTypeFiles.length) {
          this.media.upload('ROOM_TYPE', saved.id, this.roomTypeFiles, this.roomTypeFiles.map((file) => file.name), 0).subscribe({
            next: finishSave,
            error: (e) => { this.busy = false; this.showError(e, 'Room type was saved, but photos could not be uploaded.'); this.load(); },
          });
        } else finishSave();
      },
      error: (e) => {
        this.busy = false;
        this.showError(e, 'Room type could not be saved.');
      },
    });
  }

  editType(type: AdminRoomTypeApiResponse): void {
    this.error = '';
    this.success = '';
    this.editingTypeId = type.id;

    this.typeDraft = {
      hotelId: type.hotelId,
      name: type.name,
      category: type.category,
      bedType: type.bedType,
      maxOccupancy: type.maxOccupancy,
      sizeSquareMeters: type.sizeSquareMeters,
      airConditioned: type.airConditioned ?? true,
      description: type.description,
      amenities: type.amenities ?? [],
      listingStatus: type.listingStatus,
    };
    this.roomAmenitiesText = (type.amenities ?? []).join(', ');
    this.clearRoomTypePreviews();
    this.roomTypeFiles = [];
    this.roomImagePreviews = [];
    this.api.getAdminRoomTypeImages(type.id).subscribe({
      next: (images) => {
        this.editingTypeImages = images.map((image) => ({ ...image }));
        for (const image of this.editingTypeImages) {
          this.media.previewUrl(image.publicUrl).subscribe({
            next: (url) => {
              if (this.editingTypeId !== type.id || !this.editingTypeImages.some((current) => current.id === image.id)) {
                URL.revokeObjectURL(url);
                return;
              }
              image.previewUrl = url;
            },
          });
        }
      },
      error: (e) => this.showError(e, 'Could not load room photos.'),
    });
  }

  cancelTypeEdit(): void {
    this.editingTypeId = null;
    this.typeDraft = this.emptyType();
    this.roomAmenitiesText = '';
    this.clearRoomTypePreviews();
    this.roomTypeFiles = [];
  }

  selectRoomTypeImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    const valid = selected.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (valid.length !== selected.length) this.error = 'Only JPG, PNG, and WebP images are allowed.';
    this.roomImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    this.roomTypeFiles = valid.slice(0, 10);
    this.roomImagePreviews = this.roomTypeFiles.map((file) => URL.createObjectURL(file));
    input.value = '';
  }

  deleteRoomTypeImage(id: number): void {
    this.media.delete('ROOM_TYPE', id).subscribe({
      next: () => {
        const image = this.editingTypeImages.find((item) => item.id === id);
        if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
        this.editingTypeImages = this.editingTypeImages.filter((item) => item.id !== id);
        this.success = 'Room photo removed.';
      },
      error: (e) => this.showError(e, 'Room photo could not be removed.'),
    });
  }

  private clearRoomTypePreviews(): void {
    this.editingTypeImages.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });
    this.editingTypeImages = [];
    this.roomImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    this.roomImagePreviews = [];
  }

  removeType(id: number): void {
    if (!confirm('Delete this room type?')) return;

    this.api.deleteRoomType(id).subscribe({
      next: () => {
        this.success = 'Room type deleted.';
        this.load();
      },
      error: (e) => this.showError(e, 'Room type could not be deleted.'),
    });
  }

  saveRate(): void {
    if (this.rateDraft.validUntil < this.rateDraft.validFrom) {
      this.error = 'Valid until must be on or after valid from.';
      return;
    }

    this.busy = true;
    this.error = '';
    this.success = '';

    const call = this.editingRateId
      ? this.api.updateRate(this.editingRateId, this.rateDraft)
      : this.api.createRate(this.rateDraft);

    call.subscribe({
      next: () => {
        this.busy = false;
        this.cancelRateEdit();
        this.success = 'Room rate saved successfully.';
        this.load();
      },
      error: (e) => {
        this.busy = false;
        this.showError(e, 'Room rate could not be saved.');
      },
    });
  }

  editRate(rate: RoomRateApiResponse): void {
    this.error = '';
    this.success = '';
    this.editingRateId = rate.id;

    this.rateDraft = {
      roomTypeId: rate.roomTypeId,
      ratePlanType: rate.ratePlanType,
      nightlyRate: rate.nightlyRate,
      currency: rate.currency,
      validFrom: rate.validFrom?.slice(0, 16) ?? '',
      validUntil: rate.validUntil?.slice(0, 16) ?? '',
      active: rate.active,
    };
  }

  cancelRateEdit(): void {
    this.editingRateId = null;
    this.rateDraft = this.emptyRate();
  }

  removeRate(id: number): void {
    if (!confirm('Delete this room rate?')) return;

    this.api.deleteRate(id).subscribe({
      next: () => {
        this.success = 'Room rate deleted.';
        this.load();
      },
      error: (e) => this.showError(e, 'Room rate could not be deleted.'),
    });
  }

  saveAvailability(): void {
    this.busy = true;
    this.error = '';
    this.success = '';
    const call = this.editingAvailabilityId
      ? this.api.updateAvailability(this.editingAvailabilityId, this.availabilityDraft)
      : this.api.createAvailability(this.availabilityDraft);
    call.subscribe({
      next: () => {
        this.busy = false;
        this.cancelAvailabilityEdit();
        this.success = 'Room availability saved successfully.';
        this.load();
      },
      error: (e) => {
        this.busy = false;
        this.showError(e, 'Room availability could not be saved.');
      },
    });
  }

  editAvailability(item: RoomAvailabilityApiResponse): void {
    this.error = '';
    this.success = '';
    this.editingAvailabilityId = item.id;
    this.availabilityDraft = {
      roomId: item.roomId,
      availableOn: item.availableOn,
      availableUnits: item.availableUnits,
    };
  }

  cancelAvailabilityEdit(): void {
    this.editingAvailabilityId = null;
    this.availabilityDraft = this.emptyAvailability();
  }

  removeAvailability(id: number): void {
    if (!confirm('Delete this date-wise availability record?')) return;
    this.api.deleteAvailability(id).subscribe({
      next: () => {
        this.success = 'Room availability deleted.';
        this.load();
      },
      error: (e) => this.showError(e, 'Room availability could not be deleted.'),
    });
  }

  saveRoom(): void {
    this.busy = true;
    this.error = '';
    this.success = '';

    const call = this.editingRoomId
      ? this.api.updateRoom(this.editingRoomId, this.roomDraft)
      : this.api.createRoom(this.roomDraft);

    call.subscribe({
      next: (saved) => {
        this.busy = false;
        const finalize = () => {
          this.busy = false;
          this.cancelRoomEdit();
          this.success = 'Physical room saved successfully.';
          this.load();
        };
        if (this.physicalRoomFiles.length) {
          this.busy = true;
          this.media.upload('ROOM', saved.id, this.physicalRoomFiles, this.physicalRoomFiles.map(file => file.name.slice(0, 160)), 0).subscribe({
            next: finalize,
            error: (e) => { this.busy = false; this.showError(e, 'Room saved, but its photos could not be uploaded.'); this.load(); },
          });
          return;
        }
        this.cancelRoomEdit();
        this.success = 'Physical room saved successfully.';
        this.load();
      },
      error: (e) => {
        this.busy = false;
        this.showError(e, 'Physical room could not be saved.');
      },
    });
  }

  editRoom(room: RoomApiResponse): void {
    this.error = '';
    this.success = '';
    this.editingRoomId = room.id;
    this.roomDraft = {
      hotelId: room.hotelId,
      roomTypeId: room.roomTypeId,
      roomNumber: room.roomNumber,
      status: room.status,
      floorLabel: room.floorLabel,
      viewDescription: room.viewDescription,
    };
    this.clearPhysicalRoomPreviews();
    this.physicalRoomFiles = [];
    this.editingRoomImages = (room.images ?? []).map(image => ({ ...image }));
    for (const image of this.editingRoomImages) this.media.previewUrl(image.publicUrl).subscribe({
      next: (url) => { if (this.editingRoomId === room.id && this.editingRoomImages.some(current => current.id === image.id)) image.previewUrl = url; else URL.revokeObjectURL(url); },
    });
  }

  cancelRoomEdit(): void {
    this.editingRoomId = null;
    this.roomDraft = this.emptyRoom();
    this.clearPhysicalRoomPreviews();
    this.physicalRoomFiles = [];
    this.editingRoomImages = [];
  }

  selectPhysicalRoomImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    this.physicalRoomFiles = selected.filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)).slice(0, 10);
    if (this.physicalRoomFiles.length !== selected.length) this.error = 'Select up to 10 JPG, PNG, or WebP images.';
    this.clearPhysicalRoomPreviews();
    this.physicalRoomPreviews = this.physicalRoomFiles.map(file => URL.createObjectURL(file));
    input.value = '';
  }

  deletePhysicalRoomImage(id: number): void {
    this.media.delete('ROOM', id).subscribe({ next: () => { this.editingRoomImages = this.editingRoomImages.filter(image => image.id !== id); }, error: e => this.showError(e, 'Physical room photo could not be removed.') });
  }

  private clearPhysicalRoomPreviews(): void {
    this.physicalRoomPreviews.forEach(URL.revokeObjectURL);
    this.physicalRoomPreviews = [];
    this.editingRoomImages.forEach(image => { if (image.previewUrl) URL.revokeObjectURL(image.previewUrl); });
  }

  removeRoom(id: number): void {
    if (!confirm('Delete this physical room?')) return;

    this.api.deleteRoom(id).subscribe({
      next: () => {
        this.success = 'Physical room deleted.';
        this.load();
      },
      error: (e) => this.showError(e, 'Physical room could not be deleted.'),
    });
  }

  roomTypeName(id: number): string {
    const type = this.roomTypes.find((item) => item.id === id);
    return type ? `#${type.id} — ${type.name}` : `#${id}`;
  }

  syncRoomHotel(roomTypeId: number): void {
    const roomType = this.roomTypes.find((item) => item.id === Number(roomTypeId));
    if (roomType) this.roomDraft.hotelId = roomType.hotelId;
  }

  roomLabel(id: number): string {
    const room = this.rooms.find((item) => item.id === id);
    return room ? `${this.roomTypeName(room.roomTypeId)} · Room ${room.roomNumber}` : `Room #${id}`;
  }

  roomFloorView(room: RoomApiResponse): string {
    return [room.floorLabel, room.viewDescription].filter((value) => !!value?.trim()).join(' · ') || '—';
  }

  private showError(e: any, fallback: string): void {
    this.error = e?.error?.message || e?.error?.detail || fallback;
  }

  private emptyType(): RoomTypeRequest {
    return {
      hotelId: 0,
      name: '',
      category: 'STANDARD',
      bedType: 'DOUBLE',
      maxOccupancy: 1,
      sizeSquareMeters: null,
      airConditioned: true,
      description: null,
      amenities: [],
      listingStatus: 'DRAFT',
    };
  }

  private emptyRoom(): RoomRequest {
    return {
      hotelId: 0,
      roomTypeId: 0,
      roomNumber: '',
      status: 'AVAILABLE',
      floorLabel: null,
      viewDescription: null,
    };
  }

  private emptyRate(): RoomRateRequest {
    return {
      roomTypeId: 0,
      ratePlanType: 'FLEXIBLE',
      nightlyRate: 0,
      currency: 'BDT',
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: `${new Date().getFullYear()}-12-31T23:59`,
      active: true,
    };
  }

  private emptyAvailability(): RoomAvailabilityRequest {
    return {
      roomId: 0,
      availableOn: '',
      availableUnits: 1,
    };
  }
}
