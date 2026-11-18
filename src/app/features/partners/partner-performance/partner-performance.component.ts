import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardResponse } from '../../../core/models/dashboard.model';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-partner-performance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partner-performance.component.html',
  styleUrl: './partner-performance.component.scss',
})
export class PartnerPerformanceComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  data: DashboardResponse | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboard.getOverview().subscribe({
      next: (data) => { this.data = data; this.loading = false; },
      error: () => { this.errorMessage = 'Live organization metrics could not be loaded.'; this.loading = false; },
    });
  }

  get listingCount(): number {
    const data = this.data;
    return data ? data.totalHotels + data.totalRestaurants + data.totalTourPackages + data.totalTourGuides + data.totalTransportRoutes : 0;
  }
}
