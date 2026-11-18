
export type RefundRequestStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RefundRequest {
  id: number;
  paymentId: number;
  referenceNumber: string;
  amount: number;
  currency: 'BDT';
  status: RefundRequestStatus;
  reason: string;
  processedAt: string | null;
}

export interface CreateRefundRequest {
  paymentId: number;
  amount: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundReviewRequest {
  status: 'APPROVED' | 'REJECTED';
}
