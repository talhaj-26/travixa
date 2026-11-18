import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthService } from '../../../core/services/auth.service';

type ProfileTab = 'PERSONAL' | 'PREFERENCES' | 'SECURITY' | 'ADDRESS';

interface UserProfile {
  id: string;
  initials: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  role: string;
  roleLabel: string;
  memberSince: string;
  verified: boolean;
  accountStatus: 'Active' | 'Inactive' | 'Suspended';
  profileCompletion: number;
  avatarUrl: string | null;
}

interface TravelStat {
  icon: string;
  value: number;
  label: string;
  suffix?: string;
  accent: 'blue' | 'purple' | 'green' | 'amber';
}

interface Preference {
  id: string;
  icon: string;
  label: string;
  active: boolean;
}

interface AddressInfo {
  country: string;
  city: string;
  area: string;
  street: string;
  postalCode: string;
  department: string;
  memberSince: string;
}

interface ActiveSession {
  device: string;
  icon: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface TravelBadge {
  icon: string;
  label: string;
  unlocked: boolean;
  description: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);

  isLoading = false;
  isSaving = false;
  private currentUsername: string | null = null;
  /* ─── Profile data ─── */
  profile: UserProfile = {
    id: 'TRV-1001',
    initials: 'TJ',
    fullName: 'Talha Jubayer',
    firstName: 'Talha',
    lastName: 'Jubayer',
    email: 'talha@example.com',
    phone: '+880 1XXX-XXXXXX',
    age: 26,
    gender: 'Male',
    dateOfBirth: '1999-01-01',
    role: 'CUSTOMER',
    roleLabel: 'Traveler',
    memberSince: '2024',
    verified: true,
    accountStatus: 'Active',
    profileCompletion: 88,
    avatarUrl: null,
  };

  /* ─── Tabs ─── */
  activeTab: ProfileTab = 'PERSONAL';
  tabs: { value: ProfileTab; label: string; icon: string }[] = [
    { value: 'PERSONAL', label: 'Personal', icon: '👤' },
    { value: 'PREFERENCES', label: 'Preferences', icon: '✦' },
    { value: 'SECURITY', label: 'Security', icon: '🔒' },
    { value: 'ADDRESS', label: 'Address', icon: '📍' },
  ];

  /* ─── Edit mode ─── */
  editMode = false;
  editBuffer: UserProfile = { ...this.profile };

  /* ─── Notifications badge ─── */
  unreadNotifications = 3;

  /* ─── Travel stats (4 cards) ─── */
  travelStats: TravelStat[] = [
    { icon: '✈', value: 12, label: 'Trips', accent: 'blue' },
    { icon: '★', value: 8, label: 'Reviews', accent: 'purple' },
    { icon: '♥', value: 24, label: 'Wishlist', accent: 'green' },
    { icon: '🌍', value: 5, label: 'Countries', accent: 'amber' },
  ];
  animatedStats: number[] = [0, 0, 0, 0];

  /* ─── Travel badges ─── */
  travelBadges: TravelBadge[] = [
    {
      icon: '🧭',
      label: 'Explorer',
      unlocked: true,
      description: 'Visited 5+ destinations',
    },
    {
      icon: '🏔',
      label: 'Adventurer',
      unlocked: true,
      description: 'Completed a mountain trek',
    },
    {
      icon: '🍲',
      label: 'Foodie',
      unlocked: true,
      description: 'Tried 10+ local cuisines',
    },
    {
      icon: '📸',
      label: 'Photographer',
      unlocked: false,
      description: 'Share 20+ photos',
    },
    {
      icon: '⭐',
      label: 'Top Reviewer',
      unlocked: false,
      description: 'Write 15+ reviews',
    },
  ];

  /* ─── Preferences ─── */
  preferences: Preference[] = [
    { id: 'beach', icon: '🏖', label: 'Beach', active: true },
    { id: 'nature', icon: '🌿', label: 'Nature', active: true },
    { id: 'adventure', icon: '🏔', label: 'Adventure', active: true },
    { id: 'culture', icon: '🏛', label: 'Culture', active: true },
  ];

