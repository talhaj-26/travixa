import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HotelApiResponse, HotelRequest, HotelService } from '../../../core/services/hotel.service';
import { RestaurantApiResponse, RestaurantRequest, RestaurantService } from '../../../core/services/restaurant.service';
import { TourPackageApiResponse, TourPackageRequest, TourPackageService } from '../../../core/services/tour-package.service';

type ListingCategory = 'HOTEL' | 'RESTAURANT' | 'TOUR_PACKAGE';
type ListingStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
interface Listing {
  id: number;
  name: string;
  category: ListingCategory;
  location: string;
  owner: string;
  submittedAt: string;
  description: string;
  status: ListingStatus;
  priceLabel: string;
  icon: string;
  coverClass: string;
  reference: string;
}

@Component({
  selector: 'app-listing-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listing-approvals.component.html',
  styleUrl: './listing-approvals.component.scss',
})
export class ListingApprovalsComponent implements OnInit {
  searchTerm = '';
  activeCategory: 'ALL' | ListingCategory = 'ALL';
  activeStatus: 'ALL' | ListingStatus = 'ALL';
  selectedListing: Listing | null = null;
  feedback = '';
  error = '';
  loading = true;
  savingListingId: number | null = null;
  listings: Listing[] = [];
  private hotels: HotelApiResponse[] = [];
  private restaurants: RestaurantApiResponse[] = [];
  private packages: TourPackageApiResponse[] = [];

  constructor(
    private readonly hotelService: HotelService,
    private readonly restaurantService: RestaurantService,
    private readonly tourPackageService: TourPackageService,
  ) {}

  ngOnInit(): void { this.loadListings(); }

  get filteredListings(): Listing[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.listings.filter((listing) =>
      (this.activeCategory === 'ALL' || listing.category === this.activeCategory) &&
      (this.activeStatus === 'ALL' || listing.status === this.activeStatus) &&
      (!query || [listing.name, listing.location, listing.owner, listing.reference, this.categoryLabel(listing.category)]
        .some((value) => value.toLowerCase().includes(query))),
    );
  }
  get totalCount(): number { return this.listings.length; }
  get pendingCount(): number { return this.listings.filter((item) => item.status === 'PENDING').length; }
  get approvedCount(): number { return this.listings.filter((item) => item.status === 'APPROVED').length; }
  get rejectedCount(): number { return this.listings.filter((item) => item.status === 'REJECTED').length; }
  get categoryCounts(): Record<'ALL' | ListingCategory, number> {
    return {
      ALL: this.listings.length,
      HOTEL: this.listings.filter((item) => item.category === 'HOTEL').length,
      RESTAURANT: this.listings.filter((item) => item.category === 'RESTAURANT').length,
      TOUR_PACKAGE: this.listings.filter((item) => item.category === 'TOUR_PACKAGE').length,
    };
  }
  categoryLabel(category: ListingCategory): string {
    return { HOTEL: 'Hotel', RESTAURANT: 'Restaurant', TOUR_PACKAGE: 'Tour package' }[category];
  }
  statusLabel(status: ListingStatus): string {
    return { PENDING: 'Pending review', APPROVED: 'Approved', REJECTED: 'Rejected' }[status];
  }
  setCategory(category: 'ALL' | ListingCategory): void { this.activeCategory = category; }
  setStatus(status: 'ALL' | ListingStatus): void { this.activeStatus = status; }
  openDetails(listing: Listing): void { this.selectedListing = listing; this.feedback = ''; }
  closeDetails(): void { this.selectedListing = null; }

  updateStatus(listing: Listing, status: ListingStatus): void {
    if (this.savingListingId !== null) return;
    const listingStatus = status === 'APPROVED' ? 'PUBLISHED' : status === 'REJECTED' ? 'SUSPENDED' : 'PENDING_REVIEW';
    this.savingListingId = listing.id;
    this.error = '';
    this.updateListingOnServer(listing, listingStatus, () => {
      this.listings = this.listings.map((item) => item.id === listing.id ? { ...item, status } : item);
      if (this.selectedListing?.id === listing.id) this.selectedListing = { ...listing, status };
      this.feedback = `${listing.name}: ${this.statusLabel(status)}.`;
      this.savingListingId = null;
    }, (error) => {
      this.error = error?.error?.message ?? 'Listing status could not be saved.';
      this.savingListingId = null;
    });
  }
  resetFilters(): void { this.searchTerm = ''; this.activeCategory = 'ALL'; this.activeStatus = 'ALL'; }
  trackById(_index: number, listing: Listing): string { return `${listing.category}-${listing.id}`; }

