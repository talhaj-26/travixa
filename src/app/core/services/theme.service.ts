import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'travixa_theme';
  private readonly modeSignal = signal<ThemeMode>(this.readStoredTheme());
  private readonly mediaQuery =
    typeof window === 'undefined'
      ? null
      : window.matchMedia('(prefers-color-scheme: dark)');

  readonly mode = this.modeSignal.asReadonly();

  constructor() {
    effect(() => this.applyTheme(this.modeSignal()));
    this.mediaQuery?.addEventListener('change', () => {
      if (this.modeSignal() === 'system') this.applyTheme('system');
    });
  }

  getCurrentTheme(): ThemeMode {
    return this.modeSignal();
  }

  isDark(): boolean {
    return this.resolveTheme(this.modeSignal()) === 'dark';
  }

  setTheme(mode: ThemeMode): void {
    this.setMode(mode);
  }

  setMode(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    if (mode === 'system') {
      localStorage.removeItem(this.storageKey);
    } else {
      localStorage.setItem(this.storageKey, mode);
    }
  }

  /** Light/dark shortcut for navbars. */
  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  toggleTheme(): void {
    this.toggle();
  }

  /** Used by settings-style controls that expose all three user preferences. */
  cycleMode(): void {
    const next: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    this.setMode(next[this.modeSignal()]);
  }

  private readStoredTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(this.storageKey);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  }

  private resolveTheme(mode: ThemeMode): 'light' | 'dark' {
    return mode === 'system'
      ? this.mediaQuery?.matches
        ? 'dark'
        : 'light'
      : mode;
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const resolved = this.resolveTheme(mode);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  }
}
