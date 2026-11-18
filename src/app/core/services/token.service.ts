import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly accessKey = 'travixa-access-token';
  private readonly refreshKey = 'travixa-refresh-token';
  private readonly rememberKey = 'travixa-remember-session';
  getAccessToken(): string | null { return this.storage().getItem(this.accessKey); }
  getRefreshToken(): string | null { return this.storage().getItem(this.refreshKey); }
  save(accessToken: string, refreshToken: string, remember = this.isRemembered()): void {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(this.accessKey);
    other.removeItem(this.refreshKey);
    if (remember) localStorage.setItem(this.rememberKey, 'true');
    else localStorage.removeItem(this.rememberKey);
    target.setItem(this.accessKey, accessToken);
    target.setItem(this.refreshKey, refreshToken);
  }
  clear(): void {
    for (const store of [sessionStorage, localStorage]) {
      store.removeItem(this.accessKey);
      store.removeItem(this.refreshKey);
    }
    localStorage.removeItem(this.rememberKey);
  }
  isRemembered(): boolean { return localStorage.getItem(this.rememberKey) === 'true'; }
  private storage(): Storage { return this.isRemembered() ? localStorage : sessionStorage; }
}
