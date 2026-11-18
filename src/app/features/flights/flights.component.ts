import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';

interface Flight {
  id: number;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  departure: string;
  arrival: string;
  duration: string;
  durationMinutes: number;
  stops: 'NON-STOP' | 'ONE-STOP' | 'TWO-STOP';
  stopsLabel: string;
  price: number;
  originalPrice: number;
  aircraft: string;
  baggage: string;
  seatsLeft: number;
  logo: string;
  cabinClass: string;
  popular: boolean;
  badge?: string;
}

interface PopularRoute {
  from: string;
  to: string;
  code: string;
  price: number;
  duration: string;
  image: string;
}

@Component({
  selector: 'app-flights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flights.component.html',
  styleUrls: ['./flights.component.scss'],
})
export class FlightsComponent {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // ═══════════════════════════════════════════════
  // SEARCH STATE
  // ═══════════════════════════════════════════════
  tripType: 'ROUND_TRIP' | 'ONE_WAY' | 'MULTI_CITY' = 'ROUND_TRIP';
  from = '';
  to = '';
  departureDate = '';
  returnDate = '';
  passengers = 1;
  cabinClass = 'Economy';

  // ═══════════════════════════════════════════════
  // FILTERS
  // ═══════════════════════════════════════════════
  selectedStops = 'ALL';
  selectedAirlines: string[] = [];
  selectedDepartureTime = 'ALL';
  sortBy: 'price-low' | 'price-high' | 'duration' | 'departure' = 'price-low';

  // ═══════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════
  searchPerformed = signal(false);
  comparingFlights = signal<number[]>([]);
  showFiltersMobile = signal(false);

  // ═══════════════════════════════════════════════
  // FILTER OPTIONS
  // ═══════════════════════════════════════════════
  stopsOptions = [
    { value: 'ALL', label: 'Any Stops' },
    { value: 'NON-STOP', label: 'Non-stop' },
    { value: 'ONE-STOP', label: '1 Stop' },
    { value: 'TWO-STOP', label: '2+ Stops' },
  ];

  departureTimeOptions = [
    { value: 'ALL', label: 'Any Time' },
    { value: 'EARLY_MORNING', label: 'Early Morning (00:00 - 06:00)' },
    { value: 'MORNING', label: 'Morning (06:00 - 12:00)' },
    { value: 'AFTERNOON', label: 'Afternoon (12:00 - 18:00)' },
    { value: 'EVENING', label: 'Evening (18:00 - 24:00)' },
  ];

  sortOptions = [
    { value: 'price-low', label: 'Lowest Price' },
    { value: 'price-high', label: 'Highest Price' },
    { value: 'duration', label: 'Shortest Duration' },
    { value: 'departure', label: 'Earliest Departure' },
  ];

  airlines = [
    { code: 'BG', name: 'Biman Bangladesh', logo: 'biman' },
    { code: 'BS', name: 'US-Bangla Airlines', logo: 'us-bangla' },
    { code: '2A', name: 'Air Astra', logo: 'air-astra' },
    { code: 'BS', name: 'Novoair', logo: 'novoair' },
    { code: 'EK', name: 'Emirates', logo: 'emirates' },
    { code: 'QR', name: 'Qatar Airways', logo: 'qatar' },
  ];

  // ═══════════════════════════════════════════════
  // POPULAR ROUTES — 8 Unique
  // ═══════════════════════════════════════════════
  popularRoutes: PopularRoute[] = [
    {
      from: 'Dhaka',
      to: "Cox's Bazar",
      code: 'DAC → CXB',
      price: 5200,
      duration: '1h 05m',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=85',
    },
    {
      from: 'Dhaka',
      to: 'Chattogram',
      code: 'DAC → CGP',
      price: 4500,
      duration: '55m',
      image:
        'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=85',
    },
    {
      from: 'Dhaka',
      to: 'Sylhet',
      code: 'DAC → ZYL',
      price: 4800,
      duration: '50m',
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=85',
    },
    {
      from: 'Dhaka',
      to: 'Dubai',
      code: 'DAC → DXB',
      price: 38500,
      duration: '5h 20m',
      image:
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=85',
    },
    {
      from: 'Dhaka',
      to: 'Kuala Lumpur',
      code: 'DAC → KUL',
      price: 34500,
      duration: '4h 10m',
      image:
        'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&q=85',
    },
    {
      from: 'Dhaka',
      to: 'Bangkok',
      code: 'DAC → BKK',
      price: 28900,
      duration: '3h 15m',
      image:
        'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=85',
    },
    {
      from: 'Dhaka',
      to: 'Singapore',
      code: 'DAC → SIN',
      price: 41200,
      duration: '4h 40m',
      image:
        'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=85',
    },
    {
      from: 'Dhaka',
      to: 'Delhi',
      code: 'DAC → DEL',
      price: 22500,
      duration: '2h 30m',
      image:
        'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=85',
    },
  ];

