import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig } from '../config/api.config';

export type MediaListingType = 'HOTEL' | 'ROOM_TYPE' | 'ROOM' | 'RESTAURANT' | 'MENU_ITEM' | 'TOUR_PACKAGE';

export interface UploadedMedia {
  id: number;
  listingType: MediaListingType;
  listingId: number;
  storageKey: string;
  publicUrl: string;
  altText: string | null;
  displayOrder: number;
  coverImage: boolean;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly base: string;
  constructor(private readonly http: HttpClient, @Inject(API_CONFIG) config: ApiConfig) {
    this.base = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}/media`;
  }

  upload(type: MediaListingType, listingId: number, files: File[], altTexts: string[] = [], coverIndex = 0): Observable<UploadedMedia[]> {
    const form = new FormData();
    files.forEach((file) => form.append('files', file, file.name));
    altTexts.forEach((text) => form.append('altTexts', text));
    form.append('coverIndex', String(coverIndex));
    return this.http.post<UploadedMedia[]>(`${this.base}/${type}/${listingId}`, form);
  }

  resolveMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    const origin = this.base.replace(/\/api\/media\/?$/, '');
    return new URL(url.replace(/^\/+/, ''), `${origin}/`).toString();
  }

  previewUrl(url: string | null | undefined): Observable<string> {
    return this.http.get(this.resolveMediaUrl(url), { responseType: 'blob' }).pipe(
      map((blob) => URL.createObjectURL(blob)),
    );
  }

  delete(type: MediaListingType, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${type}/images/${imageId}`);
  }
}
