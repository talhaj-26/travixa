import { Component } from '@angular/core';
import { FeatureWorkbenchComponent } from '../../../shared/components/feature-workbench/feature-workbench.component';
@Component({ selector: 'app-traveler-safety', standalone: true, imports: [FeatureWorkbenchComponent], template: '<app-feature-workbench eyebrow="TRAVELER SAFETY" title="SOS & safety center" description="A dedicated future flow for emergency requests, trusted contacts and incident escalation." [areas]="areas" />' })
export class TravelerSafetyComponent { readonly areas = ['SOS trigger', 'Emergency contacts', 'Active trip location', 'Safety incident report', 'Support escalation']; }
