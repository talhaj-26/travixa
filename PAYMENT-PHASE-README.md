# TRAVIXA — Payment Management Phase

This phase extends the existing payment and booking flow without creating a duplicate payment page.

## Implemented

- Typed `Payment` model with:
  - payment reference
  - booking/customer association
  - amount and BDT currency
  - payment method
  - transaction ID
  - payment date
  - payment status
  - refund status preparation
  - invoice number
  - partner ownership preparation
  - timestamps
- New `PaymentService` demo/API facade.
- Payment records persisted separately from bookings in session storage for demo mode.
- Existing `/payment` route and payment component reused.
- Existing `/payment-result` receipt flow now reads typed payment records.
- Duplicate payment protection for already-paid bookings.
- Booking total is authoritative for the payment amount.
- Card number, expiry and CVV remain transient form values and are never persisted.
- Invoice and payment reference generation prepared for backend replacement.
- Payment lifecycle supports PENDING, PAID, FAILED, CANCELLED and REFUNDED at the model/service level.
- Refund status is prepared separately for the upcoming Refund phase.

## Security boundary

This is still frontend demo persistence. A real deployment must move payment authorization, transaction verification, gateway communication and sensitive payment handling to the Spring Boot backend/payment provider. The frontend must never store card numbers or CVV.

## Verification

Focused static checks were performed for route/component consistency and sensitive card-data persistence patterns.

Full `npm ci`, Angular build, and browser/unit tests were not completed in this environment because dependency installation timed out / the packaged project does not contain `node_modules`.

Run locally:

```bash
npm ci
ng build
ng test --watch=false
```
