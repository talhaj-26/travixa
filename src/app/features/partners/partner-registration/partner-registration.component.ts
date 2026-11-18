import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PartnerBusinessType } from '../../../core/models/partner-application.model';
import { PartnerApplicationService } from '../../../core/services/partner-application.service';

interface BusinessTypeOption {
  value: PartnerBusinessType;
  label: string;
  description: string;
  services: string[];
}

@Component({
  selector: 'app-partner-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './partner-registration.component.html',
  styleUrl: './partner-registration.component.scss',
})
export class PartnerRegistrationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly applications = inject(PartnerApplicationService);

  submittedApplicationId = '';
  errorMessage = '';
  isSubmitting = false;

  readonly businessTypes: BusinessTypeOption[] = [
    { value: 'HOTEL', label: 'Hotel or accommodation', description: 'Properties, resorts, serviced apartments and homestays.', services: ['Rooms', 'Room availability', 'Amenities'] },
    { value: 'RESTAURANT', label: 'Restaurant', description: 'Dining venues, cafés and culinary experiences.', services: ['Table reservations', 'Menu', 'Opening hours'] },
    { value: 'TRAVEL_AGENCY', label: 'Travel agency', description: 'Licensed package tour and travel operators.', services: ['Tour packages', 'Itineraries', 'Offers'] },
    { value: 'TRANSPORT_PROVIDER', label: 'Transport provider', description: 'Licensed buses, cars, launches and other transport.', services: ['Fleet', 'Routes', 'Schedules'] },
    { value: 'TOUR_GUIDE', label: 'Tour guide', description: 'Independent, verified professional tour guides.', services: ['Guide profile', 'Availability', 'Experiences'] },
  ];

  readonly divisions = [
    'Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet',
  ];

  readonly form = this.fb.nonNullable.group({
    businessType: ['HOTEL' as PartnerBusinessType, Validators.required],
    legalBusinessName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    tradingName: ['', Validators.maxLength(120)],
    contactName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', [Validators.required, Validators.pattern(/^\+?8801[3-9]\d{8}$/)]],
    website: ['', Validators.pattern(/^https?:\/\/\S+$/)],
    address: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(250)]],
    district: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    division: ['', Validators.required],
    tradeLicenseNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(80)]],
    taxIdentificationNumber: ['', Validators.maxLength(80)],
    yearsOperating: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    businessDescription: ['', [Validators.required, Validators.minLength(40), Validators.maxLength(1500)]],
    consent: [false, Validators.requiredTrue],
  });

  get selectedBusinessType(): BusinessTypeOption {
    return this.businessTypes.find(
      (option) => option.value === this.form.controls.businessType.value,
    ) ?? this.businessTypes[0];
  }

  submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSubmitting = true;
    this.applications
      .submit({
        businessType: raw.businessType,
        legalBusinessName: raw.legalBusinessName.trim(),
        tradingName: raw.tradingName.trim() || undefined,
        contactName: raw.contactName.trim(),
        contactEmail: raw.contactEmail.trim().toLowerCase(),
        contactPhone: raw.contactPhone.replace(/\s/g, ''),
        website: raw.website.trim() || undefined,
        address: raw.address.trim(),
        district: raw.district.trim(),
        division: raw.division,
        tradeLicenseNumber: raw.tradeLicenseNumber.trim(),
        taxIdentificationNumber: raw.taxIdentificationNumber.trim() || undefined,
        yearsOperating: raw.yearsOperating,
        businessDescription: raw.businessDescription.trim(),
        services: this.selectedBusinessType.services,
      })
      .subscribe({
        next: (application) => {
          this.isSubmitting = false;
          this.submittedApplicationId = application.id;
          this.form.disable();
        },
        error: (error: Error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'We could not submit your application.';
        },
      });
  }

  reset(): void {
    this.form.reset({ businessType: 'HOTEL', yearsOperating: 0, consent: false });
    this.form.enable();
    this.submittedApplicationId = '';
    this.errorMessage = '';
  }
}
