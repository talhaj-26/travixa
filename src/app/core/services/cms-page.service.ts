import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../config/api.config';
import { CmsLanguage, CmsPage, CmsPageRequest } from '../models/cms-page.model';

@Injectable({ providedIn: 'root' })
export class CmsPageService {
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) private readonly config: ApiConfig) {}
  private get baseUrl(): string { return `${this.config.baseUrl}${this.config.apiPrefix}/cms-pages`; }
  getAll(): Observable<CmsPage[]> { return this.http.get<CmsPage[]>(this.baseUrl); }
  getEnabledLanguages(): Observable<CmsLanguage[]> { return this.http.get<CmsLanguage[]>(`${this.baseUrl}/languages`); }
  create(request: CmsPageRequest): Observable<CmsPage> { return this.http.post<CmsPage>(this.baseUrl, request); }
  update(id: number, request: CmsPageRequest): Observable<CmsPage> { return this.http.put<CmsPage>(`${this.baseUrl}/${id}`, request); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
