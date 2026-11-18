import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  private readonly toast = inject(ToastService);

  // Newsletter
  newsletterEmail = '';
  isSubscribing = false;

  currentYear = new Date().getFullYear();

  // ═══════════════════════════════════════════
  // EXPLORE — সব route verified ✅
  // ═══════════════════════════════════════════
  exploreLinks = [
    { label: 'Discover', route: '/discover' },
    { label: 'Destinations', route: '/destinations' },
    { label: 'Tour Packages', route: '/tour-packages' },
    { label: 'Hotels & Stays', route: '/stays' },
    { label: 'Restaurants', route: '/restaurants' },
    { label: 'Tour Guides', route: '/tour-guides' },
  ];

  // ═══════════════════════════════════════════
  // TRAVEL — সব route verified ✅
  // ═══════════════════════════════════════════
  travelLinks = [
    { label: 'Flights', route: '/flights' },
    { label: 'Holidays', route: '/holidays' },
    { label: 'Transportation', route: '/transportation' },
    { label: 'AI Trip Planner', route: '/ai-planner', badge: 'NEW' },
    { label: 'My Bookings', route: '/my-bookings' },
    { label: 'Reviews', route: '/review-rating' },
  ];

  // ═══════════════════════════════════════════
  // COMPANY — শুধু যা actual routes এ আছে ✅
  // ═══════════════════════════════════════════
  companyLinks = [
    { label: 'About TRAVIXA', route: '/about' },
    { label: 'Support Center', route: '/support' },
    { label: 'FAQ', route: '/faq' },
    { label: 'Coupons & Offers', route: '/coupons-offers' },
    { label: 'Weather', route: '/weather' },
    { label: 'Maps', route: '/maps' },
  ];

  // ═══════════════════════════════════════════
  // PARTNERS — actual routes ✅
  // ═══════════════════════════════════════════
  partnerLinks = [
    { label: 'Become a Partner', route: '/partner-registration', badge: 'NEW' },
    { label: 'Hotel Management', route: '/hotel-management' },
    { label: 'Restaurant Management', route: '/restaurant-management' },
    { label: 'Tour Package Management', route: '/tour-package-management' },
    { label: 'Tour Guide Management', route: '/tour-guide-management' },
    { label: 'Transport Management', route: '/transport-management' },
  ];

  // ═══════════════════════════════════════════
  // SOCIAL — actual brand URLs
  // ═══════════════════════════════════════════
  socialLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com/travixa',
      icon: 'facebook',
      color: '#1877F2',
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/travixa',
      icon: 'instagram',
      color: '#E4405F',
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/travixa',
      icon: 'linkedin',
      color: '#0A66C2',
    },
    {
      name: 'X (Twitter)',
      url: 'https://x.com/travixa',
      icon: 'twitter',
      color: '#000000',
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com/@travixa',
      icon: 'youtube',
      color: '#FF0000',
    },
  ];

  // ═══════════════════════════════════════════
  // APP LINKS
  // ═══════════════════════════════════════════
  appLinks = [
    {
      name: 'Google Play',
      url: 'https://play.google.com/store/apps/details?id=com.travixa',
      icon: 'google-play',
    },
    {
      name: 'App Store',
      url: 'https://apps.apple.com/app/travixa/id000000000',
      icon: 'app-store',
    },
  ];

  // ═══════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════
  paymentMethods = ['visa', 'mastercard', 'bkash', 'nagad', 'rocket'];

  // ═══════════════════════════════════════════
  // NEWSLETTER
  // ═══════════════════════════════════════════
  subscribeToNewsletter(): void {
    const email = this.newsletterEmail.trim();

    if (!email || !email.includes('@')) {
      this.toast.error('Invalid email', 'Please enter a valid email address');
      return;
    }

    this.isSubscribing = true;

    setTimeout(() => {
      this.isSubscribing = false;
      this.newsletterEmail = '';
      this.toast.success(
        'Subscribed!',
        'You will now receive TRAVIXA travel updates',
      );
    }, 1200);
  }
}