  // ═══════════════════════════════════════════════
  // FLIGHTS — 14 unique flights
  // ═══════════════════════════════════════════════
  allFlights: Flight[] = [
    {
      id: 1,
      airline: 'Biman Bangladesh Airlines',
      airlineCode: 'BG',
      flightNumber: 'BG-101',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: "Cox's Bazar",
      toCode: 'CXB',
      departure: '08:15',
      arrival: '09:20',
      duration: '1h 05m',
      durationMinutes: 65,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 5200,
      originalPrice: 6800,
      aircraft: 'Boeing 737-800',
      baggage: '20kg + 7kg',
      seatsLeft: 8,
      logo: 'biman',
      cabinClass: 'Economy',
      popular: true,
      badge: 'BEST VALUE',
    },
    {
      id: 2,
      airline: 'US-Bangla Airlines',
      airlineCode: 'BS',
      flightNumber: 'BS-141',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: "Cox's Bazar",
      toCode: 'CXB',
      departure: '11:30',
      arrival: '12:35',
      duration: '1h 05m',
      durationMinutes: 65,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 5800,
      originalPrice: 7200,
      aircraft: 'ATR 72-600',
      baggage: '20kg + 7kg',
      seatsLeft: 12,
      logo: 'us-bangla',
      cabinClass: 'Economy',
      popular: true,
      badge: 'POPULAR',
    },
    {
      id: 3,
      airline: 'Air Astra',
      airlineCode: '2A',
      flightNumber: '2A-301',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Chattogram',
      toCode: 'CGP',
      departure: '14:20',
      arrival: '15:15',
      duration: '55m',
      durationMinutes: 55,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 4500,
      originalPrice: 5800,
      aircraft: 'ATR 72-600',
      baggage: '20kg + 7kg',
      seatsLeft: 15,
      logo: 'air-astra',
      cabinClass: 'Economy',
      popular: false,
    },
    {
      id: 4,
      airline: 'Biman Bangladesh Airlines',
      airlineCode: 'BG',
      flightNumber: 'BG-305',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Sylhet',
      toCode: 'ZYL',
      departure: '17:10',
      arrival: '18:00',
      duration: '50m',
      durationMinutes: 50,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 4800,
      originalPrice: 6200,
      aircraft: 'Dash 8-400',
      baggage: '20kg + 7kg',
      seatsLeft: 6,
      logo: 'biman',
      cabinClass: 'Economy',
      popular: false,
      badge: 'FEW SEATS',
    },
    {
      id: 5,
      airline: 'Emirates',
      airlineCode: 'EK',
      flightNumber: 'EK-585',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Dubai',
      toCode: 'DXB',
      departure: '03:45',
      arrival: '07:05',
      duration: '5h 20m',
      durationMinutes: 320,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 38500,
      originalPrice: 48000,
      aircraft: 'Boeing 777-300ER',
      baggage: '30kg + 7kg',
      seatsLeft: 20,
      logo: 'emirates',
      cabinClass: 'Economy',
      popular: true,
      badge: 'BEST RATED',
    },
    {
      id: 6,
      airline: 'Qatar Airways',
      airlineCode: 'QR',
      flightNumber: 'QR-639',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Dubai',
      toCode: 'DXB',
      departure: '10:30',
      arrival: '15:30',
      duration: '7h 00m',
      durationMinutes: 420,
      stops: 'ONE-STOP',
      stopsLabel: '1 Stop (Doha)',
      price: 34200,
      originalPrice: 42000,
      aircraft: 'Airbus A350',
      baggage: '30kg + 7kg',
      seatsLeft: 14,
      logo: 'qatar',
      cabinClass: 'Economy',
      popular: false,
    },
    {
      id: 7,
      airline: 'US-Bangla Airlines',
      airlineCode: 'BS',
      flightNumber: 'BS-307',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Kuala Lumpur',
      toCode: 'KUL',
      departure: '22:30',
      arrival: '04:40',
      duration: '4h 10m',
      durationMinutes: 250,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 34500,
      originalPrice: 42000,
      aircraft: 'Boeing 737-800',
      baggage: '20kg + 7kg',
      seatsLeft: 18,
      logo: 'us-bangla',
      cabinClass: 'Economy',
      popular: true,
    },
    {
      id: 8,
      airline: 'Biman Bangladesh Airlines',
      airlineCode: 'BG',
      flightNumber: 'BG-088',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Bangkok',
      toCode: 'BKK',
      departure: '19:00',
      arrival: '22:15',
      duration: '3h 15m',
      durationMinutes: 195,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 28900,
      originalPrice: 36500,
      aircraft: 'Boeing 787-8',
      baggage: '30kg + 7kg',
      seatsLeft: 22,
      logo: 'biman',
      cabinClass: 'Economy',
      popular: true,
      badge: 'NEW ROUTE',
    },
    {
      id: 9,
      airline: 'Singapore Airlines',
      airlineCode: 'SQ',
      flightNumber: 'SQ-447',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Singapore',
      toCode: 'SIN',
      departure: '23:55',
      arrival: '06:35',
      duration: '4h 40m',
      durationMinutes: 280,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 41200,
      originalPrice: 52000,
      aircraft: 'Airbus A350',
      baggage: '30kg + 7kg',
      seatsLeft: 16,
      logo: 'biman',
      cabinClass: 'Economy',
      popular: false,
      badge: '5-STAR',
    },
    {
      id: 10,
      airline: 'IndiGo',
      airlineCode: '6E',
      flightNumber: '6E-1084',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'Delhi',
      toCode: 'DEL',
      departure: '15:30',
      arrival: '18:00',
      duration: '2h 30m',
      durationMinutes: 150,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 22500,
      originalPrice: 28000,
      aircraft: 'Airbus A320',
      baggage: '15kg + 7kg',
      seatsLeft: 24,
      logo: 'air-astra',
      cabinClass: 'Economy',
      popular: false,
    },
    {
      id: 11,
      airline: 'Emirates',
      airlineCode: 'EK',
      flightNumber: 'EK-587',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'London',
      toCode: 'LHR',
      departure: '02:15',
      arrival: '12:30',
      duration: '14h 15m',
      durationMinutes: 855,
      stops: 'ONE-STOP',
      stopsLabel: '1 Stop (Dubai)',
      price: 98500,
      originalPrice: 125000,
      aircraft: 'Airbus A380',
      baggage: '30kg + 7kg',
      seatsLeft: 10,
      logo: 'emirates',
      cabinClass: 'Economy',
      popular: true,
      badge: 'BEST PREMIUM',
    },
    {
      id: 12,
      airline: 'Qatar Airways',
      airlineCode: 'QR',
      flightNumber: 'QR-641',
      from: 'Dhaka',
      fromCode: 'DAC',
      to: 'New York',
      toCode: 'JFK',
      departure: '04:45',
      arrival: '18:20',
      duration: '19h 35m',
      durationMinutes: 1175,
      stops: 'ONE-STOP',
      stopsLabel: '1 Stop (Doha)',
      price: 132000,
      originalPrice: 165000,
      aircraft: 'Boeing 777-300ER',
      baggage: '30kg + 7kg',
      seatsLeft: 8,
      logo: 'qatar',
      cabinClass: 'Economy',
      popular: false,
    },
    {
      id: 13,
      airline: 'Biman Bangladesh Airlines',
      airlineCode: 'BG',
      flightNumber: 'BG-107',
      from: "Cox's Bazar",
      fromCode: 'CXB',
      to: 'Dhaka',
      toCode: 'DAC',
      departure: '10:30',
      arrival: '11:35',
      duration: '1h 05m',
      durationMinutes: 65,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 5100,
      originalPrice: 6600,
      aircraft: 'Boeing 737-800',
      baggage: '20kg + 7kg',
      seatsLeft: 14,
      logo: 'biman',
      cabinClass: 'Economy',
      popular: false,
    },
    {
      id: 14,
      airline: 'Air Astra',
      airlineCode: '2A',
      flightNumber: '2A-411',
      from: 'Chattogram',
      fromCode: 'CGP',
      to: 'Kolkata',
      toCode: 'CCU',
      departure: '13:15',
      arrival: '14:30',
      duration: '1h 15m',
      durationMinutes: 75,
      stops: 'NON-STOP',
      stopsLabel: 'Non-stop',
      price: 8900,
      originalPrice: 11500,
      aircraft: 'ATR 72-600',
      baggage: '20kg + 7kg',
      seatsLeft: 20,
      logo: 'air-astra',
      cabinClass: 'Economy',
      popular: false,
      badge: 'INTERNATIONAL',
    },
  ];

