import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaService } from '../../../core/services/media.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { RestaurantApiResponse, RestaurantService } from '../../../core/services/restaurant.service';
import {
  MenuCategoryApiResponse,
  MenuCategoryRequest,
  MenuItemApiResponse,
  MenuItemRequest,
  BuffetScheduleApiResponse,
  BuffetScheduleRequest,
  RestaurantCatalogService,
  RestaurantImageApiResponse,
  RestaurantReservationApiResponse,
  RestaurantTableApiResponse,
  RestaurantTableRequest,
  TableAvailabilityApiResponse,
  TableAvailabilityRequest,
} from '../../../core/services/restaurant-catalog.service';

@Component({
  selector: 'app-restaurant-operations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './restaurant-operations.component.scss',
  template: `
    <main class="restaurant-operations-page">
      <header class="operations-header">
        <div><span class="operations-eyebrow">DINING MANAGEMENT</span><h1>Restaurant operations</h1>
          <p>Build a complete dining listing with menu, food photos, seating and buffet schedules.</p></div>
        <span class="operations-record-count">{{ menuItems.length }} menu items</span>
      </header>
      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>

      <div class="card card-body mb-4">
        <label class="form-label" for="restaurant">Restaurant</label>
        <select id="restaurant" class="form-select" [(ngModel)]="restaurantId" (ngModelChange)="onRestaurantChange()" [disabled]="loading">
          <option [ngValue]="0">Select restaurant</option>
          <option *ngFor="let restaurant of restaurants" [ngValue]="restaurant.id">{{ restaurant.name }} — {{ restaurant.listingStatus }}</option>
        </select>
      </div>

      <ng-container *ngIf="restaurantId > 0">
        <section class="card card-body mb-4">
          <h2 class="h5">Menu categories</h2>
          <form class="row g-2 mb-3" #categoryForm="ngForm" (ngSubmit)="saveCategory()">
            <div class="col-md-3"><input class="form-control" name="categoryName" required maxlength="120" [(ngModel)]="categoryDraft.name" placeholder="Category name"></div>
            <div class="col-md-4"><input class="form-control" name="categoryDescription" [(ngModel)]="categoryDraft.description" placeholder="Description"></div>
            <div class="col-md-2"><input class="form-control" type="number" min="0" name="displayOrder" [(ngModel)]="categoryDraft.displayOrder" placeholder="Order"></div>
            <div class="col-md-1 form-check pt-2"><input class="form-check-input" type="checkbox" name="categoryActive" [(ngModel)]="categoryDraft.active"> Active</div>
            <div class="col-md-2"><button class="btn btn-primary w-100" [disabled]="categoryForm.invalid || busy">{{ editingCategoryId ? 'Update' : 'Add' }}</button></div>
          </form>
          <table class="table table-sm"><thead><tr><th>Name</th><th>Order</th><th>Active</th><th></th></tr></thead><tbody>
            <tr *ngFor="let category of categories"><td>{{ category.name }}</td><td>{{ category.displayOrder }}</td><td>{{ category.active ? 'Yes' : 'No' }}</td><td><button class="btn btn-sm btn-outline-secondary me-1" (click)="editCategory(category)">Edit</button><button class="btn btn-sm btn-outline-danger" (click)="deleteCategory(category.id)">Delete</button></td></tr>
          </tbody></table>
        </section>

        <section class="card card-body mb-4">
          <h2 class="h5">Menu items</h2>
          <p class="text-muted">Create 10–12 items here before publishing the restaurant.</p>
          <form class="row g-2 mb-3" #menuForm="ngForm" (ngSubmit)="saveMenuItem()">
            <div class="col-md-3"><select class="form-select" name="menuCategory" required [(ngModel)]="menuDraft.categoryId"><option [ngValue]="0">Select category</option><option *ngFor="let category of categories" [ngValue]="category.id">{{ category.name }}</option></select></div>
            <div class="col-md-3"><input class="form-control" name="menuName" required maxlength="140" [(ngModel)]="menuDraft.name" placeholder="Item name"></div>
            <div class="col-md-2"><input class="form-control" type="number" min="0.01" step="0.01" name="menuPrice" required [(ngModel)]="menuDraft.price" placeholder="Price"></div>
            <div class="col-md-2"><select class="form-select" name="menuStatus" [(ngModel)]="menuDraft.status"><option value="DRAFT">DRAFT</option><option value="AVAILABLE">AVAILABLE</option><option value="UNAVAILABLE">UNAVAILABLE</option><option value="ARCHIVED">ARCHIVED</option></select></div>
            <div class="col-md-1 form-check pt-2"><input class="form-check-input" type="checkbox" name="vegetarian" [(ngModel)]="menuDraft.vegetarian"> Veg</div>
            <div class="col-md-1"><button class="btn btn-primary w-100" [disabled]="menuForm.invalid || menuDraft.categoryId < 1 || busy">{{ editingMenuItemId ? 'Update' : 'Add' }}</button></div>
            <div class="col-12"><input class="form-control" name="menuDescription" maxlength="2000" [(ngModel)]="menuDraft.description" placeholder="Description"></div>
            <div class="col-md-6"><label class="form-label" for="dietaryInfo">Dietary information</label><input id="dietaryInfo" class="form-control" name="dietaryInfo" maxlength="500" [(ngModel)]="menuDraft.dietaryInformation" placeholder="e.g. Vegan, gluten-free"></div>
            <div class="col-md-6"><label class="form-label" for="allergenInfo">Allergens</label><input id="allergenInfo" class="form-control" name="allergenInfo" maxlength="500" [(ngModel)]="menuDraft.allergenInformation" placeholder="e.g. Contains peanuts, dairy"></div>
            <div class="col-md-7"><label class="form-label" for="menuPhoto">Food photo</label><input id="menuPhoto" class="form-control" type="file" accept="image/jpeg,image/png,image/webp" (change)="selectMenuImage($event)"><small class="form-text">One JPEG, PNG or WebP image, up to 5 MB.</small></div>
            <div class="col-md-5"><label class="form-label" for="menuImageAlt">Photo description</label><input id="menuImageAlt" class="form-control" name="menuImageAlt" maxlength="160" [(ngModel)]="menuImageAltText" placeholder="Describe the dish photo"></div>
            <div class="col-12 selected-menu-photo" *ngIf="selectedMenuImage || editingMenuImageUrl"><img *ngIf="editingMenuImageUrl" [src]="mediaApi.resolveMediaUrl(editingMenuImageUrl)" alt="Current menu item photo"><span>{{ selectedMenuImage?.name || 'Current menu item photo' }}</span><button *ngIf="editingMenuImageUrl && !selectedMenuImage" type="button" class="btn btn-sm btn-outline-danger" (click)="deleteMenuPhoto()">Remove current photo</button></div>
          </form>
          <table class="table table-sm"><thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>
            <tr *ngFor="let item of menuItems"><td class="menu-dish-cell"><img *ngIf="item.imageUrl" [src]="menuPhotoUrls[item.id] || mediaApi.resolveMediaUrl(item.imageUrl)" [alt]="item.name" loading="lazy" (error)="$any($event.target).hidden = true"><span>{{ item.name }}</span></td><td>{{ categoryName(item.categoryId) }}</td><td>{{ item.price | number:'1.2-2' }} {{ item.currency }}</td><td>{{ item.status }}</td><td><button type="button" class="btn btn-sm btn-outline-secondary me-1" (click)="editMenuItem(item)">Edit</button><button *ngIf="item.imageUrl" type="button" class="btn btn-sm btn-outline-danger me-1" (click)="deleteMenuPhoto(item.id)">Remove photo</button><button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteMenuItem(item.id)">Delete</button></td></tr>
          </tbody></table>
        </section>

        <section class="card card-body mb-4">
          <h2 class="h5">Dining tables</h2>
          <form class="row g-2 mb-3" #tableForm="ngForm" (ngSubmit)="saveTable()">
            <div class="col-md-4"><input class="form-control" name="tableNumber" required maxlength="40" [(ngModel)]="tableDraft.tableNumber" placeholder="Table number"></div>
            <div class="col-md-3"><input class="form-control" type="number" min="1" name="capacity" required [(ngModel)]="tableDraft.capacity" placeholder="Capacity"></div>
            <div class="col-md-3"><select class="form-select" name="tableStatus" [(ngModel)]="tableDraft.status"><option value="AVAILABLE">AVAILABLE</option><option value="RESERVED">RESERVED</option><option value="OCCUPIED">OCCUPIED</option><option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option></select></div>
            <div class="col-md-2"><button class="btn btn-primary w-100" [disabled]="tableForm.invalid || busy">{{ editingTableId ? 'Update' : 'Add' }}</button></div>
          </form>
          <table class="table table-sm"><thead><tr><th>Table</th><th>Capacity</th><th>Status</th><th></th></tr></thead><tbody>
            <tr *ngFor="let table of tables"><td>{{ table.tableNumber }}</td><td>{{ table.capacity }}</td><td>{{ table.status }}</td><td><button class="btn btn-sm btn-outline-secondary me-1" (click)="editTable(table)">Edit</button><button class="btn btn-sm btn-outline-danger" (click)="deleteTable(table.id)">Delete</button></td></tr>
          </tbody></table>
        </section>

        <section class="card card-body mb-4">
          <h2 class="h5">Table availability &amp; time slots</h2>
          <p class="text-muted">Publish the dates, times and remaining seats customers can reserve.</p>
          <form class="row g-2 mb-3" #slotForm="ngForm" (ngSubmit)="saveSlot()">
            <div class="col-md-3"><label class="form-label" for="slotTable">Table</label><select id="slotTable" class="form-select" name="slotTable" required [(ngModel)]="slotDraft.tableId"><option [ngValue]="0" disabled>Select table</option><option *ngFor="let table of tables" [ngValue]="table.id">{{ table.tableNumber }} · {{ table.capacity }} seats</option></select></div>
            <div class="col-md-2"><label class="form-label" for="slotDate">Date</label><input id="slotDate" class="form-control" type="date" name="slotDate" required [(ngModel)]="slotDraft.availableOn"></div>
            <div class="col-md-2"><label class="form-label" for="slotStart">Starts</label><input id="slotStart" class="form-control" type="time" name="slotStart" required [(ngModel)]="slotDraft.startsAt"></div>
            <div class="col-md-2"><label class="form-label" for="slotEnd">Ends</label><input id="slotEnd" class="form-control" type="time" name="slotEnd" required [(ngModel)]="slotDraft.endsAt"></div>
            <div class="col-md-1"><label class="form-label" for="slotSeats">Seats</label><input id="slotSeats" class="form-control" type="number" min="0" name="slotSeats" required [(ngModel)]="slotDraft.availableSeats"></div>
            <div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary w-100" [disabled]="slotForm.invalid || busy || slotDraft.tableId < 1 || (slotDraft.endsAt <= slotDraft.startsAt)">{{ editingSlotId ? 'Update slot' : 'Add slot' }}</button></div>
            <div class="col-12" *ngIf="editingSlotId"><button type="button" class="btn btn-sm btn-outline-secondary" (click)="cancelSlotEdit()">Cancel edit</button></div>
          </form>
          <div class="table-responsive"><table class="table table-sm"><thead><tr><th>Date</th><th>Table</th><th>Time</th><th>Available seats</th><th></th></tr></thead><tbody>
            <tr *ngFor="let slot of tableSlots"><td>{{ slot.availableOn }}</td><td>{{ slot.tableNumber }}</td><td>{{ slot.startsAt }}–{{ slot.endsAt }}</td><td>{{ slot.availableSeats }}</td><td class="text-nowrap"><button type="button" class="btn btn-sm btn-outline-secondary me-1" (click)="editSlot(slot)">Edit</button><button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteSlot(slot.id)">Delete</button></td></tr>
            <tr *ngIf="tableSlots.length === 0"><td colspan="5" class="text-muted">No table slots configured.</td></tr>
          </tbody></table></div>
        </section>

        <section class="card card-body mb-4">
          <h2 class="h5">Restaurant photos</h2>
          <form class="row g-2 mb-3" (ngSubmit)="saveImage()">
            <div class="col-md-5"><input class="form-control" type="file" accept="image/jpeg,image/png,image/webp" multiple required (change)="selectImages($event)"></div>
            <div class="col-md-5"><input class="form-control" name="altText" maxlength="160" [(ngModel)]="imageAltText" placeholder="Alt text for selected photos"></div>
            <div class="col-md-2"><button class="btn btn-primary w-100" [disabled]="selectedImages.length === 0 || busy">Upload photos</button></div>
            <div class="col-12 text-muted small">JPEG, PNG or WebP; up to 10 images and 5 MB per image.</div>
          </form>
          <div class="restaurant-image-grid"><div *ngFor="let image of images" class="restaurant-image-card"><img [src]="imagePreviewUrls[image.id] || mediaApi.resolveMediaUrl(image.publicUrl)" [alt]="image.altText || 'Restaurant photo'" loading="lazy" (error)="$any($event.target).hidden = true"><small>{{ image.coverImage ? 'Cover photo' : 'Gallery photo' }}</small><button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteImage(image.id)">Delete</button></div></div>
        </section>

        <section class="card card-body mb-4">
          <h2 class="h5">Buffet schedules</h2>
          <form class="row g-2 mb-3" #buffetForm="ngForm" (ngSubmit)="saveBuffet()">
            <div class="col-md-2"><input class="form-control" type="date" name="buffetDate" required [(ngModel)]="buffetDraft.buffetDate"></div>
            <div class="col-md-2"><input class="form-control" type="time" name="buffetStarts" required [(ngModel)]="buffetDraft.startsAt"></div>
            <div class="col-md-2"><input class="form-control" type="time" name="buffetEnds" required [(ngModel)]="buffetDraft.endsAt"></div>
            <div class="col-md-2"><input class="form-control" type="number" min="0.01" name="adultPrice" required [(ngModel)]="buffetDraft.adultPrice" placeholder="Adult price"></div>
            <div class="col-md-2"><input class="form-control" type="number" min="0" name="childPrice" [(ngModel)]="buffetDraft.childPrice" placeholder="Child price"></div>
            <div class="col-md-1"><input class="form-control" type="number" min="1" name="buffetCapacity" required [(ngModel)]="buffetDraft.capacity" placeholder="Capacity"></div>
            <div class="col-md-1"><button class="btn btn-primary w-100" [disabled]="buffetForm.invalid || busy">{{ editingBuffetId ? 'Update' : 'Add' }}</button></div>
            <div class="col-md-3"><select class="form-select" name="buffetStatus" [(ngModel)]="buffetDraft.listingStatus"><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="SUSPENDED">SUSPENDED</option><option value="ARCHIVED">ARCHIVED</option></select></div>
            <div class="col-md-9"><input class="form-control" name="buffetMenuSummary" maxlength="2000" [(ngModel)]="buffetDraft.menuSummary" placeholder="Included menu items / buffet summary"></div>
          </form>
          <table class="table table-sm"><thead><tr><th>Date</th><th>Time</th><th>Adult / Child</th><th>Capacity</th><th>Status</th><th></th></tr></thead><tbody><tr *ngFor="let buffet of buffetSchedules"><td>{{ buffet.buffetDate }}</td><td>{{ buffet.startsAt }}–{{ buffet.endsAt }}</td><td>{{ buffet.adultPrice }} / {{ buffet.childPrice || '—' }} {{ buffet.currency }}</td><td>{{ buffet.capacity }}</td><td>{{ buffet.listingStatus }}</td><td><button class="btn btn-sm btn-outline-secondary me-1" (click)="editBuffet(buffet)">Edit</button><button class="btn btn-sm btn-outline-danger" (click)="deleteBuffet(buffet.id)">Delete</button></td></tr></tbody></table>
        </section>

        <section class="card card-body mb-4">
          <h2 class="h5">Reservations</h2>
          <table class="table table-sm"><thead><tr><th>Starts at</th><th>Guests</th><th>Table</th><th>Status</th><th></th></tr></thead><tbody>
            <tr *ngFor="let reservation of restaurantReservations"><td>{{ reservation.startsAt | date:'medium' }}</td><td>{{ reservation.guestCount }}</td><td>{{ reservation.tableId || 'Unassigned' }}</td><td>{{ reservation.status }}</td><td><select class="form-select form-select-sm" [ngModel]="reservation.status" (ngModelChange)="updateReservation(reservation.id, $event)"><option value="PENDING">PENDING</option><option value="CONFIRMED">CONFIRMED</option><option value="SEATED">SEATED</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option><option value="NO_SHOW">NO_SHOW</option></select></td></tr>
          </tbody></table>
        </section>
      </ng-container>
    </main>
  `,
})
export class RestaurantOperationsComponent implements OnInit, OnDestroy {
  private readonly restaurantApi = inject(RestaurantService);
  private readonly catalogApi = inject(RestaurantCatalogService);
  readonly mediaApi = inject(MediaService);
  restaurants: RestaurantApiResponse[] = [];
  restaurantId = 0;
  categories: MenuCategoryApiResponse[] = [];
  menuItems: MenuItemApiResponse[] = [];
  tables: RestaurantTableApiResponse[] = [];
  tableSlots: TableAvailabilityApiResponse[] = [];
  images: RestaurantImageApiResponse[] = [];
  imagePreviewUrls: Record<number, string> = {};
  menuPhotoUrls: Record<number, string> = {};
  reservations: RestaurantReservationApiResponse[] = [];
  buffetSchedules: BuffetScheduleApiResponse[] = [];
  loading = false;
  busy = false;
  error = '';
  success = '';
  editingCategoryId: number | null = null;
  editingMenuItemId: number | null = null;
  editingTableId: number | null = null;
  editingBuffetId: number | null = null;
  editingSlotId: number | null = null;
  categoryDraft = this.emptyCategory();
  menuDraft = this.emptyMenu();
  tableDraft = this.emptyTable();
  selectedImages: File[] = [];
  selectedMenuImage: File | null = null;
  editingMenuImageUrl: string | null = null;
  editingMenuItemIdForPhoto: number | null = null;
  menuImageAltText = '';
  imageAltText = '';
  buffetDraft = this.emptyBuffet();
  slotDraft: TableAvailabilityRequest = this.emptySlot();