  allPreferences: Preference[] = [
    { id: 'beach', icon: '🏖', label: 'Beach', active: false },
    { id: 'nature', icon: '🌿', label: 'Nature', active: false },
    { id: 'adventure', icon: '🏔', label: 'Adventure', active: false },
    { id: 'culture', icon: '🏛', label: 'Culture', active: false },
    { id: 'food', icon: '🍲', label: 'Food Tours', active: false },
    { id: 'photography', icon: '📷', label: 'Photography', active: false },
    { id: 'wildlife', icon: '🐅', label: 'Wildlife', active: false },
    { id: 'luxury', icon: '✦', label: 'Luxury', active: false },
    { id: 'trekking', icon: '🥾', label: 'Trekking', active: false },
    { id: 'history', icon: '📜', label: 'History', active: false },
    { id: 'diving', icon: '🤿', label: 'Diving', active: false },
    { id: 'wellness', icon: '💆', label: 'Wellness', active: false },
  ];

  /* ─── Address ─── */
  address: AddressInfo = {
    country: 'Bangladesh',
    city: 'Dhaka',
    area: 'Gulshan',
    street: 'Gulshan Avenue',
    postalCode: '1212',
    department: 'Travel & Tourism',
    memberSince: '2024',
  };

  /* ─── Security ─── */
  twoFactorEnabled = true;
  activeSessions: ActiveSession[] = [
    {
      device: 'Chrome · MacBook Pro',
      icon: '💻',
      location: 'Dhaka, Bangladesh',
      lastActive: 'Active now',
      current: true,
    },
    {
      device: 'Safari · iPhone 15',
      icon: '📱',
      location: 'Dhaka, Bangladesh',
      lastActive: '2 hours ago',
      current: false,
    },
    {
      device: 'Chrome · Windows PC',
      icon: '🖥',
      location: 'Chattogram, Bangladesh',
      lastActive: '3 days ago',
      current: false,
    },
  ];

  /* ─── UI state ─── */
  showAvatarMenu = false;
  private progressInterval: any;

  constructor() {}

