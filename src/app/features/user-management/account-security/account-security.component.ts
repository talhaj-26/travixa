import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-account-security', standalone: true, imports: [FormsModule],
  template: `<section class="security-page"><span>ACCOUNT & PRIVACY</span><h1>You control your Travixa account.</h1><p>Manage the local demo account on this device. A production account action will require a verified backend request.</p><div class="security-grid"><article><h2>Deactivate account</h2><p>Temporarily sign out and mark this account inactive. You can restore it later through support.</p><button (click)="deactivate()">Deactivate demo account</button></article><article class="danger-card"><h2>Delete account data</h2><p>Enter <strong>DELETE</strong> to remove local Travixa demo data from this browser. This cannot be reversed.</p><input [(ngModel)]="confirmation" placeholder="Type DELETE" aria-label="Confirm local data deletion" /><button [disabled]="confirmation !== 'DELETE'" (click)="deleteLocalData()">Delete local demo data</button></article></div></section>`,
  styles: [`
    .security-page{max-width:980px;margin:0 auto;padding:8rem 1.5rem 5rem;color:var(--color-text,#334155)}.security-page>span{color:var(--color-primary-700,#0f766e);font:800 .7rem var(--font-mono,monospace);letter-spacing:.15em}.security-page>h1{font:800 clamp(2rem,5vw,3.4rem) var(--font-display,serif);color:var(--color-heading,#0f172a);margin:.6rem 0}.security-page>p{max-width:46rem;color:var(--color-muted,#64748b);line-height:1.6}.security-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-top:2.2rem}article{padding:1.4rem;border:1px solid var(--color-border,#e2e8f0);border-radius:1.2rem;background:var(--color-surface,#fff)}h2{margin:0;color:var(--color-heading,#0f172a);font:750 1.3rem var(--font-display,serif)}article p{line-height:1.6;color:var(--color-muted,#64748b)}button{border:0;border-radius:.7rem;padding:.68rem .95rem;background:var(--color-primary-700,#0f766e);color:#fff;font-weight:800;cursor:pointer}input{display:block;width:100%;box-sizing:border-box;margin:.8rem 0;padding:.7rem;border:1px solid #fca5a5;border-radius:.65rem}.danger-card{border-color:#fecaca}.danger-card button{background:#dc2626}.danger-card button:disabled{opacity:.45;cursor:not-allowed}:host-context([data-theme='dark']) article{background:#172033;border-color:rgba(148,163,184,.2)}:host-context([data-theme='dark']) h2,:host-context([data-theme='dark']) .security-page>h1{color:#f8fafc}@media(max-width:700px){.security-page{padding-top:6.5rem}.security-grid{grid-template-columns:1fr}}
  `],
})
export class AccountSecurityComponent {
  confirmation = ''; private readonly auth = inject(AuthService); private readonly toast = inject(ToastService); private readonly router = inject(Router);
  deactivate(): void { this.auth.logout(); this.toast.info('Account deactivated', 'You have been signed out from this demo device.'); void this.router.navigateByUrl('/login'); }
  deleteLocalData(): void { const keys = ['travixa-demo-users', 'travixa-demo-password-overrides', 'travixa-travel-journal', 'travixa-notifications', 'travixa-home-wishlist']; keys.forEach((key) => localStorage.removeItem(key)); this.auth.logout(); this.toast.success('Local demo data deleted', 'Your browser-only Travixa data has been removed.'); void this.router.navigateByUrl('/'); }
}
