import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MediaService } from '../../../core/services/media.service';
import { TourPackageApiResponse, TourPackageService } from '../../../core/services/tour-package.service';

interface TourPackage {
  id: number;
  organizationId: number;
  title: string;
  destination: string;
  description: string;
  image: string;
  durationDays: number;
  price: number;
  currency: 'BDT' | 'USD' | 'EUR' | 'GBP';
  inclusions: string[];
  groupSize: number;
}

@Component({
  selector: 'app-tour-packages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tour-packages.component.html',
  styleUrls: ['./tour-packages.component.scss'],
})
export class TourPackagesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly packagesApi = inject(TourPackageService);
  private readonly mediaApi = inject(MediaService);

  searchTerm = '';
  selectedDestination = 'ALL';
  selectedDuration = 'ALL';
  selectedPrice = 'ALL';
  sortBy: 'price-low' | 'price-high' | 'duration' | 'name' = 'name';
  viewMode = signal<'grid' | 'list'>('grid');
  loading = true;
  catalogError = '';
  currentPage = 0;
  readonly pageSize = 6;
  packages: TourPackage[] = [];
  destinations: { value: string; label: string }[] = [{ value: 'ALL', label: 'All destinations' }];
  readonly categories: { value: string; label: string; icon: string }[] = [];

  durationOptions = [
    { value: 'ALL', label: 'Any duration' },
    { value: '1-2', label: '1–2 days' },
    { value: '3-4', label: '3–4 days' },
    { value: '5-7', label: '5–7 days' },
    { value: '8+', label: '8+ days' },
  ];

  priceOptions = [
    { value: 'ALL', label: 'Any budget' },
    { value: 'UNDER-5000', label: 'Under ৳5,000' },
    { value: '5000-10000', label: '৳5,000–৳10,000' },
    { value: '10000-20000', label: '৳10,000–৳20,000' },
    { value: '20000+', label: '৳20,000+' },
  ];

  sortOptions = [
    { value: 'name', label: 'Destination and name' },
    { value: 'price-low', label: 'Price: low to high' },
    { value: 'price-high', label: 'Price: high to low' },
    { value: 'duration', label: 'Duration: short to long' },
  ];

  get agencyCount(): number {
    return new Set(this.packages.map((item) => item.organizationId)).size;
  }

  get pageCount(): number { return Math.max(1, Math.ceil(this.filteredPackages.length / this.pageSize)); }
  get pagedPackages(): TourPackage[] { return this.filteredPackages.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize); }

  get filteredPackages(): TourPackage[] {
    const term = this.searchTerm.trim().toLowerCase();
    let result = this.packages.filter((pkg) => {
      const matchesSearch = !term || [pkg.title, pkg.destination, pkg.description, ...pkg.inclusions]
        .some((value) => value.toLowerCase().includes(term));
      const matchesDestination = this.selectedDestination === 'ALL' || pkg.destination === this.selectedDestination;
      const matchesDuration = this.selectedDuration === 'ALL'
        || (this.selectedDuration === '1-2' && pkg.durationDays >= 1 && pkg.durationDays <= 2)
        || (this.selectedDuration === '3-4' && pkg.durationDays >= 3 && pkg.durationDays <= 4)
        || (this.selectedDuration === '5-7' && pkg.durationDays >= 5 && pkg.durationDays <= 7)
        || (this.selectedDuration === '8+' && pkg.durationDays >= 8);
      const matchesPrice = this.selectedPrice === 'ALL'
        || (pkg.currency === 'BDT' && this.selectedPrice === 'UNDER-5000' && pkg.price < 5000)
        || (pkg.currency === 'BDT' && this.selectedPrice === '5000-10000' && pkg.price >= 5000 && pkg.price <= 10000)
        || (pkg.currency === 'BDT' && this.selectedPrice === '10000-20000' && pkg.price > 10000 && pkg.price <= 20000)
        || (pkg.currency === 'BDT' && this.selectedPrice === '20000+' && pkg.price > 20000);
      return matchesSearch && matchesDestination && matchesDuration && matchesPrice;
    });

    result = [...result].sort((a, b) => {
      switch (this.sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'duration': return a.durationDays - b.durationDays || a.title.localeCompare(b.title);
        default: return a.destination.localeCompare(b.destination) || a.title.localeCompare(b.title);
      }
    });
    return result;
  }

  get activeFilterCount(): number {
    return Number(this.selectedDestination !== 'ALL') + Number(this.selectedDuration !== 'ALL') + Number(this.selectedPrice !== 'ALL');
  }

  ngOnInit(): void { this.loadPackages(); }

  loadPackages(): void {
    this.loading = true;
    this.currentPage = 0;
    this.catalogError = '';
    this.packagesApi.getPublished().subscribe({
      next: (items) => {
        if (!items.length) {
          this.packages = [];
          this.destinations = [{ value: 'ALL', label: 'All destinations' }];
          this.loading = false;
          return;
        }
        forkJoin(items.map((item) => this.packagesApi.images(item.id).pipe(catchError(() => of([])))))
          .subscribe({
            next: (galleries) => {
              this.packages = items.map((item, index) => this.fromApi(item, galleries[index] ?? []));
              this.destinations = [
                { value: 'ALL', label: 'All destinations' },
                ...Array.from(new Set(this.packages.map((item) => item.destination).filter(Boolean)))
                  .sort((a, b) => a.localeCompare(b)).map((name) => ({ value: name, label: name })),
              ];
              this.loading = false;
            },
            error: () => { this.packages = []; this.loading = false; this.catalogError = 'Tour package photos could not be loaded.'; },
          });
      },
      error: (error) => {
        this.packages = [];
        this.catalogError = error?.status === 0 ? 'The tour package API is unavailable.' : 'Published tour packages could not be loaded.';
        this.loading = false;
      },
    });
  }

  private fromApi(item: TourPackageApiResponse, gallery: { publicUrl: string; coverImage: boolean }[]): TourPackage {
    const cover = gallery.find((image) => image.coverImage) ?? gallery[0];
    return {
      id: item.id,
      organizationId: item.organizationId,
      title: item.name,
      destination: item.destinationName,
      description: item.description || '',
      image: this.mediaApi.resolveMediaUrl(cover?.publicUrl),
      durationDays: item.durationDays,
      price: Number(item.basePrice),
      currency: item.currency,
      inclusions: (item.inclusions || '').split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean),
      groupSize: item.maximumGroupSize,
    };
  }

  clearFilters(): void {
    this.currentPage = 0;
    this.searchTerm = '';
    this.selectedDestination = 'ALL';
    this.selectedDuration = 'ALL';
    this.selectedPrice = 'ALL';
  }

  goToPage(page: number): void { this.currentPage = Math.max(0, Math.min(page, this.pageCount - 1)); }

  setViewMode(mode: 'grid' | 'list'): void { this.viewMode.set(mode); }
  viewPackage(pkg: TourPackage): void { void this.router.navigate(['/tour-package-details'], { queryParams: { id: pkg.id } }); }
  bookPackage(pkg: TourPackage): void { this.viewPackage(pkg); }
  formatPrice(pkg: TourPackage, amount: number): string {
    return `${pkg.currency === 'BDT' ? '৳' : pkg.currency} ${amount.toLocaleString('en-BD')}`;
  }
  openPlanner(): void { void this.router.navigate(['/ai-planner']); }
  goToDiscover(): void { void this.router.navigate(['/discover']); }
}