  /* ═══════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
ngOnInit(): void {
  const user = this.authService.getCurrentUser();

  if (!user) {
    this.toast.error(
      'Authentication required',
      'Please sign in to view your profile.',
    );
    this.router.navigate(['/login']);
    return;
  }

  this.currentUsername = user.username || null;

  if (!this.currentUsername) {
    this.toast.error(
      'Profile unavailable',
      'Your username is missing from the current session. Please sign in again.',
    );
    return;
  }

  this.loadProfile();
}

private loadProfile(): void {
  if (!this.currentUsername) return;

  this.isLoading = true;

  this.authService.getUserProfile(this.currentUsername).subscribe({
    next: (user) => {
      const firstName = user.firstName?.trim() || '';
      const lastName = user.lastName?.trim() || '';
      const fullName =
        `${firstName} ${lastName}`.trim() || user.username;

      const role = user.roles?.[0]?.replace(/^ROLE_/, '') || 'CUSTOMER';

      const initials =
        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
        user.username.slice(0, 2).toUpperCase();

      this.profile = {
        ...this.profile,
        id: user.id,
        fullName,
        firstName,
        lastName,
        email: user.email,
        initials,
        role,
        roleLabel: this.formatRole(role),
        memberSince: user.dateCreated
          ? new Date(user.dateCreated).getFullYear().toString()
          : '—',
        accountStatus: user.enabled ? 'Active' : 'Inactive',

        // The backend DTO does not currently provide these fields.
        phone: '',
        age: 0,
        dateOfBirth: '',
        gender: 'Other',
        avatarUrl: null,

        // Do not imply a verified account without backend verification.
        verified: false,
      };

      this.editBuffer = { ...this.profile };

      // Do not use fabricated travel data as real account statistics.
      this.profile.profileCompletion = this.calculateProfileCompletion();
    },
    error: (error) => {
      if (error.status === 401 || error.status === 403) {
        this.toast.error(
          'Access denied',
          'Please sign in again or check your account permissions.',
        );
      } else if (error.status === 404) {
        this.toast.error('Profile not found', 'The requested account was not found.');
      } else {
        this.toast.error(
          'Unable to load profile',
          'Please try again later.',
        );
      }
    },
    complete: () => {
      this.isLoading = false;
    },
  });
}

private calculateProfileCompletion(): number {
  const fields = [
    this.profile.firstName,
    this.profile.lastName,
    this.profile.email,
  ];

  const completed = fields.filter((value) => value.trim().length > 0).length;

  return Math.round((completed / fields.length) * 100);
}


  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private loadFromSession(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const parts = user.name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : user.name.substring(0, 2).toUpperCase();

    this.profile = {
      ...this.profile,
      id: user.usersid,
      fullName: user.name,
      firstName: parts[0] || this.profile.firstName,
      lastName: parts.slice(1).join(' ') || this.profile.lastName,
      email: user.email,
      phone: user.phone || this.profile.phone,
      dateOfBirth: user.dateOfBirth || this.profile.dateOfBirth,
      gender: user.gender,
      role: user.role,
      roleLabel: this.formatRole(user.role),
      memberSince: user.createdAt
        ? new Date(user.createdAt).getFullYear().toString()
        : this.profile.memberSince,
      avatarUrl: user.profileImage ?? null,
      initials,
    };
    this.address = {
      ...this.address,
      street: user.address || this.address.street,
      department: user.department || this.address.department,
    };
    this.editBuffer = { ...this.profile };
  }

  private formatRole(role: string): string {
    return role
      .replace('ROLE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private animateStats(): void {
    this.travelStats.forEach((stat, i) => {
      this.animateNumber(stat.value, 900 + i * 100, (v) => {
        this.animatedStats[i] = Math.round(v);
      });
    });
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

  /* ═══════════════════════════════════════════════════════════
     TABS
     ═══════════════════════════════════════════════════════════ */
  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    if (this.editMode) this.cancelEdit();
  }

  /* ═══════════════════════════════════════════════════════════
     EDIT MODE
     ═══════════════════════════════════════════════════════════ */
  startEdit(): void {
    this.editBuffer = { ...this.profile };
    this.editMode = true;
    this.toast.info('Edit mode enabled', 'Update your profile information');
  }

  cancelEdit(): void {
    this.editBuffer = { ...this.profile };
    this.editMode = false;
  }

  // saveEdit(): void {
  //   if (!this.validateEditBuffer()) return;

  //   const newInitials =
  //     (this.editBuffer.firstName.charAt(0) || '') +
  //     (this.editBuffer.lastName.charAt(0) || '');

  //   const profile = {
  //     ...this.editBuffer,
  //     fullName:
  //       `${this.editBuffer.firstName} ${this.editBuffer.lastName}`.trim(),
  //     initials: newInitials.toUpperCase() || this.profile.initials,
  //   };
  //   this.authService
  //     .updateCurrentUser({
  //       name: profile.fullName,
  //       email: profile.email.trim().toLowerCase(),
  //       phone: profile.phone,
  //       dateOfBirth: profile.dateOfBirth,
  //       gender: profile.gender,
  //       profileImage: profile.avatarUrl ?? undefined,
  //     })
  //     .subscribe({
  //       next: () => {
  //         this.profile = profile;
  //         this.editBuffer = { ...profile };
  //         this.editMode = false;
  //         this.toast.success('Profile updated', 'Your changes have been saved');
  //       },
  //       error: () =>
  //         this.toast.error('Profile not updated', 'Please try again.'),
  //     });
  // }