  // ═══════════════════════════════════════════════
  // FILTERED RESULTS
  // ═══════════════════════════════════════════════
  get flights(): Flight[] {
    let result = [...this.allFlights];

    // If search performed → filter by from/to
    if (this.searchPerformed() && this.from && this.to) {
      const searchFrom = this.from.toLowerCase().trim();
      const searchTo = this.to.toLowerCase().trim();

      result = result.filter(
        (f) =>
          f.from.toLowerCase().includes(searchFrom) &&
          f.to.toLowerCase().includes(searchTo),
      );
    }

    // Apply filters
    result = result.filter((f) => {
      // Stops filter
      const matchesStops =
        this.selectedStops === 'ALL' || f.stops === this.selectedStops;

      // Airlines filter
      const matchesAirline =
        this.selectedAirlines.length === 0 ||
        this.selectedAirlines.includes(f.airlineCode);

      // Departure time filter
      let matchesTime = true;
      if (this.selectedDepartureTime !== 'ALL') {
        const hour = parseInt(f.departure.split(':')[0], 10);
        matchesTime =
          (this.selectedDepartureTime === 'EARLY_MORNING' && hour < 6) ||
          (this.selectedDepartureTime === 'MORNING' &&
            hour >= 6 &&
            hour < 12) ||
          (this.selectedDepartureTime === 'AFTERNOON' &&
            hour >= 12 &&
            hour < 18) ||
          (this.selectedDepartureTime === 'EVENING' && hour >= 18);
      }

      return matchesStops && matchesAirline && matchesTime;
    });

    // Sort
    switch (this.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'duration':
        result.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case 'departure':
        result.sort((a, b) => a.departure.localeCompare(b.departure));
        break;
    }

    return result;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedStops !== 'ALL') count++;
    if (this.selectedAirlines.length > 0) count++;
    if (this.selectedDepartureTime !== 'ALL') count++;
    return count;
  }

  get airlineCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.airlines.forEach((a) => {
      counts[a.code] = this.allFlights.filter(
        (f) => f.airlineCode === a.code,
      ).length;
    });
    return counts;
  }

  // ═══════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════
  searchFlights(): void {
    this.searchPerformed.set(true);

    if (!this.from || !this.to) {
      this.toast.info('Enter route', 'Please provide both from and to cities');
      return;
    }

    const results = this.flights;
    if (results.length === 0) {
      this.toast.warning('No flights found', 'Try a different route');
    } else {
      this.toast.success(
        `${results.length} flights found`,
        `${this.from} → ${this.to}`,
      );
    }
  }

  swapLocations(): void {
    const temp = this.from;
    this.from = this.to;
    this.to = temp;
  }

  selectRoute(from: string, to: string): void {
    this.from = from;
    this.to = to;
    this.searchPerformed.set(true);

    setTimeout(() => {
      document.querySelector('.results-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  resetSearch(): void {
    this.from = '';
    this.to = '';
    this.departureDate = '';
    this.returnDate = '';
    this.passengers = 1;
    this.cabinClass = 'Economy';
    this.searchPerformed.set(false);
    this.selectedStops = 'ALL';
    this.selectedAirlines = [];
    this.selectedDepartureTime = 'ALL';
    this.sortBy = 'price-low';
  }

  clearFilters(): void {
    this.selectedStops = 'ALL';
    this.selectedAirlines = [];
    this.selectedDepartureTime = 'ALL';
  }

  toggleAirline(code: string): void {
    const idx = this.selectedAirlines.indexOf(code);
    if (idx > -1) {
      this.selectedAirlines.splice(idx, 1);
    } else {
      this.selectedAirlines.push(code);
    }
    this.selectedAirlines = [...this.selectedAirlines];
  }

  isAirlineSelected(code: string): boolean {
    return this.selectedAirlines.includes(code);
  }

  // ═══════════════════════════════════════════════
  // COMPARE
  // ═══════════════════════════════════════════════
  toggleCompare(flightId: number, event: Event): void {
    event.stopPropagation();

    const current = this.comparingFlights();
    if (current.includes(flightId)) {
      this.comparingFlights.set(current.filter((id) => id !== flightId));
    } else {
      if (current.length >= 3) {
        this.toast.warning(
          'Compare limit reached',
          'You can compare up to 3 flights',
        );
        return;
      }
      this.comparingFlights.set([...current, flightId]);
    }
  }

  isComparing(flightId: number): boolean {
    return this.comparingFlights().includes(flightId);
  }

  discountPercent(flight: Flight): number {
    if (!flight.originalPrice || flight.originalPrice <= flight.price) return 0;
    return Math.round(
      ((flight.originalPrice - flight.price) / flight.originalPrice) * 100,
    );
  }

  getAirlineColor(code: string): string {
    const colors: Record<string, string> = {
      BG: '#006A4E',
      BS: '#003C8F',
      '2A': '#E30613',
      EK: '#D71921',
      QR: '#5C0632',
      SQ: '#F9A825',
    };
    return colors[code] || '#4f46e5';
  }

  selectFlight(flight: Flight): void {
    this.router.navigate(['/booking'], {
      queryParams: {
        type: 'FLIGHT',
        itemId: flight.id,
        flightNumber: flight.flightNumber,
      },
    });
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }
}
