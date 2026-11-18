import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, throwError } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config/api.config';
import { CreatePartnerApplication, PartnerApplication, PartnerApplicationStatus } from '../models/partner-application.model';

interface PartnerApplicationApi {
  id: number;
  applicantId: string;
  organizationId: number | null;
  businessType: PartnerApplication['businessType'];
  businessName: string;
  legalName: string | null;
  registrationNumber: string | null;
  contactEmail: string;
  contactPhone: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  submittedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class PartnerApplicationService {
  private readonly subject = new BehaviorSubject<PartnerApplication[]>([]);
  readonly applications$ = this.subject.asObservable();

  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) private readonly config: ApiConfig) {}

  private get url(): string { return `${this.config.baseUrl}${this.config.apiPrefix}/partners-applications`; }

  loadAll(): void {
    this.http.get<PartnerApplicationApi[]>(this.url).pipe(map(items => items.map(item => this.toModel(item))))
      .subscribe({ next: items => this.subject.next(items), error: () => this.subject.next([]) });
  }

  getAll(): PartnerApplication[] { return this.subject.value; }

  submit(request: CreatePartnerApplication): Observable<PartnerApplication> {
    if (!request.legalBusinessName.trim() || !request.tradeLicenseNumber.trim()) {
      return throwError(() => new Error('Business and trade-license details are required.'));
    }
    return this.http.post<PartnerApplicationApi>(this.url, {
      businessType: request.businessType,
      businessName: request.tradingName?.trim() || request.legalBusinessName.trim(),
      legalName: request.legalBusinessName.trim(),
      registrationNumber: request.tradeLicenseNumber.trim(),
      contactEmail: request.contactEmail.trim().toLowerCase(),
      contactPhone: request.contactPhone.replace(/\s/g, ''),
    }).pipe(map(item => this.toModel(item)));
  }

  review(id: string, status: Exclude<PartnerApplicationStatus, 'PENDING_REVIEW'>, reviewNotes?: string): Observable<PartnerApplication> {
    const decision = status === 'NEEDS_INFORMATION' ? 'UNDER_REVIEW' : status;
    return this.http.post<PartnerApplicationApi>(`${this.url}/${encodeURIComponent(id)}/review`, {
      decision,
      notes: reviewNotes?.trim() || null,
    }).pipe(map(item => this.toModel(item)), tap(updated => {
      this.subject.next(this.subject.value.map(item => item.id === updated.id ? updated : item));
    }));
  }

  private toModel(item: PartnerApplicationApi): PartnerApplication {
    const status: PartnerApplicationStatus = item.status === 'APPROVED' || item.status === 'REJECTED'
      ? item.status
      : 'PENDING_REVIEW';
    return {
      id: String(item.id), businessType: item.businessType,
      legalBusinessName: item.legalName || item.businessName, tradingName: item.businessName,
      contactName: item.applicantId, contactEmail: item.contactEmail, contactPhone: item.contactPhone || '',
      address: '', district: '', division: '', tradeLicenseNumber: item.registrationNumber || '',
      yearsOperating: 0, businessDescription: '', services: [], submittedAt: item.submittedAt || '', status,
    };
  }
}
