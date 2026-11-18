export type PaymentMethod =
  | 'CARD'
  | 'MOBILE_FINANCIAL_SERVICE'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'WALLET'
  | 'DEMO';

export type PaymentStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'GBP';

export interface Payment {
  id: number;
  bookingId: number;
  referenceNumber: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface PaymentInitiationRequest {
  bookingId: number;
  method: PaymentMethod;
  idempotencyKey: string;
}

/** Shape returned by POST /api/payments/initiate. */
export interface PaymentInitiationResponse {
  paymentId: number;
  bookingId: number;
  referenceNumber: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayConfigured: boolean;
  demoMode: boolean;
  message: string;
}
