import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { GuideOfferingApi, TourGuideService } from '../../../core/services/tour-guide.service';

@Component({
  selector: 'app-tour-guide-details', standalone: true, imports: [CommonModule, RouterLink],
  template: `<main class="tg-page"><section class="tg-shell">
    @if (loading) { <p role="status">Loading guide service…</p> }
    @else if (error) { <section class="tg-card" role="alert"><h1>Guide service unavailable</h1><p>{{ error }}</p><button type="button" (click)="back()">Back to guides</button></section> }
    @else if (offer) { <article class="tg-card"><a routerLink="/tour-guides">← All guides</a><p>GUIDE SERVICE</p><h1>{{ offer.userName }}</h1><h2>{{ offer.name }}</h2><p>{{ offer.organizationName || 'Organization not provided' }}</p>@if (offer.description || offer.biography) { <p>{{ offer.description || offer.biography }}</p> }@if (offer.languageCodes) { <p>Languages: {{ offer.languageCodes }}</p> }<strong>{{ offer.currency }} {{ offer.pricePerHour | number:'1.2-2' }} / hour</strong><div><button type="button" (click)="hire()">Hire this guide</button></div></article> }
  </section></main>`,
  styleUrl: './tour-guide-details.component.scss'
})
export class TourGuideDetailsComponent implements OnInit {
  offer: GuideOfferingApi | null = null; loading = true; error = '';
  constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly guides: TourGuideService) {}
  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) { this.error = 'A guide service was not selected.'; this.loading = false; return; }
    this.guides.getPublicOfferings().subscribe({ next: values => { this.offer = values.find(value => value.id === id) ?? null; if (!this.offer) this.error = 'This guide service is no longer available.'; this.loading = false; }, error: e => { this.error = e?.error?.message ?? 'The guide service could not be loaded.'; this.loading = false; } });
  }
  hire(): void { if (this.offer) void this.router.navigate(['/booking'], { queryParams: { type: 'TOUR_GUIDE', itemId: this.offer.id } }); }
  back(): void { void this.router.navigateByUrl('/tour-guides'); }
}
