# Dev 2 Endpoints & Discovery Reference (Step 0)

> Generated based on actual codebase audit of `apps/api/src/routes/*.ts`, `schema.prisma`, `services/*.ts`, and `apps/web/src/**`.

---

### 1. Exact Pause, Resume, Renew, Close-Early Endpoints

#### A. Customer Self-Service Portal (`apps/api/src/routes/portalRoutes.ts`)
Base URL prefix: `/api/v1/portal` (proxied by Vite from `/api/v1/portal`)

| Action | Method | Path | Request Body | Response Shape | Authorized Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pause** | `POST` | `/api/v1/portal/subscriptions/:id/pause` | None (`{}`) | `{ data: Subscription }` | `CUSTOMER` (ownership verified via `req.user.customerId`) |
| **Resume** | `POST` | `/api/v1/portal/subscriptions/:id/resume` | None (`{}`) | `{ data: Subscription }` | `CUSTOMER` (ownership verified via `req.user.customerId`) |
| **Renew** | `POST` | `/api/v1/portal/subscriptions/:id/renew` | None (`{}`) | `{ data: Subscription }` | `CUSTOMER` (ownership verified via `req.user.customerId`) |
| **Close Early** | `POST` | `/api/v1/portal/subscriptions/:id/close` | None (`{}`) | `{ data: Subscription }` | `CUSTOMER` (ownership verified via `req.user.customerId`) |

> Note: All 4 endpoints return HTTP `404` if the subscription belongs to another customer (Anti-IDOR).
> If plan flag `allowPause`, `allowRenew`, or `allowEarlyClose` is `false`, the API rejects with `403 FORBIDDEN` (`Plan does not allow...`).

#### B. Staff / Admin Management (`apps/api/src/routes/subscriptionRoutes.ts`)
Base URL prefix: `/api/v1/subscriptions`

| Action | Method | Path | Request Body | Response Shape | Authorized Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pause** | `POST` | `/api/v1/subscriptions/:id/pause` | None | `{ data: Subscription }` | `STAFF`, `ADMIN` |
| **Resume** | `POST` | `/api/v1/subscriptions/:id/resume` | None | `{ data: Subscription }` | `STAFF`, `ADMIN` |
| **Renew** | `POST` | `/api/v1/subscriptions/:id/renew` | None | `{ data: Subscription }` | `STAFF`, `ADMIN` |
| **Transition / Close** | `POST` | `/api/v1/subscriptions/:id/transition` | `{ "to": "CLOSED" }` | `{ data: Subscription }` | `STAFF`, `ADMIN` |

---

### 2. How "Paused" is Represented
- In `schema.prisma` and `Subscription`:
  - It is represented as a **boolean flag**: `isPaused: Boolean` (default: `false`).
  - The `SubscriptionStatus` enum does **not** have a `PAUSED` value (valid statuses are `DRAFT`, `QUOTATION`, `CONFIRMED`, `ACTIVE`, `CLOSED`).
  - Subscriptions remain in `status === 'ACTIVE'` while paused.
  - In frontend models (`apps/web/src/types/index.ts`): `subscription.isPaused: boolean`.

---

### 3. Exact Plan Flag Names & Nesting
Defined on `Plan` (`schema.prisma` & `apps/web/src/types/index.ts`):
- `subscription.plan.allowPause`: `boolean` (Default: `false`)
- `subscription.plan.allowEarlyClose`: `boolean` (Default: `false`)
- `subscription.plan.allowRenew`: `boolean` (Default: `false`)
- `subscription.plan.autoClose`: `boolean` (Default: `false`)

---

