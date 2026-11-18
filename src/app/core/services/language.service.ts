import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'en' | 'bn';

/** Stores the UI language preference. Translation catalogues can be attached
 * later without changing navigation or persisted user preference contracts. */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly key = 'travixa-language';
  private readonly languageSubject = new BehaviorSubject<AppLanguage>(this.read());
  readonly language$ = this.languageSubject.asObservable();

  get current(): AppLanguage { return this.languageSubject.value; }

  set(language: AppLanguage): void {
    localStorage.setItem(this.key, language);
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    this.languageSubject.next(language);
  }

  private read(): AppLanguage {
    const saved = localStorage.getItem(this.key);
    return saved === 'bn' ? 'bn' : 'en';
  }
}
