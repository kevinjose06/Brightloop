# 🚀 Brightloop — Enterprise Subscription Lifecycle & Billing Management

> **Make Attempt Hackathon — Selection Round**  
> A production-grade B2B SaaS subscription lifecycle and automated recurring billing engine with atomic discount limits, priority tax calculation, paise-precision accounting, and sub-2-second financial analytics. **100% native Node.js & TypeScript — No Docker required.**

---

## 🌟 Key Highlights & Engineering Features

- **Paise Minor Unit Accounting**: Zero floating-point drift. All prices, lines, taxes, and discounts stored as 64-bit integer paise.
- **Idempotent Billing Engine**: Double billing is mathematically prevented via compound unique database constraints (`@@unique([subscriptionId, periodStart])`). Catch-up logic recovers missed cycles seamlessly.
- **Atomic Discount Claiming**: Prevents discount over-redemption under high concurrency with atomic decrement SQL locks.
- **Hierarchical Priority Tax System**: Automated tax determination matching product types with priority fallback.
- **Strict State Machines**: Subscription (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`) and Invoice (`DRAFT` → `CONFIRMED` → `PAID` / `CANCELLED`) with strict transition validations (illegal moves yield `409 INVALID_TRANSITION`).
- **Sub-2-Second Finance Aggregates**: SQL aggregates, composite indexing, and in-memory summary caching ensure analytics load under 2 seconds across 5,000+ subscriptions.
- **Server-Enforced Anti-IDOR**: Customer portal queries strictly scope access to the authenticated user's `customerId` server-side.
- **Enterprise UI**: Built according to specification with Indigo primary (`#4F46E5`), slate neutrals, Inter font, responsive data tables, live password security validation checklist, and printable invoices.

---

## 👥 Demo Accounts (Seed Ready)

All demo accounts share the password: **`Password123!`** (meets the 9+ character upper/lower/special policy).

| Role | Email | Capabilities |
| --- | --- | --- |
| **Admin** | `admin@brightloop.test` | Full platform control: catalog, variants, plans, tax rules, discounts, and staff provisioning |
| **Staff** | `staff@brightloop.test` | Operational workflow: customer onboarding, quotations, subscriptions, billing engine runs, invoices, payment records |
| **Customer** | `customer@acme.test` | Self-service portal: view own contracts, invoice printing, pause/renew based on plan flags |

*Quick-fill buttons are provided on the login page for instant role switching during hackathon evaluations.*

---

## 🛠️ Tech Stack Architecture

```
Browser (React + Vite + Tailwind + TanStack Query)
                   │
              HTTPS / REST
                   ▼
Express API (TypeScript + Zod + Helmet + Pino + JWT + Swagger)
                   │
         Prisma ORM (ACID Transactions)
                   ▼
PostgreSQL 16 ◀──── Background Worker (node-cron billing runs)
(Cloud Neon / Supabase or Local Postgres)
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, TanStack Query, React Router v7.
- **Backend API**: Node.js v24, Express, TypeScript, Zod, Helmet, Cookie-Parser, Pino, Swagger UI.
- **Database & ORM**: PostgreSQL 16 (hosted on Neon/Supabase or local), Prisma Client.
- **Worker**: Standalone background process evaluating due subscriptions and auto-closing expired contracts.
- **Testing**: Vitest suite covering password security rules, period calculations, overpayment rejection, and state machines.

---

## 🚀 Team Setup Guide (No Docker Needed!)

The easiest way for your entire 4-person team to work together is using a **free shared cloud PostgreSQL database** (e.g. Neon or Supabase). Nobody needs to install or configure any database engine locally!

### 1. Database Setup (Takes 60 seconds)

1. Go to **[https://neon.tech](https://neon.tech)** (or [Supabase](https://supabase.com)) and sign up for free.
2. Click **Create Project** (name it `brightloop-db`).
3. Copy your connection string. It looks like:
   ```
   postgresql://username:password@ep-cool-flower-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Paste this connection string into [`.env`](file:///d:/Projects/Maketon-online/Brightloop/.env) as `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://username:password@ep-cool-flower-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
> 💡 **Team Tip**: All 4 teammates can put the **exact same** `DATABASE_URL` in their `.env` file. You will all share the same live database instantly with zero local database software!

---

### 2. Run Database Migrations & Seed Demo Data

Once your `DATABASE_URL` is set:

```powershell
# 1. Push schema tables to PostgreSQL
npm run prisma:migrate --workspace=apps/api

# 2. Seed demo accounts, catalog (CRM with Odoo +₹560 variant), plans, taxes, discounts, and subscriptions
npm run prisma:seed --workspace=apps/api
```

*(Optional) High-Scale Benchmark Seed (5,000 subscriptions, 20,000 invoices, 15,000 payments):*
```powershell
npm run prisma:benchmark --workspace=apps/api
```

---

### 3. Start Development Servers

Open two terminal windows:

```powershell
# Terminal 1: Run Express REST API (port 5000)
npm run dev:api

# Terminal 2: Run React Vite SPA (port 5173)
npm run dev:web

# Terminal 3 (Optional): Run background cron worker
npm run dev:worker
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

- **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **REST API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check**: [http://localhost:5000/healthz](http://localhost:5000/healthz)

---

## 🧪 Running Automated Tests

Run the Vitest test suite to verify security rules, password validation regex, state transitions, and idempotency logic:

```powershell
npm test
```

---

## 📁 Repository Structure

```
├── apps/
│   ├── api/             # Express TypeScript REST API
│   │   ├── prisma/      # Prisma schema, migrations, seed, benchmark scripts
│   │   └── src/
│   │       ├── lib/     # Prisma client, logger, AppError, nodemailer
│   │       ├── middleware/ # JWT auth, RBAC, error handler
│   │       ├── routes/  # Auth, catalog, subscriptions, billing, reports, portal
│   │       ├── services/# Billing engine, subscription lifecycle, payments, reports
│   │       ├── validators/ # Zod request validation schemas
│   │       └── tests/   # Vitest automated test suites
│   ├── web/             # React + Vite + Tailwind CSS SPA
│   │   └── src/
│   │       ├── components/ # AppLayout, Sidebar, Header, Modal, Badges, KPI Cards
│   │       ├── context/ # AuthContext (session & role management)
│   │       ├── pages/   # Dashboard, Subscriptions, Invoices, Products, Plans, Portal
│   │       └── lib/     # Axios client and currency formatting
│   └── worker/          # Background cron worker process
├── docs/
│   ├── ARCHITECTURE.md  # Detailed system architecture, locking, and diagrams
│   ├── API.md           # REST API specification and error codes
│   ├── PERFORMANCE.md   # SQL aggregates, indexing, and < 2s proof
│   ├── SECURITY.md      # Password policy, anti-IDOR, and token security
│   └── DEMO.md          # 3-minute hackathon video walkthrough script
├── .env.example         # Environment template
└── README.md
```

---

## 📜 3-Minute Hackathon Demo Script Summary

1. **Architecture & Problem**: Decoupled React + Express + Postgres architecture (`docs/ARCHITECTURE.md`).
2. **Customer Signup**: Live password validation checklist (9+ chars, upper, lower, special).
3. **Admin Catalog**: Brightloop CRM with **Odoo brand variant (+₹560)**, plan behaviour toggles, and tax/discount rules.
4. **Staff Workflow**: Create proposal from template → Quotation → Confirmed → Active contract.
5. **Billing Engine**: Click **Run Billing Now** modal → Invoice generated with auto-applied discount and tax. Click again to show **zero duplicate invoices generated** (Idempotency guarantee).
6. **Payment Recording**: Overpayment prevention → partial payment → full payment flipping invoice to `PAID` → Print invoice view.
7. **Finance Dashboard**: 5 KPI cards, revenue chart, overdue alerts, and `< 50ms` query response time proof.