### 4. Portal Dashboard Endpoint Response
- Endpoint: `GET /api/v1/portal/subscriptions`
- Controller: `portalRoutes.ts` -> `SubscriptionService.listSubscriptions({ customerId, page: 1, pageSize: 50 })`
- Response Payload Structure:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "number": "SUB-000001",
        "customerId": "uuid",
        "planId": "uuid",
        "status": "ACTIVE",
        "isPaused": false,
        "startDate": "2026-10-31T00:00:00.000Z",
        "expiryDate": "2027-10-31T00:00:00.000Z",
        "nextInvoiceDate": "2026-11-30T00:00:00.000Z",
        "customer": { "id": "...", "name": "Acme Corp", ... },
        "plan": {
          "id": "...",
          "name": "Yearly Pro",
          "price": 999900,
          "billingPeriod": "YEARLY",
          "minQuantity": 1,
          "autoClose": false,
          "allowEarlyClose": true,
          "allowPause": true,
          "allowRenew": true,
          "isActive": true
        },
        "lines": [...]
      }
    ],
    "pagination": { "page": 1, "pageSize": 50, "total": 1, "totalPages": 1 }
  }
  ```
- **Yes**, the plan flags (`allowPause`, `allowEarlyClose`, `allowRenew`, `autoClose`) are fully included under `subscription.plan`.

---

### 5. Invoice Detail Endpoint & Response Shape
- Endpoints:
  - Staff / Admin: `GET /api/v1/invoices/:id`
  - Customer Portal: `GET /api/v1/portal/invoices/:id`
- Returns: `{ "data": Invoice }`
- Detailed fields returned by `BillingService.getInvoice`:
  - `id`: `string`
  - `number`: `string` (e.g. `INV-000001`)
  - `status`: `'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED'`
  - `issueDate`: ISO string
  - `dueDate`: ISO string
  - `periodStart`: ISO string
  - `periodEnd`: ISO string
  - `subtotal`: `number` (paise)
  - `discountTotal`: `number` (paise)
  - `taxTotal`: `number` (paise)
  - `total`: `number` (paise)
  - `amountPaid`: `number` (paise)
  - `customer`: `{ id, name, email, phone, company, address, taxId }`
  - `subscription`: `{ id, number, startDate, expiryDate, plan: { id, name, billingPeriod, ... } }`
  - `lines`: Array of `InvoiceLine`:
    - `description`: `string`
    - `quantity`: `number`
    - `unitPrice`: `number` (paise)
    - `discountAmount`: `number` (paise)
    - `taxName`: `string | null`
    - `taxRate`: `number | null` (e.g. `18` for 18%)
    - `taxAmount`: `number` (paise)
    - `amount`: `number` (paise)
  - `payments`: Array of `Payment`:
    - `id`, `method`, `amount` (paise), `paidAt`, `note`, `recordedBy: { id, email }`
  - `discountUses`: Array of applied discounts

---

### 6. List Endpoints Query Parameters
Validated in `apps/api/src/validators/subscription.ts` via `listQuerySchema`:

| Endpoint | Supported Query Parameters | Handled in Backend Query |
| :--- | :--- | :--- |
| `GET /api/v1/invoices` | `page`, `pageSize`, `customerId`, `subscriptionId`, `status`, `q` | `q` searches `number` (case-insensitive) or `customer.name` (case-insensitive) |
| `GET /api/v1/subscriptions` | `page`, `pageSize`, `customerId`, `status`, `planId`, `q` | `q` searches `number`, `customer.name`, or `customer.company` |
| `GET /api/v1/portal/subscriptions` | `page`, `pageSize` | Scoped to authenticated customer |
| `GET /api/v1/portal/invoices` | `page`, `pageSize` | Scoped to authenticated customer |

Both return: `{ "items": [...], "pagination": { "page", "pageSize", "total", "totalPages" } }`.

---

### 7. Export Endpoints Status
- Endpoint `GET /api/v1/reports/export/invoices`: **NOT FOUND** (Dev 1 dependency, expected by 2:00 PM).
- Endpoint `GET /api/v1/reports/export/overdue`: **NOT FOUND** (Dev 1 dependency, expected by 2:00 PM).
- Available report endpoints in `reportRoutes.ts`:
  - `GET /api/v1/reports/summary`
  - `GET /api/v1/reports/revenue-series`
  - `GET /api/v1/reports/overdue`

---

### 8. Existing Web Client Infrastructure
- **API Client**: `apps/web/src/lib/api.ts`
  - Pre-configured `axios` instance with `baseURL: '/api/v1'`, `withCredentials: true`.
  - Vite proxy routes `/api` to `http://127.0.0.1:5000`.
- **Toast Library**: **NOT FOUND** (Will install `sonner` in Hour 4).
- **Auth Context Hook**: `apps/web/src/context/AuthContext.tsx`
  - Exposes `useAuth()` hook with `{ user, isLoading, isAdmin, isStaff, isCustomer, login, logout }`.
- **Router Configuration**: `apps/web/src/App.tsx`
  - Routes defined via `react-router-dom`:
    - `/` -> `RootRedirect` (Dashboard for staff/admin, `/portal` for customers)
    - `/subscriptions`, `/subscriptions/:id`
    - `/invoices`, `/invoices/:id`
    - `/payments`, `/products`, `/plans`, `/taxes-discounts`, `/templates`, `/customers`, `/staff`
    - `/portal`, `/portal/invoices`

---

### 9. File Existence Check
- `apps/web/src/pages/invoices/InvoiceDetailPage.tsx`: **EXISTS** (489 lines)
- `apps/web/src/components/common/`: **EXISTS** (`Badge.tsx`, `Modal.tsx`, `StatsCard.tsx`)
- `apps/web/src/lib/`: **EXISTS** (`api.ts`)
- `apps/web/src/types/`: **EXISTS** (`index.ts`)
