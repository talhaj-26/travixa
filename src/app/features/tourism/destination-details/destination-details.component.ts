import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { DestinationApiResponse, DestinationService } from '../../../core/services/destination.service';
import { HotelApiResponse, HotelImageApiResponse, HotelService } from '../../../core/services/hotel.service';
import { MediaService } from '../../../core/services/media.service';
import { RestaurantApiResponse, RestaurantService } from '../../../core/services/restaurant.service';
import { RestaurantImageApiResponse } from '../../../core/services/restaurant-catalog.service';
import { PackageImageApiResponse, TourPackageApiResponse, TourPackageService } from '../../../core/services/tour-package.service';
import { TransportScheduleApi, TransportService } from '../../../core/services/transport.service';

interface DestinationListing { id: number; name: string; description: string; location: string; image: string; meta: string; }

@Component({
  selector: 'app-destination-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './destination-details.component.html',
  styleUrl: './destination-details.component.scss',
})
export class DestinationDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destinationsApi = inject(DestinationService);
  private readonly hotelsApi = inject(HotelService);
  private readonly restaurantsApi = inject(RestaurantService);
  private readonly packagesApi = inject(TourPackageService);
  private readonly transportApi = inject(TransportService);
  private readonly mediaApi = inject(MediaService);

  destination: DestinationApiResponse | null = null;
  hotels: DestinationListing[] = [];
  restaurants: DestinationListing[] = [];
  packages: DestinationListing[] = [];
  transport: DestinationListing[] = [];
  loading = true;
  loadError = '';

  get listingCount(): number { return this.hotels.length + this.restaurants.length + this.packages.length + this.transport.length; }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.loading = false;
        this.loadError = 'A valid destination was not selected.';
        return;
      }
      this.load(id);
    });
  }

  private load(destinationId: number): void {
    this.loading = true;
    this.loadError = '';
    this.hotels = [];
    this.restaurants = [];
    this.packages = [];
    this.transport = [];
    this.destinationsApi.getPublishedFromApi().subscribe({
      next: (items) => {
        const destination = items.find((item) => item.id === destinationId);
        if (!destination) {
          this.destination = null;
          this.loading = false;
          this.loadError = 'This destination is not available.';
          return;
        }
        this.destination = { ...destination, imageUrl: this.mediaApi.resolveMediaUrl(destination.imageUrl) || null };
        this.loadServices(this.destination);
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Destination information could not be loaded. Please try again.';
      },
    });
  }

  private loadServices(destination: DestinationApiResponse): void {
    forkJoin({
      hotels: this.hotelsApi.getPublishedFromApi().pipe(catchError(() => of([] as HotelApiResponse[]))),
      restaurants: this.restaurantsApi.getPublished().pipe(catchError(() => of([] as RestaurantApiResponse[]))),
      packages: this.packagesApi.getPublished().pipe(catchError(() => of([] as TourPackageApiResponse[]))),
      schedules: this.transportApi.getPublicSchedules().pipe(catchError(() => of([] as TransportScheduleApi[]))),
    }).subscribe(({ hotels, restaurants, packages, schedules }) => {
      const destinationName = destination.name.trim().toLocaleLowerCase();
      const matchingHotels = hotels.filter((item) => item.destinationId === destination.id);
      const matchingRestaurants = restaurants.filter((item) => item.destinationId === destination.id);
      const matchingPackages = packages.filter((item) => item.destinationId === destination.id);
      const matchingSchedules = schedules.filter((item) => item.destinationName.trim().toLocaleLowerCase() === destinationName
        && item.status === 'SCHEDULED' && item.availableSeats > 0);

      forkJoin({
        hotels: matchingHotels.length ? forkJoin(matchingHotels.map((item) => this.hotelsApi.getPublishedImages(item.id).pipe(catchError(() => of([] as HotelImageApiResponse[]))))) : of([] as HotelImageApiResponse[][]),
        restaurants: matchingRestaurants.length ? forkJoin(matchingRestaurants.map((item) => this.restaurantsApi.getPublishedImages(item.id).pipe(catchError(() => of([] as RestaurantImageApiResponse[]))))) : of([] as RestaurantImageApiResponse[][]),
        packages: matchingPackages.length ? forkJoin(matchingPackages.map((item) => this.packagesApi.images(item.id).pipe(catchError(() => of([] as PackageImageApiResponse[]))))) : of([] as PackageImageApiResponse[][]),
      }).subscribe(({ hotels: hotelImages, restaurants: restaurantImages, packages: packageImages }) => {
        this.hotels = matchingHotels.map((item, index) => {
          const gallery = hotelImages[index] ?? [];
          const cover = gallery.find((image) => image.coverImage) ?? gallery[0];
          return this.listing(item.id, item.name, item.description, item.address, cover?.publicUrl, `${item.starRating || 'Stay'} star hotel`, destination.imageUrl);
        });
        this.restaurants = matchingRestaurants.map((item, index) => {
          const gallery = restaurantImages[index] ?? [];
          const cover = gallery.find((image) => image.coverImage) ?? gallery[0];
          return this.listing(item.id, item.name, item.description, item.address, cover?.publicUrl, item.cuisineType || 'Restaurant', destination.imageUrl);
        });
        this.packages = matchingPackages.map((item, index) => {
          const gallery = packageImages[index] ?? [];
          const cover = gallery.find((image) => image.coverImage) ?? gallery[0];
          return this.listing(item.id, item.name, item.description, destination.name, cover?.publicUrl,
            `${item.durationDays} days · ${item.currency} ${Number(item.basePrice).toLocaleString()}`, destination.imageUrl);
        });
        this.transport = matchingSchedules.map((item) => this.listing(item.id, item.providerName || item.vehicleType,
          `${item.originName} to ${item.destinationName}`, `${item.vehicleLabel} · ${item.availableSeats} seats available`, null,
          `${item.currency} ${Number(item.ticketPrice).toLocaleString()} · ${new Date(item.departureAt).toLocaleString()}`, destination.imageUrl));
        this.loading = false;
      });
    });
  }

  private listing(id: number, name: string, description: string | null, location: string,
    imageUrl: string | null | undefined, meta: string, fallbackImage: string | null): DestinationListing {
    return { id, name, description: description || 'More service details are available on the listing page.', location,
      image: this.mediaApi.resolveMediaUrl(imageUrl) || this.mediaApi.resolveMediaUrl(fallbackImage), meta };
  }

  openHotel(id: number): void { void this.router.navigate(['/hotel-details'], { queryParams: { id } }); }
  openRestaurant(id: number): void { void this.router.navigate(['/restaurant-details'], { queryParams: { id } }); }
  openPackage(id: number): void { void this.router.navigate(['/tour-package-details'], { queryParams: { id } }); }
  openTransport(): void { void this.router.navigate(['/transportation'], { queryParams: { to: this.destination?.name } }); }
  hideBrokenImage(event: Event): void { (event.currentTarget as HTMLImageElement | null)?.classList.add('image-broken'); }
  retry(): void { if (this.destination) this.load(this.destination.id); }
}