  ngOnInit(): void { this.loadRestaurants(); }
  ngOnDestroy(): void { this.revokeUrls(this.imagePreviewUrls); this.revokeUrls(this.menuPhotoUrls); }
  get restaurantReservations(): RestaurantReservationApiResponse[] { return this.reservations.filter((item) => item.restaurantId === this.restaurantId); }

  private loadRestaurants(): void {
    this.loading = true;
    this.restaurantApi.getAdminRestaurants().subscribe({ next: (items) => { this.restaurants = items ?? []; this.loading = false; }, error: (e) => { this.error = this.message(e, 'Restaurants could not be loaded.'); this.loading = false; } });
  }
  onRestaurantChange(): void { this.resetForms(); if (this.restaurantId > 0) this.loadCatalog(); else { this.categories = []; this.menuItems = []; this.tables = []; this.tableSlots = []; this.images = []; } }
  private loadCatalog(): void {
    this.error = '';
    this.catalogApi.categories(this.restaurantId).subscribe({ next: (items) => this.categories = items ?? [], error: (e) => this.error = this.message(e, 'Categories could not be loaded.') });
    this.catalogApi.menuItems(this.restaurantId).subscribe({ next: (items) => {
      this.menuItems = items ?? [];
      this.revokeUrls(this.menuPhotoUrls);
      const photos = this.menuItems.filter((item) => item.imageUrl);
      if (photos.length) forkJoin(photos.map((item) => this.mediaApi.previewUrl(item.imageUrl).pipe(catchError(() => of('')))))
        .subscribe((urls) => this.menuPhotoUrls = Object.fromEntries(photos.map((item, index) => [item.id, urls[index]])));
      else this.menuPhotoUrls = {};
    }, error: (e) => this.error = this.message(e, 'Menu items could not be loaded.') });
    this.catalogApi.tables(this.restaurantId).subscribe({ next: (items) => this.tables = items ?? [], error: (e) => this.error = this.message(e, 'Tables could not be loaded.') });
    this.catalogApi.tableAvailability(this.restaurantId).subscribe({ next: (items) => this.tableSlots = items ?? [], error: (e) => this.error = this.message(e, 'Table availability could not be loaded.') });
    this.catalogApi.images(this.restaurantId).subscribe({ next: (items) => {
      this.images = items ?? [];
      this.revokeUrls(this.imagePreviewUrls);
      if (this.images.length) forkJoin(this.images.map((image) => this.mediaApi.previewUrl(image.publicUrl).pipe(catchError(() => of('')))))
        .subscribe((urls) => this.imagePreviewUrls = Object.fromEntries(this.images.map((image, index) => [image.id, urls[index]])));
      else this.imagePreviewUrls = {};
    }, error: (e) => this.error = this.message(e, 'Images could not be loaded.') });
    this.catalogApi.buffetSchedules(this.restaurantId).subscribe({ next: (items) => this.buffetSchedules = items ?? [], error: (e) => this.error = this.message(e, 'Buffet schedules could not be loaded.') });
    this.catalogApi.reservations().subscribe({ next: (items) => this.reservations = items ?? [], error: (e) => this.error = this.message(e, 'Reservations could not be loaded.') });
  }
  saveCategory(): void { this.run(this.editingCategoryId ? this.catalogApi.updateCategory(this.editingCategoryId, this.categoryDraft) : this.catalogApi.createCategory(this.categoryDraft), 'Category saved.', () => { this.categoryDraft = this.emptyCategory(); this.editingCategoryId = null; this.loadCatalog(); }); }
  editCategory(item: MenuCategoryApiResponse): void { this.editingCategoryId = item.id; this.categoryDraft = { restaurantId: item.restaurantId, name: item.name, description: item.description, displayOrder: item.displayOrder, active: item.active }; }
  deleteCategory(id: number): void { if (confirm('Delete this category?')) this.run(this.catalogApi.deleteCategory(id), 'Category deleted.', () => this.loadCatalog()); }
  saveMenuItem(): void {
    if (this.busy) return;
    this.busy = true; this.error = ''; this.success = '';
    const request$ = this.editingMenuItemId
      ? this.catalogApi.updateMenuItem(this.editingMenuItemId, this.menuDraft)
      : this.catalogApi.createMenuItem(this.menuDraft);
    request$.subscribe({
      next: (saved) => {
        const finish = (): void => {
          this.busy = false; this.success = 'Menu item saved.'; this.menuDraft = this.emptyMenu();
          this.editingMenuItemId = null; this.editingMenuItemIdForPhoto = null;
          this.editingMenuImageUrl = null; this.selectedMenuImage = null; this.menuImageAltText = '';
          this.loadCatalog();
        };
        if (!this.selectedMenuImage) { finish(); return; }
        this.mediaApi.upload('MENU_ITEM', saved.id, [this.selectedMenuImage], [this.menuImageAltText], 0).subscribe({
          next: finish,
          error: (e) => { this.busy = false; this.error = this.message(e, 'Menu item saved, but its photo could not be uploaded.'); this.loadCatalog(); },
        });
      },
      error: (e) => { this.busy = false; this.error = this.message(e, 'Menu item could not be saved.'); },
    });
  }
  editMenuItem(item: MenuItemApiResponse): void { this.editingMenuItemId = item.id; this.editingMenuItemIdForPhoto = item.id; this.editingMenuImageUrl = item.imageUrl; this.menuDraft = { categoryId: item.categoryId, name: item.name, description: item.description, price: item.price, currency: item.currency as MenuItemRequest['currency'], status: item.status, vegetarian: item.vegetarian, dietaryInformation: item.dietaryInformation, allergenInformation: item.allergenInformation }; }
  selectMenuImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error = '';
    if (!file) { this.selectedMenuImage = null; return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.error = 'Choose a JPEG, PNG or WebP image no larger than 5 MB.'; input.value = ''; this.selectedMenuImage = null; return;
    }
    this.selectedMenuImage = file;
  }
  deleteMenuPhoto(id = this.editingMenuItemIdForPhoto): void {
    if (!id || !confirm('Remove this menu item photo?')) return;
    this.run(this.mediaApi.delete('MENU_ITEM', id), 'Menu photo removed.', () => {
      this.editingMenuImageUrl = null; this.selectedMenuImage = null; this.loadCatalog();
    });
  }
  deleteMenuItem(id: number): void { if (confirm('Delete this menu item?')) this.run(this.catalogApi.deleteMenuItem(id), 'Menu item deleted.', () => this.loadCatalog()); }
  saveTable(): void { this.run(this.editingTableId ? this.catalogApi.updateTable(this.editingTableId, this.tableDraft) : this.catalogApi.createTable(this.tableDraft), 'Table saved.', () => { this.tableDraft = this.emptyTable(); this.editingTableId = null; this.loadCatalog(); }); }
  editTable(item: RestaurantTableApiResponse): void { this.editingTableId = item.id; this.tableDraft = { restaurantId: item.restaurantId, tableNumber: item.tableNumber, capacity: item.capacity, status: item.status }; }
  deleteTable(id: number): void { if (confirm('Delete this table?')) this.run(this.catalogApi.deleteTable(id), 'Table deleted.', () => this.loadCatalog()); }
  saveSlot(): void {
    const table = this.tables.find((item) => item.id === this.slotDraft.tableId);
    if (!table || this.slotDraft.availableSeats > table.capacity) { this.error = 'Available seats must not exceed the selected table capacity.'; return; }
    const request$ = this.editingSlotId
      ? this.catalogApi.updateTableAvailability(this.editingSlotId, this.slotDraft)
      : this.catalogApi.createTableAvailability(this.slotDraft);
    this.run(request$, 'Table time slot saved.', () => { this.cancelSlotEdit(); this.loadCatalog(); });
  }
  editSlot(slot: TableAvailabilityApiResponse): void {
    this.editingSlotId = slot.id;
    this.slotDraft = { restaurantId: slot.restaurantId, tableId: slot.tableId, availableOn: slot.availableOn, startsAt: slot.startsAt, endsAt: slot.endsAt, availableSeats: slot.availableSeats };
  }
  cancelSlotEdit(): void { this.editingSlotId = null; this.slotDraft = this.emptySlot(); }
  deleteSlot(id: number): void { if (confirm('Delete this table slot?')) this.run(this.catalogApi.deleteTableAvailability(id), 'Table slot deleted.', () => this.loadCatalog()); }
  selectImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    if (files.length > 10 || files.some((file) => !allowed.has(file.type) || file.size > 5 * 1024 * 1024) || totalBytes > 20 * 1024 * 1024) {
      this.error = 'Choose up to 10 JPEG, PNG or WebP images, each no larger than 5 MB and 20 MB total.';
      input.value = ''; this.selectedImages = []; return;
    }
    this.error = '';
    this.selectedImages = files;
  }
  saveImage(): void {
    if (!this.restaurantId || !this.selectedImages.length || this.busy) return;
    this.busy = true; this.error = ''; this.success = '';
    this.mediaApi.upload('RESTAURANT', this.restaurantId, this.selectedImages, this.selectedImages.map(() => this.imageAltText), 0).subscribe({
      next: () => { this.busy = false; this.success = 'Restaurant photos uploaded.'; this.selectedImages = []; this.imageAltText = ''; this.loadCatalog(); },
      error: (e) => { this.busy = false; this.error = this.message(e, 'Photos could not be uploaded.'); },
    });
  }
  deleteImage(id: number): void { if (confirm('Delete this photo?')) this.run(this.mediaApi.delete('RESTAURANT', id), 'Photo deleted.', () => this.loadCatalog()); }
  saveBuffet(): void { this.run(this.editingBuffetId ? this.catalogApi.updateBuffetSchedule(this.editingBuffetId, this.buffetDraft) : this.catalogApi.createBuffetSchedule(this.buffetDraft), 'Buffet schedule saved.', () => { this.buffetDraft = this.emptyBuffet(); this.editingBuffetId = null; this.loadCatalog(); }); }
  editBuffet(item: BuffetScheduleApiResponse): void { this.editingBuffetId = item.id; this.buffetDraft = { restaurantId: item.restaurantId, buffetDate: item.buffetDate, startsAt: item.startsAt, endsAt: item.endsAt, adultPrice: item.adultPrice, childPrice: item.childPrice, currency: item.currency, capacity: item.capacity, menuSummary: item.menuSummary, listingStatus: item.listingStatus }; }
  deleteBuffet(id: number): void { if (confirm('Delete this buffet schedule?')) this.run(this.catalogApi.deleteBuffetSchedule(id), 'Buffet schedule deleted.', () => this.loadCatalog()); }
  updateReservation(id: number, status: RestaurantReservationApiResponse['status']): void { this.run(this.catalogApi.updateReservationStatus(id, status), 'Reservation status updated.', () => this.loadCatalog()); }
  categoryName(id: number): string { return this.categories.find((item) => item.id === id)?.name ?? `#${id}`; }
  private run(request$: any, success: string, done: () => void): void { if (this.busy) return; this.busy = true; this.error = ''; this.success = ''; request$.subscribe({ next: () => { this.busy = false; this.success = success; done(); }, error: (e: any) => { this.busy = false; this.error = this.message(e, 'The action could not be completed.'); } }); }
  private resetForms(): void { this.editingCategoryId = this.editingMenuItemId = this.editingTableId = this.editingBuffetId = this.editingSlotId = null; this.editingMenuItemIdForPhoto = null; this.editingMenuImageUrl = null; this.selectedMenuImage = null; this.menuImageAltText = ''; this.categoryDraft = this.emptyCategory(); this.menuDraft = this.emptyMenu(); this.tableDraft = this.emptyTable(); this.buffetDraft = this.emptyBuffet(); this.slotDraft = this.emptySlot(); }
  private emptyCategory(): MenuCategoryRequest { return { restaurantId: this.restaurantId, name: '', description: null, displayOrder: 0, active: true }; }
  private emptyMenu(): MenuItemRequest { return { categoryId: 0, name: '', description: null, price: 0, currency: 'BDT', status: 'DRAFT', vegetarian: false, dietaryInformation: null, allergenInformation: null }; }
  private emptyTable(): RestaurantTableRequest { return { restaurantId: this.restaurantId, tableNumber: '', capacity: 2, status: 'AVAILABLE' }; }
  private emptyBuffet(): BuffetScheduleRequest { return { restaurantId: this.restaurantId, buffetDate: '', startsAt: '', endsAt: '', adultPrice: 0, childPrice: null, currency: 'BDT', capacity: 1, menuSummary: null, listingStatus: 'DRAFT' }; }
  private emptySlot(): TableAvailabilityRequest { return { restaurantId: this.restaurantId, tableId: 0, availableOn: '', startsAt: '', endsAt: '', availableSeats: 0 }; }
  private revokeUrls(urls: Record<number, string>): void { Object.values(urls).forEach((url) => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }); }
  private message(error: any, fallback: string): string { if (error?.status === 401) return 'Your session has expired. Please sign in again.'; if (error?.status === 403) return 'Access denied. Sign in with an ADMIN or SUPER_ADMIN account.'; if (error?.status === 0) return 'Cannot connect to the backend API.'; return error?.error?.detail || error?.error?.message || fallback; }
}
