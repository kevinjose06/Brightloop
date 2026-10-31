# Brightloop API Reference (v1)

All endpoints accept and return JSON. The interactive Swagger documentation is available at `/api/docs`.

## Global Error Envelope

All API errors return a standard envelope with HTTP status codes:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters provided",
    "details": [
      {
        "field": "password",
        "issue": "Password must contain at least one special character"
      }
    ],
    "requestId": "c1f190bc-4389-4d69-9c5c-7d92ad5a34bb"
  }
}
```

### Standard Error Codes
- `VALIDATION_ERROR` (400): Malformed input or schema failure.
- `UNAUTHENTICATED` (401): Missing or expired JWT token.
- `FORBIDDEN` (403): Role or permission violation.
- `NOT_FOUND` (404): Target resource does not exist or blocked by IDOR scope.
- `CONFLICT` (409): Unique constraint violation (e.g. duplicate email).
- `INVALID_TRANSITION` (409): Illegal state transition requested.
- `OVERPAYMENT` (422): Payment exceeds invoice balance.
- `PLAN_UNAVAILABLE` (422): Plan inactive or out of availability window.
- `BELOW_MIN_QUANTITY` (422): Line item volume lower than plan minimum.
- `INTERNAL` (500): Server error (stack traces hidden from response).

---

## Authentication Endpoints

### `POST /api/v1/auth/register`
Creates a new customer organization and owner user. Sets httpOnly cookie.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "company": "Acme Technologies",
    "email": "jane@acme.com",
    "phone": "+91 98765 43210",
    "address": "100 Tech Park, Bengaluru",
    "taxId": "29ABCDE1234F1Z5",
    "password": "Password123!"
  }
  ```

### `POST /api/v1/auth/login`
Authenticates user, validates bcrypt hash (cost 12), sets `token` in httpOnly cookie.

### `POST /api/v1/auth/logout`
Clears session cookie.

### `GET /api/v1/auth/me`
Retrieves authenticated user session and role profile.

### `POST /api/v1/auth/forgot-password`
Generates single-use SHA-256 password reset token and dispatches email.

### `POST /api/v1/auth/reset-password`
Consumes reset token and sets new password.

### `POST /api/v1/auth/staff` (Admin Only)
Provisions internal staff credentials.

---

## Catalog & Configuration (Admin Write, Others Read)

### `GET /api/v1/catalog/products`
Lists products with their configured attribute variants.

### `POST /api/v1/catalog/products` (Admin Only)
Creates product with base salesPrice, costPrice, and variants.

### `GET /api/v1/catalog/plans`
Retrieves plans with billing period and lifecycle policy flags.

### `POST /api/v1/catalog/plans` (Admin Only)
Creates a plan with:
- `autoClose` (boolean)
- `allowEarlyClose` (boolean)
- `allowPause` (boolean)
- `allowRenew` (boolean)

### `GET /api/v1/catalog/taxes`
Lists tax rules ordered by priority.

### `POST /api/v1/catalog/taxes` (Admin Only)
Creates a percentage tax rule with optional `productType` scoping.

### `GET /api/v1/catalog/discounts`
Lists active discounts with atomic usage limit counters.

### `POST /api/v1/catalog/discounts` (Admin Only)
Creates fixed or percentage discount with scope (`PRODUCT` or `SUBSCRIPTION`).

---

## Subscriptions Lifecycle

### `GET /api/v1/subscriptions`
Lists subscriptions with server-side pagination, filters (`status`, `planId`, `customerId`), and search (`q`).

### `POST /api/v1/subscriptions`
Initializes a new subscription in `DRAFT` status with effective prices snapshot from catalog or quotation template.

### `GET /api/v1/subscriptions/:id`
Returns full subscription contract, lines, and generated invoice history.

### `POST /api/v1/subscriptions/:id/transition`
Transitions contract status:
- `DRAFT` -> `QUOTATION` or `CLOSED`
- `QUOTATION` -> `CONFIRMED` or `CLOSED`
- `CONFIRMED` -> `ACTIVE` or `CLOSED`
- `ACTIVE` -> `CLOSED`

### `POST /api/v1/subscriptions/:id/pause` & `/resume`
Toggles `isPaused` flag if `plan.allowPause` is true.

### `POST /api/v1/subscriptions/:id/renew`
Extends contract expiry by one billing period if `plan.allowRenew` is true.

---

## Invoices & Automated Billing

### `POST /api/v1/billing/run`
Executes billing engine for all due subscriptions. Returns evaluated, created, skipped, and failed counts.

### `GET /api/v1/invoices`
Lists generated invoices with balance due calculations.

### `GET /api/v1/invoices/:id`
Retrieves invoice, snapshot lines, taxes, applied discounts, and payment ledger.

### `POST /api/v1/invoices/:id/confirm`
Transitions invoice from `DRAFT` to `CONFIRMED`.

### `POST /api/v1/invoices/:id/cancel`
Cancels invoice (reverts discount usage if unpaid).

### `POST /api/v1/invoices/:id/send`
Dispatches HTML statement via email to customer.

### `GET /api/v1/invoices/:id/print`
Serves print-optimized HTML view formatted for paper or PDF export.

---

## Payments

### `POST /api/v1/invoices/:id/payments`
Records incoming payment:
- Methods: `CASH`, `CARD`, `BANK_TRANSFER`, `UPI`, `CHEQUE`
- Rejects overpayment (`422 OVERPAYMENT`)
- Automatically flips invoice status to `PAID` when payments equal total.

### `GET /api/v1/payments`
Lists verified payment ledger with audit attribution.

---

## Financial Reports & Analytics

### `GET /api/v1/reports/summary`
Returns active subscriptions, MRR, revenue collected, billed total, outstanding balance, and overdue counts. Cached in memory for 30s.

### `GET /api/v1/reports/revenue-series`
Returns monthly revenue and billed totals over trailing 6 months.

### `GET /api/v1/reports/overdue`
Returns list of confirmed invoices past their due date with days overdue calculation.

---

## Customer Self-Service Portal

All `/api/v1/portal/*` endpoints strictly filter against `req.user.customerId`.

### `GET /api/v1/portal/subscriptions`
Returns authenticated customer's subscriptions.

### `POST /api/v1/portal/subscriptions/:id/pause`
Customer self-pause (enforces `plan.allowPause`).

### `POST /api/v1/portal/subscriptions/:id/close`
Customer early cancellation (enforces `plan.allowEarlyClose`).

### `POST /api/v1/portal/subscriptions/:id/renew`
Customer renewal (enforces `plan.allowRenew`).

### `GET /api/v1/portal/invoices`
Returns customer's invoices and statement balances.

