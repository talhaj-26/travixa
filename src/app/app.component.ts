import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { ToastComponent } from './shared/toast/toast.component';
import { RoleWorkspaceNavComponent } from './shared/components/role-workspace-nav/role-workspace-nav.component';
import { LoadingService } from './core/services/loading.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { ToastService } from './shared/toast/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    LoadingComponent,
    ToastComponent,
    RoleWorkspaceNavComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'TRAVIXA';
  isLoading = true;
  isAuthPage = false;
  isWorkspacePage = false;
  isWorkspaceExpanded = false;

  private routerSub?: Subscription;

  private readonly AUTH_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  private readonly WORKSPACE_ROUTE_PREFIXES = [
    '/dashboard', '/user-profile', '/my-bookings', '/wishlist', '/travel-journal',
    '/account-security', '/booking-history', '/booking', '/booking-details',
    '/checkout', '/payment', '/payment-result', '/notifications', '/notification-center',
    '/review-rating',
    '/payment-history', '/loyalty-points', '/expense-tracker', '/emergency-contacts',
    '/travel-checklist', '/currency-converter',
    '/hotel-management', '/restaurant-management', '/tour-package-management', '/partner-dashboard',
    '/tour-guide-management', '/transport-management', '/partner-',
    '/hotel-inventory', '/restaurant-operations', '/agency-operations', '/guide-availability',
    '/transport-dispatch', '/localization', '/traveler-safety', '/traveler-chat', '/mobile-companion',
    '/customer-reviews-management', '/support', '/faq', '/reports-analytics',
    '/content-management', '/settings', '/user-directory', '/user-management',
    '/admin-', '/listing-approvals', '/super-admin', '/refund-request',
  ];

  constructor(
    private router: Router,
    readonly loadingService: LoadingService,
    private readonly toast: ToastService,
    private readonly theme: ThemeService,
    private readonly auth: AuthService,
  ) {
    setTimeout(() => {
      this.isLoading = false;
    }, 1200);
  }

  ngOnInit(): void {
    this.installLegacyDemoActions();
    this.updateAuthState(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateAuthState(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.removeLegacyDemoActions();
  }

  private updateAuthState(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.isAuthPage = this.AUTH_ROUTES.some((route) => path.startsWith(route));
    this.isWorkspacePage = this.auth.isLoggedIn()
      && this.WORKSPACE_ROUTE_PREFIXES.some((route) => path.startsWith(route));
    if (!this.isWorkspacePage) this.isWorkspaceExpanded = false;
  }

  setWorkspaceExpanded(expanded: boolean): void {
    this.isWorkspaceExpanded = expanded;
  }

  /** Compatibility shim for legacy static templates. Unimplemented controls
   * report that they are unavailable and never display a false success. */
  private readonly legacyActionNames = [
    'changeDestination', 'clearDirectoryFilters', 'copyCode', 'createContent',
    'duplicateContent', 'editContent', 'exportDirectory', 'filterCategory',
    'filterContent', 'filterDirectory', 'filterEvents', 'filterPartners',
    'filterReviews', 'markAllRead', 'markHandled', 'previewContent',
    'publishContent', 'readNotification', 'removeNotification', 'resetDemo',
    'reviewContent', 'saveSettings', 'searchFaqs', 'sendReply', 'setTheme',
    'showDemo', 'showPartnerToast', 'showToast', 'togglePerson', 'toggleReply',
    'toggleSwitch',
  ] as const;

  private installLegacyDemoActions(): void {
    const target = window as typeof window & Record<string, (...args: unknown[]) => void>;
    const unavailable = (): void => this.toast.warning(
      'Action unavailable',
      'This action is not connected to a server workflow yet.',
    );

    target['showToast'] = (message = 'Action completed') => this.toast.info('TRAVIXA', String(message));
    target['showDemo'] = unavailable;
    target['showPartnerToast'] = unavailable;
    target['copyCode'] = (code = '') => {
      void navigator.clipboard?.writeText(String(code)).catch(() => undefined);
      this.toast.success('Coupon copied', `${String(code)} is ready for checkout.`);
    };
    target['setTheme'] = (mode = 'light') => this.theme.setTheme(mode === 'dark' ? 'dark' : mode === 'system' ? 'system' : 'light');
    target['markAllRead'] = unavailable;
    target['removeNotification'] = unavailable;
    target['readNotification'] = unavailable;
    target['sendReply'] = unavailable;
    target['exportDirectory'] = unavailable;
    target['resetDemo'] = unavailable;

    this.legacyActionNames.forEach((name) => {
      if (!target[name]) target[name] = unavailable;
    });
  }

  private removeLegacyDemoActions(): void {
    const target = window as typeof window & Record<string, unknown>;
    this.legacyActionNames.forEach((name) => delete target[name]);
  }
}
