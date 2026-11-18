import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { PartnerOrganizationApiResponse, PartnerOrganizationService } from '../../../core/services/partner-organization.service';
import { PartnerMembershipService } from '../../../core/services/partner-membership.service';

@Component({
  selector: 'app-partner-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partner-profile.component.html',
  styleUrl: './partner-profile.component.scss',
})
export class PartnerProfileComponent implements OnInit {
  private readonly membershipsApi = inject(PartnerMembershipService);
  private readonly organizationsApi = inject(PartnerOrganizationService);
  organizations: PartnerOrganizationApiResponse[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.membershipsApi.getMine().subscribe({
      next: (memberships) => {
        if (!memberships.length) { this.organizations = []; this.loading = false; return; }
        forkJoin(memberships.map((membership) => this.organizationsApi.getById(membership.organizationId))).subscribe({
          next: (organizations) => { this.organizations = organizations; this.loading = false; },
          error: () => { this.errorMessage = 'Linked organization details could not be loaded.'; this.loading = false; },
        });
      },
      error: () => { this.errorMessage = 'Your linked organizations could not be loaded. Check your access and API connection.'; this.loading = false; },
    });
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
  }

  businessTypeLabel(type: string): string { return type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  trackById(_: number, organization: PartnerOrganizationApiResponse): number { return organization.id; }
}