saveEdit(): void {
  if (this.isSaving || !this.validateEditBuffer()) return;

  if (!this.currentUsername) {
    this.toast.error(
      'Profile unavailable',
      'Please sign in again before updating your profile.',
    );
    return;
  }

  const firstName = this.editBuffer.firstName.trim();
  const lastName = this.editBuffer.lastName.trim();
  const email = this.editBuffer.email.trim().toLowerCase();

  this.isSaving = true;

  this.authService
    .updateUserProfile(this.currentUsername, {
      firstName,
      lastName,
      email,
    })
    .subscribe({
      next: (savedUser) => {
        const fullName =
          `${savedUser.firstName ?? ''} ${savedUser.lastName ?? ''}`.trim() ||
          savedUser.username;

        const initials =
          `${savedUser.firstName?.charAt(0) ?? ''}${savedUser.lastName?.charAt(0) ?? ''}`
            .toUpperCase() || savedUser.username.slice(0, 2).toUpperCase();

        this.profile = {
          ...this.profile,
          id: savedUser.id,
          firstName: savedUser.firstName ?? '',
          lastName: savedUser.lastName ?? '',
          fullName,
          email: savedUser.email,
          initials,
          role: savedUser.roles?.[0]?.replace(/^ROLE_/, '') || 'CUSTOMER',
          roleLabel: this.formatRole(
            savedUser.roles?.[0]?.replace(/^ROLE_/, '') || 'CUSTOMER',
          ),
          accountStatus: savedUser.enabled ? 'Active' : 'Inactive',
          memberSince: savedUser.dateCreated
            ? new Date(savedUser.dateCreated).getFullYear().toString()
            : this.profile.memberSince,
        };

        this.profile.profileCompletion = this.calculateProfileCompletion();
        this.editBuffer = { ...this.profile };
        this.editMode = false;

        this.toast.success(
          'Profile updated',
          'Your changes have been saved.',
        );
      },
      error: (error) => {
        if (error.status === 409) {
          this.toast.error(
            'Email already in use',
            'Please use a different email address.',
          );
        } else if (error.status === 400) {
          this.toast.error(
            'Invalid profile information',
            'Check the supplied name and email address.',
          );
        } else {
          this.toast.error(
            'Profile not updated',
            'Please try again later.',
          );
        }
      },
      complete: () => {
        this.isSaving = false;
      },
    });
}
  // private validateEditBuffer(): boolean {
  //   if (!this.editBuffer.firstName.trim() || !this.editBuffer.lastName.trim()) {
  //     this.toast.error('Name required', 'First and last name cannot be empty');
  //     return false;
  //   }
  //   if (!/^\S+@\S+\.\S+$/.test(this.editBuffer.email)) {
  //     this.toast.error('Invalid email', 'Please enter a valid email address');
  //     return false;
  //   }
  //   return true;
  // }
