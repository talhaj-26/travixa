import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GuideOfferingApi, TourGuideService } from '../../../core/services/tour-guide.service';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface TourGuide {
  id: number;
  profileId: number;
  offeringId: number;
  name: string;
  location: string;
  bio: string;
  image: string;
  languages: string[];
  specialties: string[];
  pricePerHour: number;
  currency: string;
  verified: boolean;
}

interface HeroSlide {
  image: string;
  kicker: string;
  title: string;
  highlight: string;
  text: string;
}

interface GuideStory {
  guideName: string;
  guideId: number;
  location: string;
  image: string;
  quote: string;
  tour: string;
}

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-tour-guides',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-guides.component.html',
  styleUrl: './tour-guides.component.scss',
})
export class TourGuidesComponent implements OnInit, OnDestroy {
  /* ═══════════════════════════════════════════════════════════
     FILTER STATE
     ═══════════════════════════════════════════════════════════ */
  searchTerm = '';
  selectedLocation = 'ALL';
  selectedLanguage = 'ALL';
  selectedSpecialty = 'ALL';
  sortBy: 'name' | 'price-low' | 'price-high' = 'name';

  /* ═══════════════════════════════════════════════════════════
     UI STATE
     ═══════════════════════════════════════════════════════════ */
  viewMode: ViewMode = 'grid';
  loading = true;
  quickView: TourGuide | null = null;

  /* ═══════════════════════════════════════════════════════════
     HERO SLIDESHOW
     ═══════════════════════════════════════════════════════════ */
  currentSlide = 0;
  private slideInterval: ReturnType<typeof setInterval> | null = null;

  heroSlides: HeroSlide[] = [{ image: '', kicker: 'Local guide services', title: 'Travel with a', highlight: 'local expert.', text: 'Browse guide services published by verified travel providers.' }];

  /* ═══════════════════════════════════════════════════════════
     FILTER OPTIONS
     ═══════════════════════════════════════════════════════════ */
  locations = ['ALL'];

  languages = ['ALL'];

  specialties = ['ALL'];

  specialtyIcons: Record<string, string> = {
    ALL: '✦',
    Adventure: '⛰',
    Cultural: '🎭',
    Nature: '🌿',
    Beach: '🏖',
    Photography: '📷',
    History: '🏛',
  };

  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price-low', label: 'Price: Low → High' },
    { value: 'price-high', label: 'Price: High → Low' },
  ];

  /* ═══════════════════════════════════════════════════════════
     GUIDE STORIES CAROUSEL
     ═══════════════════════════════════════════════════════════ */
  guideStories: GuideStory[] = [];

  /* ═══════════════════════════════════════════════════════════
     GUIDES DATA (8)
     ═══════════════════════════════════════════════════════════ */
  guides: TourGuide[] = [];

  catalogError = '';
  constructor(private router: Router, private guideService: TourGuideService) {}

  /* ═══════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
  ngOnInit(): void {
    this.startSlideshow();
    this.guideService.getPublicOfferings().subscribe({
      next: offerings => {
        this.guides = offerings.map(offer => this.mapOffering(offer));
        this.locations = ['ALL', ...new Set(this.guides.map(guide => guide.location).filter(Boolean))];
        this.languages = ['ALL', ...new Set(this.guides.flatMap(guide => guide.languages))];
        this.specialties = ['ALL', ...new Set(this.guides.flatMap(guide => guide.specialties))];
        this.loading = false;
      },
      error: error => { this.catalogError = error?.error?.message ?? 'Guide services could not be loaded.'; this.loading = false; }
    });
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
    document.body.style.overflow = '';
  }

  /* ═══════════════════════════════════════════════════════════
     SLIDESHOW
     ═══════════════════════════════════════════════════════════ */
  private startSlideshow(): void {
    this.stopSlideshow();
    this.slideInterval = setInterval(() => {
      if (this.heroSlides.length > 1) this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
    }, 6000);
  }

  private stopSlideshow(): void {
    if (this.slideInterval !== null) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  goToSlide(i: number): void {
    this.currentSlide = i;
    this.startSlideshow();
  }

  nextSlide(): void {
    this.goToSlide((this.currentSlide + 1) % this.heroSlides.length);
  }

  prevSlide(): void {
    this.goToSlide(
      (this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length
    );
  }

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentSlide];
  }

  private mapOffering(offer: GuideOfferingApi): TourGuide {
    return {
      id: offer.id,
      profileId: offer.guideProfileId,
      offeringId: offer.id,
      name: offer.userName,
      location: offer.organizationName ?? '',
      bio: offer.description ?? offer.biography ?? '',
      image: '',
      languages: (offer.languageCodes ?? '').split(',').map(value => value.trim()).filter(Boolean),
      specialties: [offer.name],
      pricePerHour: Number(offer.pricePerHour) || 0,
      currency: offer.currency,
      verified: true,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     FILTERING + SORT
     ═══════════════════════════════════════════════════════════ */
  get filteredGuides(): TourGuide[] {
    const term = this.searchTerm.trim().toLowerCase();

    const result = this.guides.filter((guide) => {
      const matchesSearch =
        !term ||
        guide.name.toLowerCase().includes(term) ||
        guide.location.toLowerCase().includes(term) ||
        guide.bio.toLowerCase().includes(term) ||
        guide.languages.some((l) => l.toLowerCase().includes(term)) ||
        guide.specialties.some((s) => s.toLowerCase().includes(term));

      const matchesLocation =
        this.selectedLocation === 'ALL' ||
        guide.location === this.selectedLocation;

      const matchesLanguage =
        this.selectedLanguage === 'ALL' ||
        guide.languages.includes(this.selectedLanguage);

      const matchesSpecialty =
        this.selectedSpecialty === 'ALL' ||
        guide.specialties.includes(this.selectedSpecialty);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesLanguage &&
        matchesSpecialty
      );
    });

    switch (this.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.pricePerHour - b.pricePerHour);
        break;
      case 'price-high':
        result.sort((a, b) => b.pricePerHour - a.pricePerHour);
        break;
      default: result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedLocation !== 'ALL') count++;
    if (this.selectedLanguage !== 'ALL') count++;
    if (this.selectedSpecialty !== 'ALL') count++;
    return count;
  }

  /* ═══════════════════════════════════════════════════════════
     UI ACTIONS
     ═══════════════════════════════════════════════════════════ */
  setView(mode: ViewMode): void {
    this.viewMode = mode;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLocation = 'ALL';
    this.selectedLanguage = 'ALL';
    this.selectedSpecialty = 'ALL';
    this.sortBy = 'name';
  }

  selectLocation(loc: string): void {
    this.selectedLocation = loc;
  }

  selectSpecialty(sp: string): void {
    this.selectedSpecialty = sp;
  }

  /* ─── Quick view ─── */
  openQuickView(g: TourGuide, event?: Event): void {
    event?.stopPropagation();
    this.quickView = g;
    document.body.style.overflow = 'hidden';
  }

  closeQuickView(): void {
    this.quickView = null;
    document.body.style.overflow = '';
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION — every button works
     ═══════════════════════════════════════════════════════════ */
  hireGuide(g: TourGuide, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/booking'], {
      queryParams: { type: 'TOUR_GUIDE', itemId: g.offeringId },
    });
  }

  viewGuide(g: TourGuide, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/tour-guide-details'], {
      queryParams: { id: g.offeringId },
    });
  }

  viewStory(story: GuideStory): void {
    this.router.navigate(['/tour-guide-details'], {
      queryParams: { id: story.guideId },
    });
  }

  openPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
}
