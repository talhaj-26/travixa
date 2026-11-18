import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { DestinationApiResponse, DestinationService } from '../../../core/services/destination.service';
import { CustomTripResponse, CustomTripService } from '../../../core/services/custom-trip.service';

@Component({
  selector: 'app-custom-trip-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-trip-request.component.html',
  styleUrl: './custom-trip-request.component.scss',
})
export class CustomTripRequestComponent implements OnInit {
  private readonly destinationsApi = inject(DestinationService);
  private readonly tripsApi = inject(CustomTripService);
  destinations: DestinationApiResponse[] = [];
  requests: CustomTripResponse[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  draft = { destinationId: 0, startDate: '', endDate: '', travelers: 2, budget: null as number | null, interests: '', notes: '' };

  ngOnInit(): void { this.load(); }

  get minDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({ destinations: this.destinationsApi.getPublishedFromApi(), requests: this.tripsApi.getMine() }).subscribe({
      next: ({ destinations, requests }) => { this.destinations = destinations; this.requests = requests; this.loading = false; },
      error: () => { this.errorMessage = 'Your trip requests could not be loaded. Sign in and check the API connection.'; this.loading = false; },
    });
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.draft.destinationId || !this.draft.startDate || !this.draft.endDate || this.draft.endDate <= this.draft.startDate || this.draft.travelers < 1) {
      this.errorMessage = 'Choose a destination, valid travel dates and at least one traveler.';
      return;
    }
    const requirements = [this.draft.interests.trim() ? `Interests: ${this.draft.interests.trim()}` : '', this.draft.notes.trim() ? `Notes: ${this.draft.notes.trim()}` : ''].filter(Boolean).join('\n');
    this.saving = true;
    this.tripsApi.create({
      destinationId: this.draft.destinationId,
      travelerCount: this.draft.travelers,
      startDate: this.draft.startDate,
      endDate: this.draft.endDate,
      targetBudget: this.draft.budget,
      currency: 'BDT',
      requirements: requirements || null,
    }).subscribe({
      next: (created) => {
        this.requests = [created, ...this.requests];
        this.saving = false;
        this.successMessage = 'Your trip request was saved to your account.';
        this.draft = { destinationId: 0, startDate: '', endDate: '', travelers: 2, budget: null, interests: '', notes: '' };
      },
      error: (error: { error?: { detail?: string; message?: string } }) => {
        this.saving = false;
        this.errorMessage = error.error?.detail ?? error.error?.message ?? 'Trip request could not be submitted.';
      },
    });
  }

  destinationName(id: number | null): string { return this.destinations.find((destination) => destination.id === id)?.name ?? 'Destination'; }
  statusLabel(status: string): string { return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  trackById(_: number, request: CustomTripResponse): number { return request.id; }
}
