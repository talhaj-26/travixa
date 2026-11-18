import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';

interface MapPlace {
  id: number;
  name: string;
  location: string;
  category: string;
  description: string;
  image: string;
  rating: number;
  distance: string;
  icon: string;
  featured: boolean;
  coordinates: {
    top: number;
    left: number;
  };
}

@Component({
  selector: 'app-google-maps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './google-maps.component.html',
  styleUrl: './google-maps.component.scss',
})
export class GoogleMapsComponent {
  searchTerm = '';
  selectedCategory = 'ALL';
  selectedPlace: MapPlace | null = null;
  directionSummary = '';

  categories = [
    {
      value: 'ALL',
      label: 'All Places',
      icon: '🌍',
    },
    {
      value: 'HOTEL',
      label: 'Hotels',
      icon: '🏨',
    },
    {
      value: 'RESTAURANT',
      label: 'Restaurants',
      icon: '🍽️',
    },
    {
      value: 'ATTRACTION',
      label: 'Attractions',
      icon: '📍',
    },
    {
      value: 'TRANSPORT',
      label: 'Transport',
      icon: '🚌',
    },
  ];

  places: MapPlace[] = [
    {
      id: 1,
      name: 'Sea Pearl Beach Resort',
      location: 'Cox’s Bazar',
      category: 'HOTEL',
      description:
        'Premium beachfront accommodation with sea views and modern facilities.',
      image: 'assets/images/hotels/sea-pearl.jpg',
      rating: 4.8,
      distance: '1.2 km',
      icon: '🏨',
      featured: true,
      coordinates: {
        top: 34,
        left: 68,
      },
    },
    {
      id: 2,
      name: 'Laboni Beach',
      location: 'Cox’s Bazar',
      category: 'ATTRACTION',
      description:
        'One of the most popular beach areas for enjoying the sea and sunset.',
      image: 'assets/images/destinations/Coxs-Bazar.jpg',
      rating: 4.9,
      distance: '2.4 km',
      icon: '🏖️',
      featured: true,
      coordinates: {
        top: 48,
        left: 78,
      },
    },
    {
      id: 3,
      name: 'The Xchange',
      location: 'Chattogram',
      category: 'RESTAURANT',
      description:
        'A premium dining destination offering international cuisine and hospitality.',
      image: 'assets/images/restaurants/the-xchange.jpg',
      rating: 4.7,
      distance: '3.1 km',
      icon: '🍽️',
      featured: true,
      coordinates: {
        top: 58,
        left: 42,
      },
    },
    {
      id: 4,
      name: 'Sajek Valley',
      location: 'Rangamati',
      category: 'ATTRACTION',
      description:
        'A breathtaking hill destination famous for clouds, mountains and nature.',
      image: 'assets/images/destinations/Sajek.jpg',
      rating: 4.8,
      distance: '5.8 km',
      icon: '⛰️',
      featured: true,
      coordinates: {
        top: 22,
        left: 31,
      },
    },
    {
      id: 5,
      name: 'Grand Dhaka Hotel',
      location: 'Dhaka',
      category: 'HOTEL',
      description:
        'A modern city hotel offering premium accommodation and urban convenience.',
      image: 'assets/images/hotels/grand-dhaka.jpg',
      rating: 4.5,
      distance: '4.2 km',
      icon: '🏨',
      featured: false,
      coordinates: {
        top: 63,
        left: 55,
      },
    },
    {
      id: 6,
      name: 'Cox’s Bazar Bus Terminal',
      location: 'Cox’s Bazar',
      category: 'TRANSPORT',
      description:
        'Convenient transport point for buses connecting Cox’s Bazar with major cities.',
      image: 'assets/images/transportation/bus.jpg',
      rating: 4.3,
      distance: '6.4 km',
      icon: '🚌',
      featured: false,
      coordinates: {
        top: 72,
        left: 25,
      },
    },
    {
      id: 7,
      name: 'Himchari National Park',
      location: 'Cox’s Bazar',
      category: 'ATTRACTION',
      description:
        'A beautiful natural area featuring hills, waterfalls and coastal scenery.',
      image: 'assets/images/destinations/Coxs-Bazar.jpg',
      rating: 4.7,
      distance: '8.1 km',
      icon: '🌿',
      featured: true,
      coordinates: {
        top: 78,
        left: 73,
      },
    },
    {
      id: 8,
      name: 'Sajek Resort',
      location: 'Sajek Valley',
      category: 'HOTEL',
      description:
        'A peaceful hillside stay offering panoramic views of the surrounding mountains.',
      image: 'assets/images/hotels/sajek-resort.jpg',
      rating: 4.7,
      distance: '2.8 km',
      icon: '🏨',
      featured: false,
      coordinates: {
        top: 37,
        left: 18,
      },
    },
  ];

  constructor(private router: Router, private readonly toast: ToastService) {}

  get filteredPlaces(): MapPlace[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.places.filter((place) => {
      const matchesCategory =
        this.selectedCategory === 'ALL' ||
        place.category === this.selectedCategory;

      const matchesSearch =
        !term ||
        place.name.toLowerCase().includes(term) ||
        place.location.toLowerCase().includes(term) ||
        place.category.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }

  get featuredPlaces(): MapPlace[] {
    return this.filteredPlaces.filter((place) => place.featured);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  selectPlace(place: MapPlace): void {
    this.selectedPlace = place;
  }

  clearSelection(): void {
    this.selectedPlace = null;
    this.directionSummary = '';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'ALL';
    this.selectedPlace = null;
  }

  searchLocation(): void {
    const firstMatch = this.filteredPlaces[0];

    if (firstMatch) {
      this.selectedPlace = firstMatch;
    }
  }

  getMapMarkerStyle(place: MapPlace): { [key: string]: string } {
    return {
      top: `${place.coordinates.top}%`,
      left: `${place.coordinates.left}%`,
    };
  }

  getCategoryLabel(category: string): string {
    const item = this.categories.find(
      (categoryItem) => categoryItem.value === category,
    );

    return item?.label ?? category;
  }

  getCategoryIcon(category: string): string {
    const item = this.categories.find(
      (categoryItem) => categoryItem.value === category,
    );

    return item?.icon ?? '📍';
  }

  getDirections(place: MapPlace): void {
    this.selectedPlace = place;
    const distance = Number.parseFloat(place.distance) || 0;
    const minutes = Math.max(6, Math.round(distance * 4.5));
    this.directionSummary = `Demo route: approximately ${place.distance} · ${minutes} min by local transport.`;
    this.toast.info('Route prepared', this.directionSummary);
  }

  explorePlace(place: MapPlace): void {
    this.selectedPlace = place;

    if (place.category === 'HOTEL') {
      this.router.navigate(['/stays'], {
        queryParams: {
          destination: place.location,
        },
      });

      return;
    }

    if (place.category === 'RESTAURANT') {
      this.router.navigate(['/restaurants']);
      return;
    }

    if (place.category === 'TRANSPORT') {
      this.router.navigate(['/transportation']);
      return;
    }

    this.router.navigate(['/destinations'], {
      queryParams: {
        destination: place.location,
      },
    });
  }

  openDiscover(): void {
    this.router.navigate(['/discover']);
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }

  openStays(): void {
    this.router.navigate(['/stays']);
  }

  goBack(): void {
    window.history.back();
  }
}