  private loadListings(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      hotels: this.hotelService.getAdminHotels(),
      restaurants: this.restaurantService.getAdminRestaurants(),
      packages: this.tourPackageService.getAdminPackages(),
    }).subscribe({
      next: ({ hotels, restaurants, packages }) => {
        this.hotels = hotels;
        this.restaurants = restaurants;
        this.packages = packages;
        this.listings = [
          ...hotels.map((item) => this.hotelListing(item)),
          ...restaurants.map((item) => this.restaurantListing(item)),
          ...packages.map((item) => this.packageListing(item)),
        ];
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message ?? 'Could not load listings from the API.';
        this.loading = false;
      },
    });
  }
  private hotelListing(item: HotelApiResponse): Listing {
    return this.toListing(item.id, item.name, 'HOTEL', item.address, item.organizationId, item.description, item.listingStatus, 'Room rates set on the hotel', '⌂', 'cover-hotel');
  }
  private restaurantListing(item: RestaurantApiResponse): Listing {
    return this.toListing(item.id, item.name, 'RESTAURANT', item.address, item.organizationId, item.description, item.listingStatus, 'Menu pricing set on the restaurant', '♨', 'cover-restaurant');
  }
  private packageListing(item: TourPackageApiResponse): Listing {
    return this.toListing(item.id, item.name, 'TOUR_PACKAGE', item.destinationName, item.organizationId, item.description, item.listingStatus, `${item.basePrice} ${item.currency} / person`, '✧', 'cover-tea');
  }
  private toListing(id: number, name: string, category: ListingCategory, location: string, organizationId: number, description: string | null, backendStatus: string, priceLabel: string, icon: string, coverClass: string): Listing {
    const status: ListingStatus = backendStatus === 'PUBLISHED' ? 'APPROVED' : backendStatus === 'SUSPENDED' || backendStatus === 'ARCHIVED' ? 'REJECTED' : 'PENDING';
    return { id, name, category, location: location || '—', owner: `Organization #${organizationId}`, submittedAt: '—', description: description || '', status, priceLabel, icon, coverClass, reference: `${category.slice(0, 1)}-${id}` };
  }
  private updateListingOnServer(listing: Listing, status: 'PUBLISHED' | 'SUSPENDED' | 'PENDING_REVIEW', success: () => void, failure: (error: any) => void): void {
    const hotel = listing.category === 'HOTEL' ? this.hotels.find((item) => item.id === listing.id) : undefined;
    const restaurant = listing.category === 'RESTAURANT' ? this.restaurants.find((item) => item.id === listing.id) : undefined;
    const tourPackage = listing.category === 'TOUR_PACKAGE' ? this.packages.find((item) => item.id === listing.id) : undefined;
    if (hotel) {
      const request: HotelRequest = { organizationId: hotel.organizationId, destinationId: hotel.destinationId, name: hotel.name, slug: hotel.slug, description: hotel.description, address: hotel.address, contactEmail: hotel.contactEmail, contactPhone: hotel.contactPhone, latitude: hotel.latitude, longitude: hotel.longitude, starRating: hotel.starRating, listingStatus: status, checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime, cancellationPolicy: hotel.cancellationPolicy, childPolicy: hotel.childPolicy, additionalCharges: hotel.additionalCharges };
      this.hotelService.updateHotel(hotel.id, request).subscribe({ next: success, error: failure });
      return;
    }
    if (restaurant) {
      const request: RestaurantRequest = { organizationId: restaurant.organizationId, destinationId: restaurant.destinationId, name: restaurant.name, slug: restaurant.slug, description: restaurant.description, address: restaurant.address, contactEmail: restaurant.contactEmail ?? '', contactPhone: restaurant.contactPhone, cuisineType: restaurant.cuisineType, openingHours: restaurant.openingHours, cancellationPolicy: restaurant.cancellationPolicy, listingStatus: status };
      this.restaurantService.update(restaurant.id, request).subscribe({ next: success, error: failure });
      return;
    }
    if (tourPackage) {
      const { id: _id, destinationName: _destinationName, ...request } = tourPackage;
      const update: TourPackageRequest = { ...request, listingStatus: status };
      this.tourPackageService.update(tourPackage.id, update).subscribe({ next: success, error: failure });
      return;
    }
    this.savingListingId = null;
    failure(new Error('Listing no longer exists.'));
  }
}
