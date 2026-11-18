import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type ReviewCategory =
  | 'ALL'
  | 'HOTEL'
  | 'RESTAURANT'
  | 'TOUR_PACKAGE'
  | 'TOUR_GUIDE';

interface Review {
  id: number;
  reviewerName: string;
  reviewerImage: string;
  category: Exclude<ReviewCategory, 'ALL'>;
  itemName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verifiedBooking: boolean;
}

@Component({
  selector: 'app-review-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-rating.component.html',
  styleUrl: './review-rating.component.scss',
})
export class ReviewRatingComponent {
  selectedCategory: ReviewCategory = 'ALL';
  selectedRating = 'ALL';

  isReviewFormOpen = false;
  isSubmitted = false;

  reviewForm = {
    reviewerName: '',
    category: 'HOTEL' as Exclude<ReviewCategory, 'ALL'>,
    itemName: '',
    rating: 0,
    title: '',
    comment: '',
  };

  categories = [
    { value: 'ALL', label: 'All Reviews', icon: '⭐' },
    { value: 'HOTEL', label: 'Hotels', icon: '🏨' },
    { value: 'RESTAURANT', label: 'Restaurants', icon: '🍽️' },
    { value: 'TOUR_PACKAGE', label: 'Tour Packages', icon: '🧳' },
    { value: 'TOUR_GUIDE', label: 'Tour Guides', icon: '🧭' },
  ];

  ratingOptions = [
    { value: 'ALL', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
  ];

  reviews: Review[] = [
    {
      id: 1,
      reviewerName: 'Nusrat Jahan',
      reviewerImage: 'assets/images/users/user-1.jpg',
      category: 'HOTEL',
      itemName: 'Sea Pearl Beach Resort',
      rating: 5,
      title: 'Absolutely beautiful stay',
      comment:
        'The beachfront location, room quality and hospitality were excellent. Everything felt premium and comfortable.',
      date: '2026-08-28',
      verifiedBooking: true,
    },
    {
      id: 2,
      reviewerName: 'Sakib Hasan',
      reviewerImage: 'assets/images/users/user-2.jpg',
      category: 'TOUR_PACKAGE',
      itemName: 'Sajek Cloud Escape',
      rating: 5,
      title: 'Perfect mountain experience',
      comment:
        'The entire trip was well organized. The views were amazing and the itinerary was worth every moment.',
      date: '2026-08-24',
      verifiedBooking: true,
    },
    {
      id: 3,
      reviewerName: 'Tanjim Ahmed',
      reviewerImage: 'assets/images/users/user-3.jpg',
      category: 'RESTAURANT',
      itemName: 'The Xchange',
      rating: 4,
      title: 'Great food and atmosphere',
      comment:
        'Excellent service with a beautiful atmosphere. Food quality was very good and the staff were friendly.',
      date: '2026-08-20',
      verifiedBooking: true,
    },
    {
      id: 4,
      reviewerName: 'Mim Rahman',
      reviewerImage: 'assets/images/users/user-4.jpg',
      category: 'TOUR_GUIDE',
      itemName: 'Arif Mahmud',
      rating: 5,
      title: 'Amazing local guide',
      comment:
        'Very knowledgeable and friendly. He helped us discover places we would never have found ourselves.',
      date: '2026-08-17',
      verifiedBooking: true,
    },
    {
      id: 5,
      reviewerName: 'Rafi Chowdhury',
      reviewerImage: 'assets/images/users/user-5.jpg',
      category: 'HOTEL',
      itemName: 'Sajek Resort',
      rating: 4,
      title: 'Peaceful and relaxing',
      comment:
        'Beautiful mountain environment and a comfortable room. A great choice for a short getaway.',
      date: '2026-08-12',
      verifiedBooking: true,
    },
    {
      id: 6,
      reviewerName: 'Sadia Islam',
      reviewerImage: 'assets/images/users/user-6.jpg',
      category: 'RESTAURANT',
      itemName: 'Mezetto Rooftop',
      rating: 5,
      title: 'Wonderful dining experience',
      comment:
        'Amazing rooftop atmosphere with delicious food and professional service.',
      date: '2026-08-08',
      verifiedBooking: false,
    },
  ];

  constructor(private router: Router) {}

  get filteredReviews(): Review[] {
    return this.reviews.filter((review) => {
      const matchesCategory =
        this.selectedCategory === 'ALL' ||
        review.category === this.selectedCategory;

      const matchesRating =
        this.selectedRating === 'ALL' ||
        review.rating >= Number(this.selectedRating);

      return matchesCategory && matchesRating;
    });
  }

  get averageRating(): number {
    if (!this.reviews.length) {
      return 0;
    }

    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);

    return total / this.reviews.length;
  }

  get fiveStarCount(): number {
    return this.reviews.filter((review) => review.rating === 5).length;
  }

  get fourStarCount(): number {
    return this.reviews.filter((review) => review.rating === 4).length;
  }

  get threeStarCount(): number {
    return this.reviews.filter((review) => review.rating === 3).length;
  }

  get verifiedReviewCount(): number {
    return this.reviews.filter((review) => review.verifiedBooking).length;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category as ReviewCategory;
  }

  selectRating(rating: string): void {
    this.selectedRating = rating;
  }

  setRating(rating: number): void {
    this.reviewForm.rating = rating;
  }

  openReviewForm(): void {
    this.isReviewFormOpen = true;
    this.isSubmitted = false;
  }

  closeReviewForm(): void {
    this.isReviewFormOpen = false;
    this.isSubmitted = false;
  }

  submitReview(): void {
    if (
      !this.reviewForm.reviewerName ||
      !this.reviewForm.itemName ||
      !this.reviewForm.rating ||
      !this.reviewForm.title ||
      !this.reviewForm.comment
    ) {
      return;
    }

    const newReview: Review = {
      id: this.reviews.length + 1,
      reviewerName: this.reviewForm.reviewerName,
      reviewerImage: 'assets/images/users/default-user.jpg',
      category: this.reviewForm.category,
      itemName: this.reviewForm.itemName,
      rating: this.reviewForm.rating,
      title: this.reviewForm.title,
      comment: this.reviewForm.comment,
      date: new Date().toISOString().split('T')[0],
      verifiedBooking: true,
    };

    this.reviews.unshift(newReview);

    this.isSubmitted = true;

    this.reviewForm = {
      reviewerName: '',
      category: 'HOTEL',
      itemName: '',
      rating: 0,
      title: '',
      comment: '',
    };
  }

  clearFilters(): void {
    this.selectedCategory = 'ALL';
    this.selectedRating = 'ALL';
  }

  getStars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, index) =>
      index < rating ? '★' : '☆',
    );
  }

  writeReview(): void {
    this.openReviewForm();
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }

  goBack(): void {
    window.history.back();
  }
}
