export type PartnerBusinessType =
  | 'HOTEL'
  | 'RESTAURANT'
  | 'TRAVEL_AGENCY'
  | 'TRANSPORT_PROVIDER'
  | 'TOUR_GUIDE';

export type PartnerApplicationStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_INFORMATION';

export interface PartnerApplication {
  id: string;
  businessType: PartnerBusinessType;
  legalBusinessName: string;
  tradingName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  address: string;
  district: string;
  division: string;
  tradeLicenseNumber: string;
  taxIdentificationNumber?: string;
  yearsOperating: number;
  businessDescription: string;
  services: string[];
  submittedAt: string;
  status: PartnerApplicationStatus;
  reviewNotes?: string;
  reviewedAt?: string;
}

export type CreatePartnerApplication = Omit<
  PartnerApplication,
  'id' | 'submittedAt' | 'status' | 'reviewNotes' | 'reviewedAt'
>;
