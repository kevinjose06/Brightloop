# Brightloop

Enterprise subscription lifecycle and recurring billing management platform built with Node.js, Express, TypeScript, React, and PostgreSQL.

Brightloop provides an automated, idempotent billing engine, strict subscription state management, atomic discount controls, hierarchical tax calculation, and server-enforced access controls.

---

## Architectural Highlights

- **Integer Minor Unit Accounting**: Eliminates floating-point rounding errors by storing all monetary amounts as 64-bit integers in paise.
- **Idempotent Billing Runs**: Double billing is prevented at the database level via compound unique constraints (`[subscriptionId, periodStart]`), safely supporting batch retries and scheduled catch-up runs.
- **Atomic Discount Redemptions**: Concurrency-safe decrement locks prevent discount code over-redemption under parallel invoice generation cycles.
- **Deterministic Tax Computation**: Priority-based tax resolution matching product types with automatic fallback to global defaults.
- **Finite State Machine Enforcement**: Strict transitions for Subscriptions (`DRAFT` -> `QUOTATION` -> `CONFIRMED` -> `ACTIVE` -> `CLOSED`) and Invoices (`DRAFT` -> `CONFIRMED` -> `PAID` / `CANCELLED`), rejecting invalid state changes with standard HTTP 409 conflicts.
- **Server-Enforced Access Control (Anti-IDOR)**: Customer portal operations are strictly scoped to the authenticated customer ID on the backend, irrespective of client-supplied payloads.
- **Sub-Second Financial Aggregations**: Optimized SQL group aggregations and index coverage across subscriptions, invoices, and payments for rapid metrics reporting.

---

## Tech Stack

- **Backend API**: Node.js v20+, Express, TypeScript, Zod, Helmet, Pino, JWT
- **Database & ORM**: PostgreSQL (Supabase / Neon / Local), Prisma ORM
- **Frontend SPA**: React 18, Vite, Tailwind CSS, TanStack Query, React Router v7
- **Test Harness**: Vitest, Supertest

---

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Accessible PostgreSQL database instance (local or hosted via Supabase/Neon)

---

## Environment Configuration

Copy the example environment configuration into `.env` at the repository root and inside `backend/.env`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

Ensure the following variables are defined:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars"
```

---

## Installation and Quickstart

### 1. Install Dependencies

Install workspace dependencies from the project root:

```bash
npm install
```

### 2. Generate Prisma Client & Run Migrations

Deploy schema migrations to your PostgreSQL database:

```bash
npm run prisma:push --workspace=backend
```

### 3. Seed Initial Catalog and Test Accounts

Populate the database with default roles, products, variants, pricing plans, tax rules, and initial contracts:

```bash
npm run prisma:seed --workspace=backend
```

### 4. Run Development Environment

Start both the REST API and the React frontend concurrently:

```bash
npm run dev
```

Alternatively, services can be launched in dedicated terminals:

```bash
# Terminal 1: Express REST API (Port 5000)
npm run dev:backend

# Terminal 2: React Vite SPA (Port 5173)
npm run dev:frontend
```

- Web Client: `http://localhost:5173`
- REST API Server: `http://localhost:5000`
- Interactive Swagger Documentation: `http://localhost:5000/api/docs`
- Service Health Check: `http://localhost:5000/healthz`

---

## Demo Accounts

The database seed provides preconfigured accounts across all supported role tiers. All accounts use the standard test password: `Password123!`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Admin** | `admin@brightloop.test` | Full administrative access: product catalog, variant pricing, billing plans, tax rules, discount policies, and internal staff management. |
| **Staff** | `staff@brightloop.test` | Operational management: customer records, quotation generation, subscription lifecycle controls, manual billing runs, and payment receipts. |
| **Customer** | `customer@acme.test` | Customer portal self-service: contract tracking, invoice history, printable statements, and plan-permitted pause or renewal actions. |

---

## System Architecture

```
+-------------------------------------------------------+
|                React Vite Web Frontend                |
+-------------------------------------------------------+
                           |
                     HTTPS / JSON
                           v
+-------------------------------------------------------+
|                  Express API Gateway                  |
|  - Auth & RBAC Middleware                             |
|  - Request Validation (Zod)                           |
|  - Service Layer (Billing, Lifecycle, Reports)        |
+-------------------------------------------------------+
                           |
                      Prisma ORM
                           v
+-------------------------------------------------------+
|                  PostgreSQL Database                  |
|  - Compound Unique Constraints                        |
|  - Foreign Key Relationships                          |
|  - Indexed Timestamp & Status Queries                 |
+-------------------------------------------------------+
```

---

## Key Domain Logic

### Subscription State Transition
```
[DRAFT] ---> [QUOTATION] ---> [CONFIRMED] ---> [ACTIVE] ---> [CLOSED]
```
- Activation computes the initial `nextInvoiceDate` based on contract start date.
- Pausing, early termination, and renewals are gated by plan-level configuration flags (`allowPause`, `allowEarlyClose`, `allowRenew`).

### Invoice Generation & Payment Reconciliation
```
[DRAFT] ---> [CONFIRMED] ---> [PAID]
   |              |
   +-----> [CANCELLED] (Allowed only if balance remains unpaid)
```
- Periodic billing runs aggregate line items, evaluate eligible discount vouchers, and calculate line taxes.
- Payments record against confirmed invoices with overpayment validation (`amountPaid + payment <= totalAmount`).

---

## Test Suite

Run the automated test suite to validate authentication rules, role access control, state machine transitions, and billing idempotency:

```bash
npm test
```

---

## Repository Layout

```
├── backend/                     # Express REST API & billing engine
│   ├── prisma/                  # Database schema, migrations, and seed scripts
│   ├── render.yaml              # Render cloud deployment blueprint
│   ├── Procfile                 # Standard process launcher (web & worker)
│   └── src/
│       ├── lib/                 # Database client, logger, and utility libraries
│       ├── middleware/          # Authentication, RBAC, and error handling
│       ├── routes/              # REST route handlers
│       ├── services/            # Business logic and domain engines
│       ├── validators/          # Zod request validation schemas
│       ├── tests/               # Vitest integration and unit tests
│       └── worker.ts            # Scheduled cron maintenance & auto-close worker
├── frontend/                    # React Vite Single Page Application
│   ├── vercel.json              # Vercel SPA routing and proxy rules
│   └── src/
│       ├── components/          # UI components, layouts, and data views
│       ├── context/             # AuthContext and global application state
│       ├── pages/               # Admin dashboard and portal pages
│       └── lib/                 # HTTP client and formatting utilities
├── docs/
│   ├── ARCHITECTURE.md          # Architectural decisions and design trade-offs
│   ├── API.md                   # Endpoint specifications and error envelopes
│   ├── PERFORMANCE.md           # Query aggregation benchmarks and index analysis
│   ├── SECURITY.md              # Security model, cryptographic policies, and IDOR protection
│   └── DEMO.md                  # System evaluation walkthrough
├── .env.example                 # Environment configuration template
└── README.md                    # Primary repository documentation
```

---

## Documentation Links

- [System Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Security Model](docs/SECURITY.md)
- [Performance Benchmarks](docs/PERFORMANCE.md)
- [Demo Walkthrough](docs/DEMO.md)
