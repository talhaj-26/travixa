import { Component } from '@angular/core';
import { FeatureWorkbenchComponent } from '../../../shared/components/feature-workbench/feature-workbench.component';
@Component({ selector: 'app-guide-availability', standalone: true, imports: [FeatureWorkbenchComponent], template: '<app-feature-workbench eyebrow="GUIDE OPERATIONS" title="Availability calendar" description="A visual calendar boundary for tour-guide hours, blocked dates and confirmed assignments." [areas]="areas" />' })
export class GuideAvailabilityComponent { readonly areas = ['Weekly availability', 'Blocked dates', 'Confirmed assignments', 'Service areas', 'Guide booking requests']; }
