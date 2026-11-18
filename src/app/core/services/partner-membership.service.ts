import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';

export interface PartnerMembershipApi {
  id: number;
  userId: string;
  organizationId: number;
  membershipRole: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class PartnerMembershipService {
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) private readonly config: ApiConfig) {}
  getMine(): Observable<PartnerMembershipApi[]> {
    return this.http.get<PartnerMembershipApi[]>(`${this.config.baseUrl}${this.config.apiPrefix}/partners-memberships/me`);
  }
}
