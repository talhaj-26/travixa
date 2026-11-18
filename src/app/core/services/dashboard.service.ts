import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

import { DashboardResponse } from '../models/dashboard.model';
import { API_CONFIG, ApiConfig } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private get apiUrl(): string { return `${this.apiConfig.baseUrl.replace(/\/+$/, '')}${this.apiConfig.apiPrefix}/dashboard`; }

  getOverview(): Observable<DashboardResponse> {
    return this.http
      .get<DashboardResponse>(`${this.apiUrl}/overview`)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }
}
