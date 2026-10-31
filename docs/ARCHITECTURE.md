# Brightloop Architecture & Technical Design

## 1. System Overview

Brightloop is a production-grade, distributed B2B SaaS subscription lifecycle and automated billing management platform designed for the Make Attempt hackathon.

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite SPA                     │
│         Tailwind CSS / Lucide / TanStack Query         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Express REST API (V1)                  │
│       Zod Validation │ JWT Auth │ Service Layer        │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     PostgreSQL 16         │  │   Background Worker     │
│ Row-Level Locking / ACID  │◀─┤   (node-cron engine)    │
│  Paise Minor Units (Int)  │  │ Automated Billing Run   │
└───────────────────────────┘  └─────────────────────────┘
```

## 2. Core Design Principles & Tradeoffs

| Decision | Rationale |
| --- | --- |
| **Integer Minor Units (Paise)** | Floating-point math introduces rounding errors in monetary sums. All currency is stored as 64-bit integer minor units (paise) and formatted at the presentation layer using `Intl.NumberFormat`. |
| **Snapshot Invoicing** | When an invoice is generated, product names, unit prices, discount deductions, and tax names/rates are snapshot onto `InvoiceLine`. Subsequent price changes never mutate historical invoices. |
| **Concurrency & Idempotency** | Invoices enforce a unique compound constraint: `@@unique([subscriptionId, periodStart])`. Two concurrent billing runs will never produce duplicate invoices. |
| **Atomic Discount Decrement** | Concurrent invoice generation updates discount usage using atomic SQL execution: `UPDATE "Discount" SET "usedCount" = "usedCount" + 1 WHERE id = ... AND (usageLimit IS NULL OR usedCount < usageLimit)`. |
| **Anti-IDOR Ownership Enforced on Server** | In every customer portal query, the active user's `customerId` is strictly injected server-side. Tampering with invoice or subscription IDs yields 404 Not Found. |
| **Strict State Machines** | Illegal lifecycle transitions reject immediately with `409 INVALID_TRANSITION` and supply allowed next states in the payload details. |

## 3. Subscription State Machine

```
   ┌───────────┐
   │   DRAFT   ├──────── send quote ───────▶┌─────────────┐
   └─────┬─────┘                            │  QUOTATION  │
         │                                  └──────┬──────┘
         │ (cancel)                                │ (confirm)
         ▼                                         ▼
   ┌───────────┐                            ┌─────────────┐
   │  CLOSED   │◀────────── close ──────────┤  CONFIRMED  │
   └─────▲─────┘                            └──────┬──────┘
         │                                         │ (activate: nextInvoiceDate = startDate)
         │                                         ▼
         │                                  ┌─────────────┐
         └──────────────── close ───────────┤   ACTIVE    │
                                            └──────┬──────┘
                                                   │
                           [Pause / Resume / Renew according to Plan flags]
```

## 4. Invoice State Machine

```
   ┌───────────┐
   │   DRAFT   ├──────── confirm ──────────▶┌─────────────┐
   └─────┬─────┘                            │  CONFIRMED  │
         │ (cancel)                         └──────┬──────┘
         ▼                                         │ (payments reach invoice total)
   ┌───────────┐                                   ▼
   │ CANCELLED │◀──── cancel (only if paid=0) ──────┤    PAID     │
   └───────────┘                                   └─────────────┘
```

## 5. Billing Engine Algorithm

```
runBilling(today):
  1. Find active, unpaused subscriptions where nextInvoiceDate <= today
  2. For each subscription in an isolated transaction:
     a. While nextInvoiceDate <= today and <= expiryDate:
        - periodStart = nextInvoiceDate
        - periodEnd = calculatePeriodEnd(periodStart, plan.billingPeriod)
        - Check unique constraint (subscriptionId, periodStart). If exists, skip (idempotent catch-up)
        - Snapshot lines with current effective prices (salesPrice + variant extraPrice)
        - Evaluate eligible discounts (Scope: PRODUCT and SUBSCRIPTION, best per scope)
        - Atomically claim discount usage
        - Calculate applicable taxes (Priority match on productType -> generic tax rule)
        - Insert Invoice (status: DRAFT or CONFIRMED)
        - nextInvoiceDate = periodEnd + 1 day
     b. If plan.autoClose is true and nextInvoiceDate > expiryDate:
        - Transition status to CLOSED
  3. Record BillingRun audit summary { evaluated, created, skipped, failed }
```