private validateEditBuffer(): boolean {
  const firstName = this.editBuffer.firstName.trim();
  const lastName = this.editBuffer.lastName.trim();
  const email = this.editBuffer.email.trim();

  if (!firstName || !lastName) {
    this.toast.error(
      'Name required',
      'First and last name cannot be empty.',
    );
    return false;
  }

  if (firstName.length > 100 || lastName.length > 100) {
    this.toast.error(
      'Name too long',
      'Names must not exceed 100 characters.',
    );
    return false;
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    this.toast.error('Invalid email', 'Please enter a valid email address.');
    return false;
  }

  return true;
}
  /* ═══════════════════════════════════════════════════════════
     PREFERENCES
     ═══════════════════════════════════════════════════════════ */
  togglePreference(pref: Preference): void {
    pref.active = !pref.active;
    if (pref.active) {
      if (!this.preferences.find((p) => p.id === pref.id)) {
        this.preferences.push({ ...pref, active: true });
      }
      this.toast.success(`${pref.label} added`, 'Preference updated');
    } else {
      this.preferences = this.preferences.filter((p) => p.id !== pref.id);
      this.toast.info(`${pref.label} removed`, 'Preference updated');
    }
  }

  isPreferenceActive(id: string): boolean {
    return !!this.preferences.find((p) => p.id === id && p.active);
  }

  removePreference(pref: Preference, event?: Event): void {
    event?.stopPropagation();
    pref.active = false;
    this.preferences = this.preferences.filter((p) => p.id !== pref.id);
    this.toast.info(`${pref.label} removed`, 'Preference updated');
  }

  get activePreferenceCount(): number {
    return this.preferences.length;
  }

  /* ═══════════════════════════════════════════════════════════
     SECURITY
     ═══════════════════════════════════════════════════════════ */
  toggle2FA(): void {
    this.twoFactorEnabled = !this.twoFactorEnabled;
    this.toast.success(
      `2FA ${this.twoFactorEnabled ? 'enabled' : 'disabled'}`,
      this.twoFactorEnabled
        ? 'Your account is now more secure'
        : 'Two-factor authentication disabled',
    );
  }

  revokeSession(session: ActiveSession): void {
    if (session.current) {
      this.toast.warning(
        'Cannot revoke current session',
        'Sign out to end this session',
      );
      return;
    }
    this.activeSessions = this.activeSessions.filter((s) => s !== session);
    this.toast.success('Session revoked', `${session.device} signed out`);
  }

  signOutAllDevices(): void {
    this.activeSessions = this.activeSessions.filter((s) => s.current);
    this.toast.success(
      'All sessions ended',
      'Signed out from all other devices',
    );
  }

  /* ═══════════════════════════════════════════════════════════
     AVATAR
     ═══════════════════════════════════════════════════════════ */
  toggleAvatarMenu(event?: Event): void {
    event?.stopPropagation();
    this.showAvatarMenu = !this.showAvatarMenu;
  }

  uploadAvatar(): void {
    this.showAvatarMenu = false;

    // Simulate file picker — in production use <input type="file">
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      // reader.onload = (ev: any) => {
      //   const avatarUrl = ev.target.result as string;
      //   this.authService
      //     .updateCurrentUser({ profileImage: avatarUrl })
      //     .subscribe({
      //       next: () => {
      //         this.profile = { ...this.profile, avatarUrl };
      //         this.editBuffer = { ...this.editBuffer, avatarUrl };
      //         this.toast.success(
      //           'Photo uploaded',
      //           'Your avatar has been updated',
      //         );
      //       },
      //       error: () =>
      //         this.toast.error('Photo not uploaded', 'Please try again.'),
      //     });
      // };
      reader.readAsDataURL(file);
    };

    input.click();
  }

  removeAvatar(): void {
    this.showAvatarMenu = false;
    // this.authService.updateCurrentUser({ profileImage: undefined }).subscribe({
    //   next: () => {
    //     this.profile = { ...this.profile, avatarUrl: null };
    //     this.editBuffer = { ...this.editBuffer, avatarUrl: null };
    //     this.toast.info('Photo removed', 'Using initials as avatar');
    //   },
    //   error: () => this.toast.error('Photo not removed', 'Please try again.'),
    // });
  }

  /* ═══════════════════════════════════════════════════════════
     LOGOUT
     ═══════════════════════════════════════════════════════════ */
logout(): void {
  this.authService.logout().subscribe({
    next: () => {
      this.toast.info('Signed out', 'See you next time!');
      this.router.navigate(['/login']);
    },
    error: () => {
      // AuthService currently clears local credentials in finalize().
      this.toast.info('Signed out', 'Your local session has been cleared.');
      this.router.navigate(['/login']);
    },
  });
}

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════ */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
  goToHome(): void {
    this.router.navigate(['/']);
  }
  goToBookings(): void {
    this.router.navigate(['/my-bookings']);
  }
  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
  goToResetPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
  goToPlanner(): void {
    this.router.navigate(['/ai-planner']);
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */
  get displayInitials(): string {
    if (this.editMode) {
      return (
        (this.editBuffer.firstName.charAt(0) || '') +
        (this.editBuffer.lastName.charAt(0) || '')
      ).toUpperCase();
    }
    return this.profile.initials;
  }
}
