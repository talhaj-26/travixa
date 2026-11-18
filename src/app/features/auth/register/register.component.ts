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
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';

interface Slide {
  image: string;
  location: string;
  badge: string;
  quote: string;
  caption: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ThemeToggleComponent,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  showPassword = false;
  showConfirmPassword = false;

  // Slideshow progress
  slideProgress = 0;

  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private slideInterval: ReturnType<typeof setInterval> | null = null;

  private readonly SLIDE_MS = 6000;
  private readonly PROGRESS_STEP_MS = 80;

  // Trust badges
  readonly trustBadges = [
    { icon: '🔒', label: 'Secure Registration' },
    { icon: '🛡', label: 'Account Protection' },
    { icon: '✉', label: 'Email Required' },
    { icon: '⚡', label: 'Quick Sign Up' },
  ];;


  roleOptions = [
    {
      value: 'CUSTOMER',
      label: 'Traveler',
      description: 'Discover destinations and book experiences.',
      icon: '✈️',
      gradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
    }
  ];

  selectRole(role: string): void {
    if (role !== 'CUSTOMER') {
      return;
    }

    // Public registration is always for travelers.
    // The backend must assign CUSTOMER securely.
  }
  // Password criteria
  get passwordCriteria() {
    const pwd = this.password.value || '';

    return [
      { label: '8+ chars', met: pwd.length >= 8 },
      { label: 'Uppercase', met: /[A-Z]/.test(pwd) },
      { label: 'Number', met: /[0-9]/.test(pwd) },
      { label: 'Symbol', met: /[^A-Za-z0-9]/.test(pwd) },
    ];
  }

  // Bangladesh tourism slides
  readonly slides: Slide[] = [
    {
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=85',
      location: "Cox's Bazar",
      badge: 'THE LONGEST SEA BEACH',
      quote: 'Where the ocean meets infinity.',
      caption: '122 km of golden sand along the Bay of Bengal.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&q=85',
      location: 'Sylhet',
      badge: 'EMERALD TEA HILLS',
      quote: 'Wake up to endless green.',
      caption: 'Misty mornings in the rolling tea gardens.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=85',
      location: 'Bandarban',
      badge: 'ABOVE THE CLOUDS',
      quote: 'Travel beyond the ordinary.',
      caption: 'Highest peaks and cloud-kissed trails.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1400&q=85',
      location: 'Saint Martin',
      badge: 'THE CORAL ISLAND',
      quote: 'Escape to crystal blue.',
      caption: "Bangladesh's only coral island.",
    },
    {
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=85',
      location: 'Sundarbans',
      badge: 'WILDERNESS UNBOUND',
      quote: 'Into the mangrove kingdom.',
      caption: "World's largest mangrove forest.",
    },
    {
      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=85',
      location: 'Rangamati',
      badge: 'LAKE SERENITY',
      quote: 'Where hills meet still water.',
      caption: 'Floating peace on Kaptai Lake.',
    },
  ];

  currentSlide = 0;

  // Backend-compatible registration form.
  // middleName, phone and terms are frontend-only fields.
  readonly registerForm = this.fb.nonNullable.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-z0-9._-]+$/),
        ],
      ],
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      middleName: ['', [Validators.maxLength(100)]],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(254),
        ],
      ],
      phone: [''],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          Validators.pattern(
            /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/
          ),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    {
      validators: passwordMatchValidator(),
    },
  );

  // Form getters
  get username() {
    return this.registerForm.controls.username;
  }

  get firstName() {
    return this.registerForm.controls.firstName;
  }

  get lastName() {
    return this.registerForm.controls.lastName;
  }

  get email() {
    return this.registerForm.controls.email;
  }

  get phone() {
    return this.registerForm.controls.phone;
  }

  get password() {
    return this.registerForm.controls.password;
  }

  get confirmPassword() {
    return this.registerForm.controls.confirmPassword;
  }

  get terms() {
    return this.registerForm.controls.terms;
  }

  get passwordStrength(): number {
    const pwd = this.password.value;

    if (!pwd) {
      return 0;
    }

    let score = 0;

    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    return score;
  }

  get passwordStrengthLabel(): string {
    return (
      ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][
      this.passwordStrength
      ] ?? ''
    );
  }

  // Lifecycle
  ngOnInit(): void {
    this.startSlideshow();
    this.startProgressBar();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
    this.stopProgressBar();
  }

  // Keyboard shortcut: Escape closes the error message.
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.errorMessage) {
      this.errorMessage = '';
    }
  }

  // Slideshow
  private startSlideshow(): void {
    this.stopSlideshow();

    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, this.SLIDE_MS);
  }

  private stopSlideshow(): void {
    if (this.slideInterval !== null) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.slideProgress = 0;
    this.startSlideshow();
    this.startProgressBar();
  }

  prevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) %
      this.slides.length;

    this.slideProgress = 0;
    this.startSlideshow();
    this.startProgressBar();
  }

  goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) {
      return;
    }

    this.currentSlide = index;
    this.slideProgress = 0;
    this.startSlideshow();
    this.startProgressBar();
  }

  // Progress bar
  private startProgressBar(): void {
    this.stopProgressBar();
    this.slideProgress = 0;

    const totalSteps = this.SLIDE_MS / this.PROGRESS_STEP_MS;
    let step = 0;

    this.progressInterval = setInterval(() => {
      step++;

      this.slideProgress = Math.min(
        100,
        (step / totalSteps) * 100,
      );

      if (step >= totalSteps) {
        step = 0;
      }
    }, this.PROGRESS_STEP_MS);
  }

  private stopProgressBar(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Password visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Registration
  register(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;

    const { username, email, password, firstName, lastName } =
      this.registerForm.getRawValue();

    this.authService.register({
      username,
      email,
      password,
      firstName,
      lastName,
    }).subscribe({
      next: () => {
        this.successMessage = 'Account created successfully.';
        this.isLoading = false;

        this.toast.success(
          'Welcome to TRAVIXA!',
          'Your account has been created.',
        );

        setTimeout(() => {
          void this.router.navigateByUrl(this.authService.getRoleHome());
        }, 1400);
      },

      error: (error: Error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
        this.toast.error('Registration failed', this.errorMessage);
      },
    });
  }
}
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    // Individual required validators handle empty fields.
    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword
      ? null
      : { passwordMismatch: true };
  };
}
