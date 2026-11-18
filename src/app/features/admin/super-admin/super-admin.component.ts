import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardResponse } from '../../../core/models/dashboard.model';

import {
  PartnerApplication,
  PartnerApplicationStatus,
} from '../../../core/models/partner-application.model';
import { PartnerApplicationService } from '../../../core/services/partner-application.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

type ReviewAction = 'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION';
type ApplicationFilter = 'ALL' | PartnerApplicationStatus;

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './super-admin.component.html',
  styleUrl: './super-admin.component.scss',
})
export class SuperAdminComponent implements OnInit, OnDestroy {
  private readonly applicationsService = inject(PartnerApplicationService);
  private subscription?: Subscription;
  private readonly dashboardService = inject(DashboardService);

  dashboardData: DashboardResponse | null = null;
  dashboardLoading = true;
  dashboardError = '';

  loadPlatformMetrics(): void {
    this.dashboardLoading = true;
    this.dashboardError = '';

    this.dashboardService.getOverview().subscribe({
      next: (response) => {
        this.dashboardData = response;
        this.dashboardLoading = false;
      },
      error: () => {
        this.dashboardError = 'Platform metrics could not be loaded.';
        this.dashboardLoading = false;
      },
    });
  }

  formatPlatformCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  applications: PartnerApplication[] = [];
  filter: ApplicationFilter = 'PENDING_REVIEW';
  selected: PartnerApplication | null = null;
  reviewNotes = '';
  pendingAction: ReviewAction | null = null;
  isSaving = false;
  feedback = '';

  ngOnInit(): void {
    this.loadPlatformMetrics();
    this.applicationsService.loadAll();
    this.subscription = this.applicationsService.applications$.subscribe(
      (applications) => {
        this.applications = applications;
        if (this.selected) {
          this.selected = applications.find((item) => item.id === this.selected?.id) ?? null;
        }
      },
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get filteredApplications(): PartnerApplication[] {
    return this.filter === 'ALL'
      ? this.applications
      : this.applications.filter((application) => application.status === this.filter);
  }

  get pendingCount(): number {
    return this.applications.filter((item) => item.status === 'PENDING_REVIEW').length;
  }

  get reviewedCount(): number {
    return this.applications.filter((item) => item.status !== 'PENDING_REVIEW').length;
  }

  select(application: PartnerApplication): void {
    this.selected = application;
    this.reviewNotes = application.reviewNotes || '';
    this.feedback = '';
  }

  requestReview(action: ReviewAction): void {
    if (!this.selected || this.isSaving) return;
    this.pendingAction = action;
  }

  confirmReview(): void {
    if (!this.selected || !this.pendingAction) return;
    const selected = this.selected;
    const action = this.pendingAction;
    this.isSaving = true;
    this.applicationsService.review(selected.id, action, this.reviewNotes).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.pendingAction = null;
        this.selected = updated;
        this.reviewNotes = updated.reviewNotes || '';
        this.feedback = `${updated.legalBusinessName} is now ${this.statusLabel(updated.status).toLowerCase()}.`;
      },
      error: (error: Error) => {
        this.isSaving = false;
        this.pendingAction = null;
        this.feedback = error.message || 'The review could not be saved.';
      },
    });
  }

  closeReviewDialog(): void {
    this.pendingAction = null;
  }

  statusLabel(status: PartnerApplicationStatus): string {
    return {
      PENDING_REVIEW: 'Pending review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      NEEDS_INFORMATION: 'Needs information',
    }[status];
  }

  actionLabel(action: ReviewAction): string {
    return {
      APPROVED: 'Approve application',
      REJECTED: 'Reject application',
      NEEDS_INFORMATION: 'Request information',
    }[action];
  }
}
