import { Component } from '@angular/core';
import { FeatureWorkbenchComponent } from '../../../shared/components/feature-workbench/feature-workbench.component';
@Component({ selector: 'app-mobile-companion', standalone: true, imports: [FeatureWorkbenchComponent], template: '<app-feature-workbench eyebrow="MOBILE READINESS" title="Mobile companion contract" description="The Angular reference screen for the later Flutter application and its shared API contracts." [areas]="areas" />' })
export class MobileCompanionComponent { readonly areas = ['Mobile API contract', 'Offline trip wallet', 'Push notification events', 'SOS payload contract', 'Deep-link routes']; }
