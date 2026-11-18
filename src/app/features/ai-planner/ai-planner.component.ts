import { Component, inject, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';

interface DailyPlan {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  image: string;
  activities: string[];
}

interface TripPlan {
  destination: string;
  duration: number;
  travelers: number;
  budget: string;
  travelStyle: string;
  summary: string;
  estimatedCost: number;
  dailyPlans: DailyPlan[];
  tips: { icon: string; text: string }[];
}

interface InterestChip {
  value: string;
  icon: string;
}

@Component({
  selector: 'app-ai-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-planner.component.html',
  styleUrl: './ai-planner.component.scss',
})
export class AiPlannerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly toast: ToastService = inject(ToastService);

  destination = '';
  startDate = '';
  duration = 3;
  travelers = 2;

  selectedBudget = 'MID_RANGE';
  selectedStyle = 'ADVENTURE';
  selectedInterests: string[] = ['Nature'];

  isGenerating = false;
  generated = false;

  /* ─── AI thinking steps ─── */
  aiThinkingSteps = [
    { icon: '🧠', text: 'Analyzing your preferences...' },
    { icon: '🌍', text: 'Exploring destinations...' },
    { icon: '✨', text: 'Designing your itinerary...' },
    { icon: '🎯', text: 'Optimizing for your budget...' },
    { icon: '📝', text: 'Finalizing your plan...' },
  ];
  currentThinkingStep = 0;
  private thinkingInterval: any;

  /* ─── Hero typing animation ─── */
  heroDisplayText = '';
  private heroWords = [
    'Personalized',
    'AI-Powered',
    'Smart',
    'Unique',
    'Yours',
  ];
  private heroWordIndex = 0;
  private heroCharIndex = 0;
  private heroTypingInterval: any;
  private heroDeleting = false;

  /* ─── Animated stats ─── */
  animatedStat1 = 0;
  animatedStat2 = 0;
  animatedStat3 = 0;

  /* ─── Background particles ─── */
  particles: { size: number; left: number; top: number; delay: number; duration: number }[] = [];

  tripPlan?: TripPlan;

  destinations = [
    'Cox’s Bazar',
    'Sajal Valley',
    'Bandarban',
    'Sylhet',
    'Rangamati',
    'Dhaka',
    'Sundarbans',
    'Saint Martin',
  ];

  budgets = [
    {
      value: 'BUDGET',
      label: 'Budget',
      icon: '💰',
      description: 'Smart & affordable',
      range: '৳1,500/day',
    },
    {
      value: 'MID_RANGE',
      label: 'Mid Range',
      icon: '✨',
      description: 'Comfort & value',
      range: '৳2,500/day',
    },
    {
      value: 'PREMIUM',
      label: 'Premium',
      icon: '👑',
      description: 'Luxury experience',
      range: '৳5,000/day',
    },
  ];

  travelStyles = [
    { value: 'RELAXING', label: 'Relaxing', icon: '🌴' },
    { value: 'ADVENTURE', label: 'Adventure', icon: '🏔️' },
    { value: 'NATURE', label: 'Nature', icon: '🌿' },
    { value: 'CULTURAL', label: 'Cultural', icon: '🏛️' },
    { value: 'LUXURY', label: 'Luxury', icon: '💎' },
  ];

  interests: InterestChip[] = [
    { value: 'Beach', icon: '🏖' },
    { value: 'Nature', icon: '🌿' },
    { value: 'Food', icon: '🍲' },
    { value: 'Culture', icon: '🏛' },
    { value: 'Photography', icon: '📷' },
    { value: 'Shopping', icon: '🛍' },
    { value: 'Adventure', icon: '⛰' },
    { value: 'History', icon: '📜' },
  ];

  constructor() {}

  ngOnInit(): void {
    this.buildParticles();
    this.startHeroTyping();
    setTimeout(() => this.animateStats(), 600);
  }

  ngOnDestroy(): void {
    if (this.thinkingInterval) clearInterval(this.thinkingInterval);
    if (this.heroTypingInterval) clearInterval(this.heroTypingInterval);
    document.body.style.overflow = '';
  }

  /* ═══════════════════════════════════════════════
     HERO TYPING ANIMATION
     ═══════════════════════════════════════════════ */
  private startHeroTyping(): void {
    const currentWord = this.heroWords[this.heroWordIndex];

    if (this.heroDeleting) {
      this.heroCharIndex--;
    } else {
      this.heroCharIndex++;
    }

    this.heroDisplayText = currentWord.substring(0, this.heroCharIndex);

    let delay = this.heroDeleting ? 60 : 130;

    if (!this.heroDeleting && this.heroCharIndex === currentWord.length) {
      delay = 1800;
      this.heroDeleting = true;
    } else if (this.heroDeleting && this.heroCharIndex === 0) {
      this.heroDeleting = false;
      this.heroWordIndex = (this.heroWordIndex + 1) % this.heroWords.length;
      delay = 400;
    }

    this.heroTypingInterval = setTimeout(() => this.startHeroTyping(), delay);
  }

  /* ═══════════════════════════════════════════════
     ANIMATED STATS
     ═══════════════════════════════════════════════ */
  private animateStats(): void {
    this.animateNumber(50000, 1500, (v) => (this.animatedStat1 = Math.round(v)));
    this.animateNumber(640, 1200, (v) => (this.animatedStat2 = Math.round(v)));
    this.animateNumber(98, 1000, (v) => (this.animatedStat3 = Math.round(v)));
  }

  private animateNumber(
    target: number,
    duration: number,
    setter: (v: number) => void,
  ): void {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setter(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else setter(target);
    };
    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════
     BACKGROUND PARTICLES
     ═══════════════════════════════════════════════ */
  private buildParticles(): void {
    this.particles = Array.from({ length: 30 }, () => ({
      size: 2 + Math.random() * 4,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 6,
    }));
  }

  /* ═══════════════════════════════════════════════
     INTERESTS
     ═══════════════════════════════════════════════ */
  toggleInterest(interest: string): void {
    if (this.selectedInterests.includes(interest)) {
      this.selectedInterests = this.selectedInterests.filter(
        (item) => item !== interest,
      );
    } else {
      this.selectedInterests = [...this.selectedInterests, interest];
    }
  }

  isInterestSelected(interest: string): boolean {
    return this.selectedInterests.includes(interest);
  }

  /* ═══════════════════════════════════════════════
     SELECTIONS
     ═══════════════════════════════════════════════ */
  selectBudget(budget: string): void {
    this.selectedBudget = budget;
  }

  selectStyle(style: string): void {
    this.selectedStyle = style;
  }

  incrementTravelers(): void {
    this.travelers = Math.min(12, this.travelers + 1);
  }

  decrementTravelers(): void {
    this.travelers = Math.max(1, this.travelers - 1);
  }

  /* ═══════════════════════════════════════════════
     GENERATE PLAN
     ═══════════════════════════════════════════════ */
  generatePlan(): void {
    if (!this.destination) {
      this.toast.warning('Destination required', 'Please select where you want to go');
      return;
    }

    this.isGenerating = true;
    this.generated = false;
    this.currentThinkingStep = 0;

    /* Cycle through AI thinking steps */
    this.thinkingInterval = setInterval(() => {
      if (this.currentThinkingStep < this.aiThinkingSteps.length - 1) {
        this.currentThinkingStep++;
      }
    }, 380);

    setTimeout(() => {
      const dailyPlans = this.createDailyPlans();

      this.tripPlan = {
        destination: this.destination,
        duration: this.duration,
        travelers: this.travelers,
        budget: this.getBudgetLabel(),
        travelStyle: this.getStyleLabel(),
        summary: `A personalized ${this.duration}-day ${this.getStyleLabel().toLowerCase()} journey through ${this.destination}, designed around your interests and travel preferences.`,
        estimatedCost: this.calculateEstimatedCost(),
        dailyPlans,
        tips: [
          { icon: '🕐', text: 'Keep some flexible time for unexpected discoveries.' },
          { icon: '👟', text: 'Carry comfortable shoes for local exploration.' },
          { icon: '📄', text: 'Keep digital copies of important travel documents.' },
          { icon: '🌤️', text: 'Check local weather before starting each day.' },
          { icon: '💧', text: 'Stay hydrated, especially during outdoor activities.' },
        ],
      };

      if (this.thinkingInterval) clearInterval(this.thinkingInterval);

      this.isGenerating = false;
      this.generated = true;

      this.toast.success('Trip generated!', 'Your personalized itinerary is ready');

      setTimeout(() => {
        document.getElementById('trip-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 150);
    }, 2200);
  }

  /* ═══════════════════════════════════════════════
     DAILY PLAN BUILDERS
     ═══════════════════════════════════════════════ */
  private createDailyPlans(): DailyPlan[] {
    const plans: DailyPlan[] = [];

    for (let day = 1; day <= this.duration; day++) {
      plans.push({
        day,
        title: this.getDayTitle(day),
        morning: this.getMorningActivity(day),
        afternoon: this.getAfternoonActivity(day),
        evening: this.getEveningActivity(day),
        image: this.getDayImage(),
        activities: this.getDayActivities(),
      });
    }

    return plans;
  }

  private getDayTitle(day: number): string {
    if (day === 1) return 'Arrival & First Exploration';
    if (day === this.duration) return 'Final Exploration & Departure';
    return `Explore ${this.destination}`;
  }

  private getMorningActivity(day: number): string {
    const map: Record<string, string> = {
      'Cox’s Bazar': day === 1 ? 'Arrive and settle into your beachfront hotel' : 'Sunrise beach walk and local breakfast',
      'Sajal Valley': day === 1 ? 'Travel to Sajek and check in' : 'Cloud-viewing and scenic mountain walk',
      'Bandarban': day === 1 ? 'Arrive and explore the hill town' : 'Mountain trail and viewpoint exploration',
      'Sylhet': day === 1 ? 'Arrive and check into your tea garden stay' : 'Tea garden and nature exploration',
      'Rangamati': day === 1 ? 'Arrival and lakeside check-in' : 'Boat ride and lake exploration',
      'Dhaka': day === 1 ? 'Arrive and check into your city hotel' : 'Old Dhaka heritage walk',
      'Sundarbans': day === 1 ? 'Arrive at the gateway and board the cruise' : 'Mangrove forest exploration',
      'Saint Martin': day === 1 ? 'Ferry to the island and check in' : 'Coral beach exploration',
    };
    return map[this.destination] || (day === 1 ? 'Arrive and check into your accommodation' : 'Explore major local attractions');
  }

  private getAfternoonActivity(day: number): string {
    if (this.selectedInterests.includes('Food')) {
      return 'Discover local cuisine and enjoy a recommended lunch experience';
    }
    if (this.selectedInterests.includes('Culture')) {
      return 'Visit cultural landmarks and discover local heritage';
    }
    if (this.selectedInterests.includes('Photography')) {
      return 'Golden-hour photography session at scenic locations';
    }
    return 'Explore scenic attractions and capture memorable moments';
  }

  private getEveningActivity(day: number): string {
    if (this.selectedStyle === 'RELAXING') {
      return 'Relax at your hotel and enjoy a peaceful evening';
    }
    if (this.selectedStyle === 'LUXURY') {
      return 'Premium dining experience and relaxed evening';
    }
    if (this.selectedStyle === 'ADVENTURE') {
      return 'Bonfire under the stars with local storytellers';
    }
    return 'Enjoy sunset views, local food and evening exploration';
  }

  private getDayImage(): string {
    const map: Record<string, string> = {
      'Cox’s Bazar': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      'Sajal Valley': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
      'Bandarban': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80',
      'Sylhet': 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600&q=80',
      'Rangamati': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
      'Dhaka': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
      'Sundarbans': 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
      'Saint Martin': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80',
    };
    return map[this.destination] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80';
  }

  private getDayActivities(): string[] {
    const base = ['Breakfast', 'Sightseeing', 'Local cuisine'];
    if (this.selectedInterests.includes('Photography')) base.push('Photo session');
    if (this.selectedInterests.includes('Culture')) base.push('Cultural visit');
    if (this.selectedInterests.includes('Adventure')) base.push('Adventure activity');
    return base;
  }

  /* ═══════════════════════════════════════════════
     COST
     ═══════════════════════════════════════════════ */
  private calculateEstimatedCost(): number {
    let dailyCost = 2500;
    if (this.selectedBudget === 'BUDGET') dailyCost = 1600;
    if (this.selectedBudget === 'PREMIUM') dailyCost = 5000;
    return dailyCost * this.duration * this.travelers;
  }

  /* ═══════════════════════════════════════════════
     LABELS
     ═══════════════════════════════════════════════ */
  getBudgetLabel(): string {
    return this.budgets.find((b) => b.value === this.selectedBudget)?.label ?? 'Mid Range';
  }

  getStyleLabel(): string {
    return this.travelStyles.find((s) => s.value === this.selectedStyle)?.label ?? 'Adventure';
  }

  /* ═══════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════ */
  resetPlanner(): void {
    this.destination = '';
    this.startDate = '';
    this.duration = 3;
    this.travelers = 2;
    this.selectedBudget = 'MID_RANGE';
    this.selectedStyle = 'ADVENTURE';
    this.selectedInterests = ['Nature'];
    this.generated = false;
    this.isGenerating = false;
    this.tripPlan = undefined;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.toast.info('Planner reset', 'Start planning a new journey');
  }

  goToBooking(): void {
    this.router.navigate(['/booking'], {
      queryParams: {
        type: 'TOUR_PACKAGE',
        destination: this.tripPlan?.destination || this.destination,
        duration: this.tripPlan?.duration || this.duration,
        travelers: this.tripPlan?.travelers || this.travelers,
      },
    });
  }

  /* ═══════════════════════════════════════════════
     SCROLL-TO-TOP HELPER
     ═══════════════════════════════════════════════ */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.generated && this.tripPlan) {
      this.resetPlanner();
    }
  }

  /* ─── helpers for template ─── */
  get currentThinkingLabel(): string {
    return this.aiThinkingSteps[this.currentThinkingStep]?.text || 'Processing...';
  }

  get currentThinkingIcon(): string {
    return this.aiThinkingSteps[this.currentThinkingStep]?.icon || '✦';
  }

  get totalActivities(): number {
    return this.tripPlan?.dailyPlans.reduce(
      (sum, day) => sum + day.activities.length,
      0,
    ) || 0;
  }
}