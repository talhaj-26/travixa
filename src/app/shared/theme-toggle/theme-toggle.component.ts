import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-switch" role="group" aria-label="Color theme">
      <button type="button" class="theme-option" [class.active]="!theme.isDark()"
        [attr.aria-pressed]="!theme.isDark()" (click)="theme.setMode('light')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
        <span>Light</span>
      </button>
      <button type="button" class="theme-option" [class.active]="theme.isDark()"
        [attr.aria-pressed]="theme.isDark()" (click)="theme.setMode('dark')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A8.8 8.8 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg>
        <span>Dark</span>
      </button>
    </div>
  `,
  styleUrls: ['./theme-toggle.component.scss'],
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
