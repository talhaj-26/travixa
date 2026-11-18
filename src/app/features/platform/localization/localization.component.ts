import { Component } from '@angular/core';
import { FeatureWorkbenchComponent } from '../../../shared/components/feature-workbench/feature-workbench.component';
@Component({ selector: 'app-localization', standalone: true, imports: [FeatureWorkbenchComponent], template: '<app-feature-workbench eyebrow="PLATFORM SETTINGS" title="Translation catalogue" description="A controlled catalogue for English and Bangla labels, messages and content keys." [areas]="areas" />' })
export class LocalizationComponent { readonly areas = ['Language registry', 'Translation keys', 'English catalogue', 'Bangla catalogue', 'Publishing status']; }
