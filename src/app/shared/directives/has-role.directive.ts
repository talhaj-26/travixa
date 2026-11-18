import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  private hasView = false;

  @Input() set appHasRole(roles: UserRole | readonly UserRole[]) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    const shouldShow = this.auth.hasRole(allowed);
    if (shouldShow && !this.hasView) { this.viewContainer.createEmbeddedView(this.template); this.hasView = true; }
    if (!shouldShow && this.hasView) { this.viewContainer.clear(); this.hasView = false; }
  }
}
