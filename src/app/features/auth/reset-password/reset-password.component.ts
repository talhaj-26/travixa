import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthService } from '../../../core/services/auth.service';

type PageState = 'validating' | 'form' | 'invalid' | 'success';

interface Slide {
  image: string;
  location: string;
  badge: string;
  title: string;
  titleAccent: string;
  caption: string;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ThemeToggleComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);

  currentState: PageState = 'validating';
  isLoading = false;
  errorMessage = '';
  invalidReason = '';

  showPassword = false;
  showConfirmPassword = false;
  capsLockOn = false;

  token = '';

  // ═══ NEW: Progress bar (consistent with Forgot Password) ═══
  slideProgress = 0;
  private progressInterval: any;

  // ═══ NEW: Trust badges ═══
  trustBadges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '🛡', label: 'GDPR Ready' },
    { icon: '✉', label: 'Secure Recovery' },
    { icon: '⚡', label: 'Instant Update' },
  ];

  // ═══ 5 Bangladesh tourism slides ═══
  slides: Slide[] = [
    {
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=85',
      location: "Cox's Bazar",
      badge: 'SECURE YOUR JOURNEY',
      title: 'A new chapter',
      titleAccent: 'begins now.',
      caption: 'Every great adventure starts with a fresh start.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=85',
      location: 'Bandarban',
      badge: 'STRONG LIKE MOUNTAINS',
      title: 'Build a password',
      titleAccent: 'strong as peaks.',
      caption: 'Highest peaks and cloud-kissed trails await you.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1400&q=85',
      location: 'Saint Martin',
      badge: 'CRYSTAL CLEAR',
      title: 'Clarity and',
      titleAccent: 'security.',
      caption: "Bangladesh's only coral island — pure and turquoise.",
    },
    {
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=85',
      location: 'Sundarbans',
      badge: 'GUARD YOUR GATEWAY',
      title: 'Protected',
      titleAccent: 'like the wild.',
      caption: "World's largest mangrove — a natural fortress.",
    },
    {
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&q=85',
      location: 'Sylhet',
      badge: 'A FRESH START',
      title: 'Rediscover your',
      titleAccent: 'journey.',
      caption: 'Misty mornings in the rolling tea gardens.',
    },
  ];

  currentSlide = 0;
  private slideInterval: any;
  private readonly SLIDE_MS = 6000;

  resetForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator() },
  );

  get password() {
    return this.resetForm.controls.password;
  }
  get confirmPassword() {
    return this.resetForm.controls.confirmPassword;
  }

  // ─── Lifecycle ───
  ngOnInit(): void {
    this.startSlideshow();
    this.startProgressBar();

    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.validateToken();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
    this.stopProgressBar();
  }

  // ─── NEW: Esc to dismiss error ───
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

  // ─── NEW: Progress bar ───
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

  // ─── Token validation ───
  private validateToken(): void {
    if (!this.token) {
      this.currentState = 'invalid';
      this.invalidReason =
        'No reset token found in the link. Please request a new password reset email.';
      return;
    }

    this.authService.validatePasswordReset(this.token).subscribe({
      next: () => this.currentState = 'form',
      error: (error: Error) => {
        this.currentState = 'invalid';
        this.invalidReason = error.message || 'This reset link is invalid, expired, or has already been used.';
      },
    });
  }

  // ─── Password helpers ───
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkCapsLock(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState?.('CapsLock') ?? false;
  }

  showMismatch(): boolean {
    const pass = this.password.value;
    const confirm = this.confirmPassword.value;
    return !!confirm && this.confirmPassword.touched && pass !== confirm;
  }

  get passwordStrength(): number {
    const pwd = this.password.value;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  get passwordStrengthLabel(): string {
    return (
      ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength] ??
      ''
    );
  }

  hasMinLength(): boolean {
    return this.password.value.length >= 8;
  }
  hasUppercase(): boolean {
    return /[A-Z]/.test(this.password.value);
  }
  hasNumber(): boolean {
    return /[0-9]/.test(this.password.value);
  }
  hasSpecial(): boolean {
    return /[^A-Za-z0-9]/.test(this.password.value);
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const pass = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      if (!pass || !confirm) return null;
      return pass === confirm ? null : { passwordMismatch: true };
    };
  }

  // ─── Submit ───
  submit(): void {
    this.errorMessage = '';

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (!this.hasMinLength() || this.passwordStrength < 3) {
      this.errorMessage = 'Use at least eight characters with uppercase, a number, and a symbol.';
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword({ resetToken: this.token, newPassword: this.password.value }).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentState = 'success';
        this.toast.success('Password updated', 'Sign in with your new password.');
      },
      error: (error: Error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Your password could not be updated.';
        if (/invalid|expired/i.test(this.errorMessage)) {
          this.invalidReason = this.errorMessage;
          this.currentState = 'invalid';
        }
      },
    });
  }
}
