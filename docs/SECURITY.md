# Brightloop Security Architecture & Controls

## 1. Authentication & Password Security

- **Bcrypt Cost Factor**: Password hashes use bcrypt with cost 12 (`BCRYPT_ROUNDS = 12`).
- **Password Policy Regex**:
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$`
  Enforces a strict minimum of 9 characters (more than eight), with at least one uppercase, one lowercase, and one special character.
- **Client & Server Parity**: Both client-side live validation checklist and server-side Zod schema validate against the exact same regex.
- **Timing Safe Authentication**: Login and password reset requests return uniform error responses to eliminate email enumeration attacks.

## 2. Token Security

- **JWT Storage**: JWT tokens are issued in an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie with a 1-hour expiration window.
- **Password Reset Tokens**:
  - 32 cryptographically random bytes generated via `crypto.randomBytes(32)`.
  - Stored strictly as a SHA-256 hash in the database.
  - Enforced single-use: upon reset, the token is marked `usedAt` and all historical tokens for that user are purged.
  - Strict 1-hour validity window.

## 3. Authorization & Anti-IDOR (Insecure Direct Object Reference)

- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Full privileges (catalogs, plans, taxes, discounts, staff creation).
  - `STAFF`: Operational handling (customer onboarding, subscriptions, billing runs, payments, invoices). Cannot create staff or edit catalogs/discounts.
  - `CUSTOMER`: Limited exclusively to customer self-service portal.
- **Server-Side Ownership Enforcement**:
  Every customer portal query explicitly overrides input IDs with `where: { customerId: req.user.customerId }`. Even if a malicious customer attempts to guess or query another customer's subscription or invoice ID, the server returns `404 Not Found`.

## 4. Concurrency & Financial Integrity

- **Idempotent Billing Runs**:
  `Invoice` model enforces `@@unique([subscriptionId, periodStart])`.
- **Atomic Discount Limits**:
  Discounts with usage limits are claimed atomically within transaction blocks:
  `UPDATE "Discount" SET "usedCount" = "usedCount" + 1 WHERE "id" = :id AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`
- **Zero Overpayment Guarantee**:
  Payments exceeding `total - amountPaid` are rejected at the database transaction layer with `422 OVERPAYMENT`.

## 5. Network & HTTP Hardening

- `helmet` applied to secure HTTP response headers.
- Strict CORS policy requiring explicit origin whitelist and credentials support.
- Body parser payload limits to mitigate payload DOS.

