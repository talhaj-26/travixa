import { CanDeactivateFn } from '@angular/router';

export interface PendingChangesAware { hasPendingChanges(): boolean; }

export const pendingChangesGuard: CanDeactivateFn<PendingChangesAware> = (component) =>
  !component.hasPendingChanges() || window.confirm('You have unsaved changes. Leave this page?');
