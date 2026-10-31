# Brightloop 3-Minute Video Demo Script (Make Attempt Hackathon)

This script is synchronized to section 14 of the PRD to guarantee maximum scoring in the demo review.

---

### Step 1: Problem & Distributed Architecture (0:00 – 0:30)
- **Visual**: Show system architecture diagram (`docs/ARCHITECTURE.md`).
- **Narrative**:
  > "Brightloop is a production-grade B2B SaaS subscription and billing platform. We solve the three classic billing failures: lost revenue from missed billing cycles, duplicate charges during concurrent worker runs, and floating-point paise discrepancies. Built with a decoupled React SPA, Express REST API, PostgreSQL with ACID row-locking, and a background cron worker."

---

### Step 2: Customer Signup & Password Rule Checklist (0:30 – 0:50)
- **Visual**: Open `/register`.
- **Action**: Type a 8-character password `Abcdefg!`, show live checklist failing on "Minimum 9 characters". Type `Abcdefg!1` (9 chars) and show all 4 criteria turn green.
- **Narrative**:
  > "Our security policy enforces a strict 9-character minimum with uppercase, lowercase, and special character requirements, verified simultaneously in the UI and server-side Zod validators."
- Complete registration as customer.

---

### Step 3: Admin Catalog & Variant Pricing (0:50 – 1:15)
- **Visual**: Login as `admin@brightloop.test` (click the quick-fill button).
- **Action**:
  - Open **Products**: Show Brightloop CRM with the **Odoo Brand Variant (+₹560.00)**.
  - Open **Plans**: Show Monthly Basic and Yearly Pro, demonstrating the 4 lifecycle behaviour toggles (Auto Close, Early Close, Allow Pause, Allow Renew).
  - Open **Taxes & Discounts**: Show GST 18% for Software, GST 5% for Services, and the Launch Promo discount with an atomic 3-use limit.

---

### Step 4: Staff Workflow — Quotation to Active Contract (1:15 – 1:45)
- **Visual**: Switch to `staff@brightloop.test`.
- **Action**:
  - Open **Subscriptions** -> Click **New Subscription**.
  - Select Acme Corp, choose the Standard CRM template.
  - Open the created subscription: Show lifecycle stepper in `DRAFT`.
  - Click **Send Quotation** (`QUOTATION`).
  - Click **Confirm Subscription** (`CONFIRMED`).
  - Click **Activate Subscription** (`ACTIVE`). Show `nextInvoiceDate` automatically sets to start date.

---

### Step 5: Billing Engine Execution & Idempotency Guarantee (1:45 – 2:15) [DEMO GOLD]
- **Visual**: Click **Run Billing Now** modal in the top header or subscription detail.
- **Action**:
  - Click **Run Billing Engine**.
  - Show invoice generated with snapshot line items, GST 18% tax calculated, and the ₹500 discount auto-applied.
  - Immediately click **Run Billing Engine AGAIN**.
  - Show **zero duplicates generated** (`Created: 0, Skipped: 1`).
- **Narrative**:
  > "Notice how running the billing engine again created zero duplicates. Brightloop guarantees idempotency using compound database constraints on subscription ID and period start."

---

### Step 6: Payment Reconcile & Overpayment Protection (2:15 – 2:40)
- **Visual**: Open the generated Invoice detail page.
- **Action**:
  - Click **Confirm Invoice**.
  - Click **Record Payment** -> Try entering ₹999,999. Show instant overpayment rejection.
  - Enter a partial payment of ₹3,000 -> Status remains `CONFIRMED`.
  - Record the remaining balance -> Invoice flips to `PAID` in real-time.
  - Click **Print / PDF View** to show the print-ready invoice.

---

### Step 7: Finance Dashboard & Performance Proof (2:40 – 3:00)
- **Visual**: Navigate to **Overview** (Dashboard).
- **Action**:
  - Highlight the 5 KPI cards: Active Subs, MRR, Revenue Collected, Outstanding, and Overdue Accounts.
  - Point to the **Query Execution Time Badge** (`< 50ms`), proving sub-2-second performance.
  - Switch briefly to Customer Portal (`customer@acme.test`): Show customer only sees their own invoices, and customer-permitted actions (pause/renew) follow plan rules.
- **Closing**:
  > "Brightloop delivers end-to-end reliability, paise-level precision, and sub-2-second analytics for modern SaaS businesses. Thank you!"

