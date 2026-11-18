import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthService } from '../../../core/services/auth.service';

type PageState = 'form' | 'success';

interface Slide {
  image: string;
  location: string;
  badge: string;
  title: string;
  titleAccent: string;
  caption: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ThemeToggleComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);

  currentState: PageState = 'form';
  isLoading = false;
  errorMessage = '';
  submittedEmail = '';

  // ═══ Visual progress bar ═══
  slideProgress = 0;
  private progressInterval: any;

  // ═══ Resend cooldown (60s) ═══
  resendCooldown = 0;
  private cooldownInterval: any;
  readonly COOLDOWN_SECONDS = 60;

  // ═══ Trust badges ═══
  trustBadges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '🛡', label: 'GDPR Ready' },
    { icon: '✉', label: 'Encrypted Email' },
    { icon: '⚡', label: 'Secure Recovery' },
  ];

  // ═══ 6 Bangladesh tourism slides ═══
  slides: Slide[] = [
    {
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=85',
      location: "Cox's Bazar",
      badge: 'THE LONGEST SEA BEACH',
      title: 'Every journey has',
      titleAccent: 'a way back.',
      caption: '122 km of golden sand — where a new story begins.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&q=85',
      location: 'Sylhet',
      badge: 'EMERALD TEA HILLS',
      title: 'Rediscover your',
      titleAccent: 'path forward.',
      caption: 'Misty mornings in the rolling tea gardens of Sylhet.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=85',
      location: 'Bandarban',
      badge: 'ABOVE THE CLOUDS',
      title: 'A fresh start',
      titleAccent: 'above the clouds.',
      caption: 'Highest peaks and cloud-kissed trails of Bandarban.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1400&q=85',
      location: 'Saint Martin',
      badge: 'THE CORAL ISLAND',
      title: 'Return to',
      titleAccent: 'crystal clarity.',
      caption: "Bangladesh's only coral island — pure and turquoise.",
    },
    {
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=85',
      location: 'Sundarbans',
      badge: 'WILDERNESS UNBOUND',
      title: 'Find your way',
      titleAccent: 'through the wild.',
      caption: "World's largest mangrove forest — a kingdom awaits.",
    },
    {
      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=85',
      location: 'Rangamati',
      badge: 'LAKE SERENITY',
      title: 'Calm waters',
      titleAccent: 'ahead.',
      caption: 'Floating peace on the serene Kaptal Lake.',
    },
  ];

  currentSlide = 0;
  private slideInterval: any;
  private readonly SLIDE_MS = 6000;

  forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.forgotForm.controls.email;
  }

  // ─── Lifecycle ───
  ngOnInit(): void {
    this.startSlideshow();
    this.startProgressBar();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
    this.stopProgressBar();
    this.stopCooldown();
  }

  // ─── Esc closes error ───
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.errorMessage) {
      this.errorMessage = '';
    }
  }

  // ─── Slideshow ───
  private startSlideshow(): void {
    this.stopSlideshow();
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      this.slideProgress = 0;
    }, this.SLIDE_MS);
  }

  private stopSlideshow(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  goToSlide(i: number): void {
    this.currentSlide = i;
    this.slideProgress = 0;
    this.startSlideshow();
  }

  // ─── Progress bar ───
  private startProgressBar(): void {
    this.slideProgress = 0;
    if (this.progressInterval) clearInterval(this.progressInterval);

    const stepMs = 80;
    const totalSteps = this.SLIDE_MS / stepMs;
    let step = 0;

    this.progressInterval = setInterval(() => {
      step++;
      this.slideProgress = Math.min(100, (step / totalSteps) * 100);
      if (step >= totalSteps) step = 0;
    }, stepMs);
  }

  private stopProgressBar(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // ─── Resend cooldown ───
  private startCooldown(): void {
    this.resendCooldown = this.COOLDOWN_SECONDS;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);

    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.stopCooldown();
      }
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
    this.resendCooldown = 0;
  }

  get canResend(): boolean {
    return this.resendCooldown === 0 && !this.isLoading;
  }

  // ─── Submit ───
  submit(): void {
    this.errorMessage = '';

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const { email } = this.forgotForm.getRawValue();
    this.submittedEmail = email.trim().toLowerCase();
    this.isLoading = true;
    this.authService.requestPasswordReset(this.submittedEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentState = 'success';
        this.startCooldown();
        this.toast.success('Recovery request received', 'If that account exists, a reset link will be sent.');
      },
      error: (error: Error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Password recovery email is unavailable right now.';
        this.toast.error('Password recovery unavailable', this.errorMessage);
      },
    });
  }

  resend(): void {
    if (!this.canResend) return;

    this.isLoading = true;
    this.authService.requestPasswordReset(this.submittedEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.errorMessage = '';
        this.startCooldown();
        this.toast.info('Request sent', 'Check your inbox for a new reset link.');
      },
      error: (error: Error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'We could not resend the reset email.';
      },
    });
  }
}
