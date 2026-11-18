import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';

interface VisualSlide {
  image: string;
  location: string;
  kicker: string;
  title: string;
  titleAccent: string;
  description: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  isSubmitting = false;
  loginSuccess = false;
  showPassword = false;
  capsLockOn = false;
  shakeForm = false;
  errorMessage = '';
  currentYear = new Date().getFullYear();

  trustBadges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '🛡', label: 'GDPR Ready' },
    { icon: '✉', label: 'Email Verified' },
    { icon: '⚡', label: 'Instant Access' },
  ];

  lastLoginInfo: { time: string; device: string } | null = null;

  visualProgress = 0;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  visuals: VisualSlide[] = [
    {
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=85',
      location: "Cox's Bazar",
      kicker: 'THE LONGEST SEA BEACH',
      title: 'Your journey',
      titleAccent: 'starts here.',
      description:
        '122 kilometres of golden sand along the Bay of Bengal — where every sunset feels like a story waiting to be told.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&q=85',
      location: 'Sylhet',
      kicker: 'EMERALD HILLS',
      title: 'Discover places',
      titleAccent: 'worth remembering.',
      description:
        'Endless tea gardens rolling over gentle hills, misty mornings, and the warm hospitality of the Sylheti people.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=85',
      location: 'Bandarban',
      kicker: 'ABOVE THE CLOUDS',
      title: 'Travel beyond',
      titleAccent: 'the ordinary.',
      description:
        'Home to the highest peaks of Bangladesh — misty trails, indigenous culture, and sunrise above the clouds.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1400&q=85',
      location: 'Saint Martin',
      kicker: 'THE CORAL ISLAND',
      title: 'Escape to',
      titleAccent: 'crystal blue.',
      description:
        "Bangladesh's only coral island — turquoise waters, coconut palms, and silence you only find far from the mainland.",
    },
  ];

  visualFeatures = [
    { icon: '✦', title: 'Explore smarter', subtitle: 'AI-powered discovery' },
    {
      icon: '⌖',
      title: 'Travel seamlessly',
      subtitle: 'Stays, tours & transport',
    },
    { icon: '◆', title: 'One ecosystem', subtitle: 'Everything connected' },
  ];

  currentVisualIndex = 0;
  private visualInterval: ReturnType<typeof setInterval> | null = null;
  private readonly VISUAL_ROTATION_MS = 8000;

  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  get username() {
    return this.loginForm.controls.username;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  get currentVisual(): VisualSlide {
    return this.visuals[this.currentVisualIndex];
  }

  ngOnInit(): void {
    this.startVisualRotation();
    this.startProgressBar();

    const savedEmail = localStorage.getItem('travixa_last_username')
      ?? sessionStorage.getItem('travixa_last_username');

    if (savedEmail) {
      this.loginForm.patchValue({ username: savedEmail });
    }

    const lastLogin = localStorage.getItem('travixa_last_login');

    if (lastLogin) {
      try {
        this.lastLoginInfo = JSON.parse(lastLogin);
      } catch {
        this.lastLoginInfo = null;
      }
    }
  }

  ngOnDestroy(): void {
    this.stopVisualRotation();
    this.stopProgressBar();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.errorMessage) {
      this.errorMessage = '';
    }
  }

  private startVisualRotation(): void {
    this.stopVisualRotation();

    this.visualInterval = setInterval(() => {
      this.currentVisualIndex =
        (this.currentVisualIndex + 1) % this.visuals.length;

      this.visualProgress = 0;
    }, this.VISUAL_ROTATION_MS);
  }

  private stopVisualRotation(): void {
    if (this.visualInterval) {
      clearInterval(this.visualInterval);
      this.visualInterval = null;
    }
  }

  setVisual(index: number): void {
    this.currentVisualIndex = index;
    this.visualProgress = 0;
    this.startVisualRotation();
  }

  private startProgressBar(): void {
    this.visualProgress = 0;

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    const stepMs = 80;
    const totalSteps = this.VISUAL_ROTATION_MS / stepMs;
    let step = 0;

    this.progressInterval = setInterval(() => {
      step++;

      this.visualProgress = Math.min(100, (step / totalSteps) * 100);

      if (step >= totalSteps) {
        step = 0;
      }
    }, stepMs);
  }

  private stopProgressBar(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  checkCapsLock(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState?.('CapsLock') ?? false;
  }

  submit(): void {
    this.errorMessage = '';
    this.shakeForm = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.triggerShake();
      return;
    }

    this.isSubmitting = true;

    const { username, password, rememberMe } = this.loginForm.getRawValue();
    const normalizedUsername = username.trim();

    const rememberedStore = rememberMe ? localStorage : sessionStorage;
    const otherStore = rememberMe ? sessionStorage : localStorage;
    rememberedStore.setItem('travixa_last_username', normalizedUsername);
    otherStore.removeItem('travixa_last_username');

    this.authService
      .login({
        username: normalizedUsername,
        password,
      }, rememberMe)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;

          this.saveLastLoginInfo();

          this.loginSuccess = true;

          this.toast.success(
            'Welcome back!',
            `Signed in as ${response.user.name}`,
          );

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

          const destination =
            returnUrl &&
            returnUrl.startsWith('/') &&
            !returnUrl.startsWith('//')
              ? returnUrl
              : this.authService.getRoleHome();

          setTimeout(() => {
            this.router.navigateByUrl(destination);
          }, 700);
        },

        error: (error: Error) => {
          this.isSubmitting = false;

          this.errorMessage =
            error.message || 'Unable to sign in. Please try again.';

          this.triggerShake();

          this.toast.error(
            'Sign in failed',
            error.message || 'Please check your credentials.',
          );
        },
      });
  }

  private saveLastLoginInfo(): void {
    const info = {
      time: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      device: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
        ? 'Mobile'
        : 'Desktop',
    };

    localStorage.setItem('travixa_last_login', JSON.stringify(info));
  }

  private triggerShake(): void {
    this.shakeForm = true;

    setTimeout(() => {
      this.shakeForm = false;
    }, 500);
  }
}
