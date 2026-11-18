import { Component } from '@angular/core';
import { FeatureWorkbenchComponent } from '../../../shared/components/feature-workbench/feature-workbench.component';
@Component({ selector: 'app-traveler-chat', standalone: true, imports: [FeatureWorkbenchComponent], template: '<app-feature-workbench eyebrow="TRAVIXA SUPPORT" title="Secure travel chat" description="A real-time conversation space for travelers, partners and support teams." [areas]="areas" />' })
export class TravelerChatComponent { readonly areas = ['Conversation inbox', 'Booking context', 'Partner response', 'Support escalation', 'Attachment policy']; }
