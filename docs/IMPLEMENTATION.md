# Brightloop: Dev 2 Implementation Plan (Frontend and Docs)

> **Audience:** Antigravity (an AI coding agent inside the IDE) and Dev 2.
> **Window:** 12:00 PM to 5:00 PM, coding freeze at 5:00 PM.
> **Scope owner:** Dev 2 owns `apps/web/**` and `docs/DEMO.md`, `docs/SLIDES.md`. Dev 1 owns `apps/api/**`, `apps/worker/**`, `prisma/**`, `README.md`, `docs/PERFORMANCE.md`.

---

## 0. How to use this file with Antigravity

1. Open the repo root `Brightloop/` as the workspace and keep this file at `docs/IMPLEMENTATION.md` (or the root) so the agent can reference it.
2. Work **one hour-section at a time**. Do not ask the agent to "do everything".
3. For each hour, use this loop:
   1. Ask the agent to **read** the section and the listed files, then **write a short plan** (no code yet). Review it.
   2. Approve, and let it implement.
   3. Ask it to run the **verification commands** and walk the **acceptance checklist**.
   4. You (the human) run the **manual test script** in the browser.
   5. Commit with the exact message given.
4. Ready-made prompts for each hour are in **Section 15**.
5. If the agent proposes touching anything outside your scope (see Section 2), say no and tell Dev 1 instead.

---

## 1. Project context (read before coding)

**Product:** Brightloop Subscription Management. A mini ERP (business management software) for recurring revenue: products and variants, plans, quotations, subscriptions, automatic invoices, discounts, tax, payments, MRR/ARR dashboard, and a customer portal.

**Roles (RBAC, role-based access control):** `ADMIN`, `STAFF`, `CUSTOMER`. A customer must never see another customer's data.

**Subscription lifecycle:** `DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED`. Pause and renewal are controlled by plan flags.

**Invoice lifecycle:** `DRAFT -> CONFIRMED -> PAID` (also `CANCELLED`, and `OVERDUE` as a derived state; confirm in the API).

**Stack:**

| Layer | Tech |
|---|---|
| Web (`apps/web`) | React 18, Vite, Tailwind CSS, TanStack Query, React Router v7, Lucide icons |
| API (`apps/api`) | Express 4, TypeScript, Zod, Prisma, JWT in HTTP-only cookies, Swagger at `/api/docs` |
| Worker (`apps/worker`) | `node-cron` billing and auto-close |
| DB | PostgreSQL (Supabase) |

**Ports:** API `http://localhost:5000`, Web `http://localhost:5173`.

**Known domain map (from the status report):**

| Domain | Backend | Frontend |
|---|---|---|
| Staff and users | `authRoutes.ts`, `authService.ts` | `StaffPage.tsx` |
| Discounts and taxes | `catalogRoutes.ts`, `catalogService.ts` | `TaxesDiscountsPage.tsx` |
| Billing and invoices | `billingRoutes.ts`, `billingService.ts` | `InvoicesPage.tsx` |
| Customer portal | `/api/portal` | `PortalDashboardPage.tsx` |

> **File-name mismatch warning.** The schedule says `CustomerPortalPage.tsx` and `InvoiceDetailPage.tsx`. The status report lists `PortalDashboardPage.tsx` and **no invoice detail page**. Always run `git ls-files apps/web/src` and use what really exists. Never create a duplicate of an existing page.

---

## 2. Ownership and boundaries

| Path | Dev 2 may edit? |
|---|---|
| `apps/web/**` | Yes |
| `docs/DEMO.md`, `docs/SLIDES.md` | Yes |
| `apps/api/**`, `apps/worker/**`, `apps/api/prisma/**` | **No.** Request changes from Dev 1 (Section 14) |
| `README.md`, `docs/PERFORMANCE.md` | **No** (Dev 1) |
| `package.json` (root) | Only to add a web dependency via `npm install <pkg> -w apps/web`; never hand-edit scripts |
| `.env`, secrets | Never commit |

---

## 3. Global engineering rules (apply to every task)

### 3.1 Money
- The API stores money as **integer paise** (1 rupee = 100 paise). **Never** do float math on money.
- Create one helper `apps/web/src/lib/money.ts` and use it everywhere. No inline `toFixed`, no hand-written comma logic.

```ts
// apps/web/src/lib/money.ts
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** paise (integer) -> "₹1,25,000.00" */
export function formatPaise(paise: number | null | undefined): string {
  if (paise == null || Number.isNaN(paise)) return '—';
  return inr.format(paise / 100);
}

/** user-typed rupees -> integer paise, rounding safely */
export function rupeesToPaise(rupees: string | number): number {
  const n = typeof rupees === 'string' ? Number(rupees.replace(/,/g, '')) : rupees;
  return Math.round(n * 100);
}
```

### 3.2 Dates
- Display as `31 Oct 2026` via `Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })`. Put it in `lib/date.ts`.
- Treat API dates as ISO strings (text like `2026-10-31T00:00:00Z`).

### 3.3 Networking and auth
- Login uses an **HTTP-only cookie** (JavaScript cannot read it). Every `fetch` must use `credentials: 'include'`.
- Use the **existing** API client in `apps/web/src/lib` (find it; likely axios or a fetch wrapper). Do not create a second client. If none exists, create `lib/api.ts` once and reuse.
- Prefer relative URLs (`/api/...`) so the Vite proxy handles CORS (cross-origin rules). Check `vite.config.ts`.
- **Never guess endpoint paths.** Read them from Swagger (`/api/docs`) or `apps/api/src/routes/*.ts`. Write them in `docs/DEV2_ENDPOINTS.md` (scratch note) before coding.

### 3.3.1 TanStack Query conventions
- Query keys are arrays: `['subscriptions', id]`, `['invoices', { status, q, page }]`, `['portal', 'dashboard']`.
- Mutations (requests that change data) call `queryClient.invalidateQueries({ queryKey: [...] })` on success.
- Always handle `isPending`, `isError`, and empty data in the UI.

### 3.4 Error handling
- Show the **server's message** when present (`error.response?.data?.message` or equivalent). Fallback: "Something went wrong. Please try again."
- Never swallow errors silently and never use `alert()`.

### 3.5 Accessibility and quality
- Every input has a visible `<label>`. Buttons that only have an icon need `aria-label`.
- Visible keyboard focus ring (`focus-visible:ring-2 ring-indigo-700`).
- Confirm dialogs trap focus and close on `Esc`.
- No `any` in TypeScript unless commented why. Types for API data live in `apps/web/src/types/`.

### 3.6 Content rules (professional, no fake claims)
- **No invented features or certifications** (no "SOC2", "99.99% SLA", "e-way bills", etc.). Only show what the product really does.
- No emojis, gradients, glow effects, decorative illustrations, or lorem ipsum.
- Copy is short, plain and specific ("Subscription paused", not "Awesome! You did it!").

---

## 4. Design tokens (single source of truth)

Add to `tailwind.config.*` under `theme.extend.colors` (names are suggestions; reuse existing ones if already defined):

| Token | Value | Use |
|---|---|---|
| `navy` | `#0F172A` | Sidebar, customer portal top nav, auth right panel. Always flat |
| `indigo-700` (primary) | `#3730A3` | Primary buttons, active nav item, selected pill |
| `teal-700` | `#0F766E` | Positive or secondary highlights only |
| `page` | `#F8FAFC` | Page background |
| `border` | `#E2E8F0` | 1px borders |
| `on-navy-muted` | `#CBD5E1` | Text and icons on navy |

**Status badges (use one shared `<StatusBadge status="..."/>` component):**

| Status | Color |
|---|---|
| Active, Paid | green |
| Draft, Pending, Paused | amber |
| Overdue, Cancelled | red |
| Confirmed, Quotation | blue |
| Closed | gray |

**Forbidden:** brown or any tertiary color, red as a decoration (red only for Overdue, Cancelled, destructive actions).

**Component conventions:** 8px radius, 8px spacing grid, Inter font, page title 24px semibold, body 14px, table text 13px.

---

## 5. Step 0: Setup and discovery (before 12:00 PM, about 20 minutes)

The status report shows nothing runs yet. Do this first or Hour 1 is lost.

### 5.1 Commands
```powershell
cd C:\Users\angel\OneDrive\Documents\BrightLoop\Brightloop
git checkout main
git pull origin main
npm install
copy .env.example .env
```
- **Ask Dev 1 for the shared `DATABASE_URL` and `DIRECT_URL`.** Use the same database so data matches. Do not create a second one.
- Only **one** person runs migrate and seed on the shared DB (agree with Dev 1):
```powershell
npm run prisma:migrate
npm run prisma:seed
```
- Start everything:
```powershell
npm run dev
```
- If Prisma complains about a missing client: `npx prisma generate` (from the API workspace).

### 5.2 Discovery checklist (agent can do this read-only)
Produce `docs/DEV2_ENDPOINTS.md` with answers to:

1. Exact **pause, resume, renew, close-early** endpoints (method, path, body, response, who may call them). Check `/api/docs`, `subscriptionRoutes.ts` (or the file that handles `/api/subscriptions`) and `/api/portal`.
2. How is "paused" represented? A status value, or a flag/date such as `pausedAt`/`isPaused`? (The lifecycle enum has no PAUSED, so it is probably a flag.)
3. Exact plan flag names: `allowPause`, `allowEarlyClose`, `allowRenew` (confirm spelling and nesting, for example `subscription.plan.allowPause`).
4. What the portal dashboard endpoint returns (does it include the plan flags?).
5. Invoice detail endpoint and response shape: lines, tax breakdown, customer, period, amounts, due date.
6. Do list endpoints accept `q` (search), `status`, `page`, `pageSize`? Which names?
7. Does `/api/reports/export/invoices` exist yet (Dev 1, due 2:00 PM)?
8. The existing API client file, toast library (if any), auth context hook (how to get the current user and role), and the route table (`App.tsx` or `routes.tsx`).
9. Which of these files exist: `InvoiceDetailPage.tsx`, `components/common/`, `lib/`, `types/`.

Command to help: `git ls-files apps/web/src`.

### 5.3 Done when
- `http://localhost:5173` loads, login works with `customer@acme.test` and `admin@brightloop.test` (credentials from Dev 1's seed).
- `docs/DEV2_ENDPOINTS.md` exists and every "Section 6 to 10" task has a real endpoint written down.

---

## 6. Git workflow

- One branch per hour: `feat/portal-actions`, `feat/print-invoice`, `feat/csv-filters`, `polish/ux`, `docs/demo`.
- Before each push: `git pull --rebase origin main`, then `npm run build -w apps/web` (or the repo's build script) to catch type errors.
- Merge into `main` at each commit target (1:00, 2:00, 3:00, 4:00, 5:00).
- Commit messages (exact):

| Hour | Message |
|---|---|
| 1 | `feat(web): enable self-service pause, resume, and renew in customer portal` |
| 2 | `feat(web): add professional printable invoice layout and print styles` |
| 3 | `feat(web): add CSV export triggers and list search filters` |
| 4 | `polish(web): enhance toast notifications, form validation, and empty states` |
| 5 | `docs: finalize 3-minute hackathon video recording script and demo cues` |

- Conflict rule: if the same file changed on `main`, **keep both changes**, re-run the app, and never force-push.

---

## 7. Hour 1 (12:00 to 1:00): Portal self-service actions

**Goal:** A logged-in customer can Pause, Resume, Renew or Close early their own subscription, only when the plan allows it. The screen updates without a page refresh.

**Files (confirm real names in Step 0):**
- `apps/web/src/pages/portal/PortalDashboardPage.tsx` (the schedule calls it `CustomerPortalPage.tsx`)
- `apps/web/src/components/subscriptions/SubscriptionActions.tsx` (new)
- `apps/web/src/components/subscriptions/ConfirmDialog.tsx` (new, or reuse one in `components/common/`)
- `apps/web/src/hooks/useSubscriptionActions.ts` (new)
- `apps/web/src/types/subscription.ts` (extend if needed)

### 7.1 Visibility matrix

| Button | Show when | Style | Confirm dialog? |
|---|---|---|---|
| Pause | status `ACTIVE`, not paused, `plan.allowPause` | secondary | Yes |
| Resume | subscription is currently paused | primary | No |
| Renew | `plan.allowRenew` and status `ACTIVE` (or near expiry; use the server's rule if it exposes one) | primary | Yes |
| Close early | `plan.allowEarlyClose` and status `ACTIVE` | red text button | Yes, with warning copy |

Rules:
- If no button applies, render nothing (not an empty box).
- Buttons for non-allowed actions are **hidden**, not disabled, except when the reason helps ("Pausing isn't available on this plan" tooltip). Prefer hidden.
- `CLOSED`, `DRAFT`, `QUOTATION`, `CONFIRMED` subscriptions show no actions.

### 7.2 Component contract

```tsx
// SubscriptionActions.tsx (template; adapt types to the real API shape)
type Props = { subscription: Subscription };

export function SubscriptionActions({ subscription }: Props) {
  const { plan } = subscription;
  const isActive = subscription.status === 'ACTIVE';
  const isPaused = Boolean(subscription.pausedAt); // replace with the real field from Step 0

  const actions = useSubscriptionActions(subscription.id);

  const canPause = isActive && !isPaused && plan.allowPause;
  const canResume = isPaused;
  const canRenew = isActive && plan.allowRenew;
  const canClose = isActive && plan.allowEarlyClose;

  if (!canPause && !canResume && !canRenew && !canClose) return null;

  // render buttons; each button:
  //  - disabled while ANY mutation for this subscription is pending
  //  - shows a spinner on the one that is running
  //  - opens <ConfirmDialog> for pause, renew, close
}
```

```ts
// hooks/useSubscriptionActions.ts (template)
export function useSubscriptionActions(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['portal'] });
    qc.invalidateQueries({ queryKey: ['subscriptions'] });
  };
  const make = (path: string, successMsg: string) =>
    useMutation({
      mutationFn: () => api.post(path),   // use the real method and path from DEV2_ENDPOINTS.md
      onSuccess: () => { toast.success(successMsg); invalidate(); },
      onError: (e) => toast.error(getErrorMessage(e)),
    });

  return {
    pause: make(`...`, 'Subscription paused'),
    resume: make(`...`, 'Subscription resumed'),
    renew: make(`...`, 'Subscription renewed'),
    close: make(`...`, 'Subscription closed'),
  };
}
```
> Calling hooks inside a helper like `make` is acceptable only if it is called unconditionally in the same order on every render. If lint complains, write four explicit `useMutation` calls.

### 7.3 UX requirements
- Disable all action buttons while one request runs (prevents double clicks and duplicate requests).
- Spinner (Lucide `Loader2` with `animate-spin`) on the active button.
- Confirm dialog copy examples:
  - Pause: "Pause this subscription? Billing stops until you resume."
  - Renew: "Renew for another period? A new billing cycle starts."
  - Close early: "Close this subscription now? This cannot be undone." (red confirm button)
- On error, show the server message in a toast and keep the dialog state consistent.
- Show the current status with `<StatusBadge>`, plus expiry date and next billing date, near the buttons.

### 7.4 Security note
Hiding a button is **not** security. The server must reject forbidden actions (Dev 1's anti-IDOR work; IDOR means changing someone else's data by editing an ID). Dev 2 must **test** this:
1. Log in as `customer@acme.test`.
2. Open browser DevTools, Network tab, copy the pause request, and replay it with another customer's subscription ID, and with a plan where `allowPause = false`.
3. Expect a `403` or `404`. If it succeeds, **report to Dev 1 immediately** with the request details.

### 7.5 Acceptance checklist
- [ ] Each button appears or disappears correctly for each of the four plan flags (test with at least 3 seeded plans).
- [ ] No buttons on `CLOSED` or non-active subscriptions.
- [ ] Status and dates update after each action without reloading.
- [ ] Pause, renew and close show a confirm dialog; Esc cancels.
- [ ] Double-clicking does not send two requests (check Network tab).
- [ ] Server errors are visible in a toast.
- [ ] Mobile width (375px): buttons wrap, nothing overflows.

### 7.6 Verification
```powershell
npm run build -w apps/web
npm run lint -w apps/web     # if the script exists
```
Commit: `feat(web): enable self-service pause, resume, and renew in customer portal`

---

## 8. Hour 2 (1:00 to 2:00): Printable invoice

**Goal:** Ctrl+P (or the Print button) produces a clean A4 invoice with no sidebar or buttons.

**Files:**
- `apps/web/src/pages/invoices/InvoiceDetailPage.tsx` (**create if it does not exist**, add 20 minutes to the estimate)
- `apps/web/src/components/invoices/InvoiceSheet.tsx` (new, the printable part)
- `apps/web/src/index.css`
- Router file: add `/invoices/:id` if missing, and make rows in `InvoicesPage.tsx` link to it.

### 8.1 Layout of the invoice sheet (top to bottom)
1. **Header:** "Brightloop Software" and address (use a constant in `src/config/company.ts`; clearly placeholder-but-realistic, not fake legal IDs), invoice number, status badge, issue date, due date.
2. **Bill to:** customer name, email, address (if available).
3. **Reference:** subscription number, billing period (`periodStart` to `periodEnd`).
4. **Line items table:** Description, Qty, Unit price, Amount. Include the variant line (example: "Odoo variant").
5. **Totals block (right aligned):** Subtotal, Discount (if any), **tax breakdown** (use the tax lines the API returns; do not hardcode 18%), Total, Amount paid, **Balance due**.
6. **Payments table (optional, on screen only or compact in print):** date, method, amount.
7. **Footer:** payment terms and "Thank you" in one line.

### 8.2 Screen-only controls (`no-print`)
Top bar actions: **Back**, **Print**, and (for staff and admin) Send, Cancel, Record Payment as they already exist elsewhere. Print calls `window.print()`.

### 8.3 Print CSS (`index.css`)

```css
@media print {
  @page { size: A4; margin: 16mm; }

  html, body { background: #fff !important; color: #000; }

  /* hide app chrome */
  aside, nav, header, footer, .no-print { display: none !important; }

  /* let the sheet use the full page */
  main { margin: 0 !important; padding: 0 !important; }
  .invoice-sheet {
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }      /* repeat header on page 2 */
  tr, td, th { page-break-inside: avoid; }

  /* keep status colors in print */
  .print-color { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```
Also add `print:hidden` (Tailwind print variant) on the sidebar wrapper, top bar and every action button if the layout components accept classes.

### 8.4 Edge cases to test
- Status variants: Draft (show a "DRAFT" label), Confirmed, Paid, Cancelled (show a clear "CANCELLED" mark).
- Long customer names and 15+ line items (page break behavior).
- Zero-tax invoice and discounted invoice.
- Loading and error states (invoice not found shows a plain message and a back link, never a blank page).
- Customer role can open only their **own** invoice (test with a different invoice ID; expect the API error to be handled).

### 8.5 Acceptance checklist
- [ ] Print preview shows only the invoice on A4: no sidebar, no top bar, no buttons.
- [ ] Amounts use `formatPaise` and Indian grouping (₹1,25,000.00).
- [ ] Totals on screen equal totals in the API response (no recomputation drift; display server numbers).
- [ ] All statuses render; page works at 375px width on screen.

Commit: `feat(web): add professional printable invoice layout and print styles`

---

## 9. Hour 3 (2:00 to 3:00): CSV export and quick filters

**Dependency:** Dev 1's `/reports/export/invoices` and `/reports/export/overdue` (due 2:00 PM). At 2:00, message Dev 1: "Are the export endpoints merged?" If not, build the UI against the agreed path and test as soon as they land. Do not wait silently.

**Files:**
- `apps/web/src/lib/download.ts` (new)
- `apps/web/src/hooks/useDebouncedValue.ts` (new)
- `apps/web/src/components/common/StatusPills.tsx`, `SearchInput.tsx` (new)
- `apps/web/src/pages/invoices/InvoicesPage.tsx`
- `apps/web/src/pages/dashboard/DashboardPage.tsx`

### 9.1 Download helper

```ts
// lib/download.ts
export async function downloadFile(url: string, fallbackName: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    let msg = 'Export failed';
    try { msg = (await res.json()).message ?? msg; } catch { /* not json */ }
    throw new Error(msg);
  }
  // honor server filename if present
  const cd = res.headers.get('Content-Disposition');
  const match = cd?.match(/filename="?([^";]+)"?/i);
  const name = match?.[1] ?? fallbackName;

  const blob = await res.blob();           // blob = file-like data in memory
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
```

### 9.2 Export buttons
- Invoices page: "Export CSV" exports the **currently filtered** view (pass the same `status` and `q` as query params if the endpoint supports them; otherwise export all and say so in the tooltip).
- Dashboard Overdue table: "Export CSV" hits `/reports/export/overdue`.
- Button states: idle, loading (spinner, disabled), error (toast).
- Filename pattern: `invoices-2026-10-31.csv`, `overdue-invoices-2026-10-31.csv`.

### 9.3 Search and status pills
- `SearchInput`: debounce **300 ms** (wait until typing stops).
- `StatusPills`: All, Draft, Confirmed, Paid, Overdue (use the real enum values from the API).
- Store filters in the **URL** with `useSearchParams` (`?status=OVERDUE&q=acme&page=1`). A refresh or shared link keeps the filter.
- Changing a filter resets `page` to 1.
- **Server-side filtering** (send `q`, `status`, `page` to the API; the 5,000-subscription benchmark will make browser-side filtering slow). If the API lacks these params, tell Dev 1 right away. Fallback (client-side filtering of the loaded page) only as a last resort and mark it with a `TODO`.
- Use `placeholderData: keepPreviousData` (TanStack Query v5) so the table does not flash empty while typing.
- Show "No invoices match your filters" with a **Clear filters** button.
- Pagination controls: Previous, Next, "Page X of Y" if the API provides totals.

### 9.4 Acceptance checklist
- [ ] CSV downloads in the browser and opens in Excel with correct columns and the ₹ values readable (Dev 1 owns content; you verify).
- [ ] Search plus status combine correctly; refresh keeps them.
- [ ] Typing does not fire one request per keystroke (check Network tab).
- [ ] Export failure shows an error toast and re-enables the button.
- [ ] Customer role cannot reach staff export endpoints (expect `403`; button hidden for customers).

Commit: `feat(web): add CSV export triggers and list search filters`

---

## 10. Hour 4 (3:00 to 4:00): Polish: toasts, validation, empty states

### 10.1 Toasts
- Install one library: `npm install sonner -w apps/web` (skip if the project already has a toast system; Step 0 tells you).
- Mount `<Toaster richColors position="top-right" />` once in the app root.
- Create `lib/toast.ts` with `notifySuccess(msg)`, `notifyError(err)` where `notifyError` extracts the server message.
- Wire to **every** mutation: payment recorded, invoice sent, invoice cancelled, subscription confirmed, paused, resumed, renewed, closed, product or plan saved, staff added, export failed.
- Messages are specific: "Payment of ₹3,000.00 recorded for INV-2026-001".

### 10.2 Form validation
- Use Zod schemas (already in the project) with `react-hook-form` + `@hookform/resolvers/zod` **if already installed**; otherwise validate with Zod manually. Do not add heavy new libraries now.
- Rules:
  - Password: more than 8 characters, uppercase, lowercase, special character. Verify the existing live checklist matches the backend rule exactly ("longer than eight" means at least 9).
  - Email: valid format.
  - Prices, quantities and payment amounts: positive numbers; quantity is an integer and not below the plan's minimum quantity.
  - Payment amount cannot exceed the invoice's balance due.
  - Discount percentage 1 to 100; end date not before start date.
- Show the error **under the field** (text-red-600, 12px) with `aria-invalid` and `aria-describedby`.
- Disable submit while pending and prevent double submit.

### 10.3 Empty, loading and error states
- Create `components/common/EmptyState.tsx`: Lucide icon, one sentence, one action button. **No illustrations.**
- Examples: "No invoices yet. Invoices appear after the first billing run." / "No subscriptions yet. Create a quotation to start."
- Loading: table skeleton rows (gray bars), not a lone spinner.
- Error: message plus **Retry** button.

### 10.4 Consistency pass (checklist for every page)
For each page in `apps/web/src/pages/**`:
- [ ] Navy sidebar (flat `#0F172A`), indigo active item.
- [ ] Primary buttons are indigo; no brown, no stray colors; red only for destructive and overdue.
- [ ] `StatusBadge` used everywhere (no ad-hoc colored spans).
- [ ] Money via `formatPaise`, dates via `lib/date.ts`.
- [ ] Table: sticky header, compact rows, 13px text.
- [ ] Loading, empty and error states exist.
- [ ] Nothing overflows at 375px, 768px and 1280px widths.
- [ ] No fake claims or placeholder text left over from design generation (search for "SOC2", "SLA", "Okta", "e-way", "dunning", "lorem").
- [ ] No leftover `console.log`.

Commit: `polish(web): enhance toast notifications, form validation, and empty states`

---

## 11. Hour 5 (4:00 to 5:00): Demo script and slides (feature freeze at 5:00)

**Start the hour by merging all branches and running the full app once.**

### 11.1 `docs/DEMO.md` (second-by-second)
Use a table: Time, Screen, Say, Click, Fallback.

| Time | Screen | Say | Click | Fallback |
|---|---|---|---|---|
| 0:00 to 0:30 | Problem slide | "Brightloop bills hundreds of customers by hand. It is slow and error-prone." | Slide 1 | n/a |
| 0:30 to 1:00 | Register | "Strong password rules, one account per email." | Show live checklist, register | Use a pre-made account |
| 1:00 to 1:45 | Subscription lifecycle | "A quotation becomes a subscription: Draft to Active." | Create or open a subscription, Confirm, Activate | Pre-seeded subscription |
| 1:45 to 2:30 | Billing run (twice) | "The second run creates no duplicates. This is enforced by a database unique constraint." | Trigger billing, show invoices, trigger again, show same count | Show test output |
| 2:30 to 3:00 | Dashboard and Customer Portal | "MRR, ARR, overdue invoices. A customer sees only their own data. They can pause or renew themselves." | Dashboard, then log in as customer, show Pause | Screenshots |

Also include in `DEMO.md`:
- **Pre-demo checklist** (servers running, seeded data, logged-in tabs prepared, browser zoom 100%, notifications off).
- **Accounts:** `admin@brightloop.test`, `staff@brightloop.test`, `customer@acme.test` (passwords from Dev 1's README; do not invent them).
- **Backup plan:** record a full screen capture the evening before the final submission slot, and keep screenshots of each step.
- Rehearse with a timer at least twice; trim to 3:00 maximum.

### 11.2 `docs/SLIDES.md` (outline, about 6 slides)
1. Problem (manual billing at scale).
2. Solution and the four pillars: Products and Plans, Subscriptions, Invoices and Payments, Analytics.
3. Architecture (React, Express, Prisma, Postgres, worker) in one diagram.
4. Key engineering: no double billing (unique constraint on subscription + period), paise integer money, role-based access with server-side isolation, sub-2-second dashboard.
5. Demo screenshots.
6. What's next (payment gateway, email notifications, renewal reminders), honest about scope.

> Only claim what is verified. If the 5,000-subscription benchmark number is not measured yet, say "designed for" instead of quoting a number.

### 11.3 Final checks (Dev 2 side)
- [ ] `npm run build -w apps/web` passes with no errors.
- [ ] All pages reachable by role; customer cannot open admin routes (redirect to portal).
- [ ] Demo flow completed end to end once without errors.
- [ ] Docs committed.

Commit: `docs: finalize 3-minute hackathon video recording script and demo cues`

---

## 12. Definition of done (whole project, Dev 2 side)

- Portal: pause, resume, renew, close early respect plan flags and update live.
- Invoice: print-ready A4 layout, all statuses.
- CSV export works from the browser for invoices and overdue.
- Search and status filters, URL-persisted, server-side.
- Toasts on all mutations, field-level validation, empty states.
- Consistent navy and indigo theme on every page.
- `DEMO.md` and `SLIDES.md` finished and rehearsed.
- Build passes; no console errors on the demo path.

---

## 13. Risk register and cut order

| Risk | Likelihood | Mitigation |
|---|---|---|
| Environment does not boot (no `.env`, Prisma not generated) | High | Do Section 5 before 12:00 |
| Invoice detail page does not exist | Medium | Budget 20 extra minutes in Hour 2 |
| Export endpoints late | Medium | Build UI first; test when Dev 1 merges |
| API lacks search or status params | Medium | Ask Dev 1 at 1:30, not at 2:30 |
| Pause is not an endpoint or flag you expected | Medium | Resolve in Step 0 discovery |
| Merge conflicts | Low (separate folders) | Rebase often |
| Running out of time | High | Follow the cut order below |

**If time runs short, cut in this order:** (1) table search, (2) empty-state polish, (3) toasts for minor actions, (4) SLIDES detail.
**Never cut:** portal actions, printable invoice, demo script and rehearsal.
**Aim to finish real work by 4:30 PM.** Use the last 30 minutes for a full end-to-end run, not new features.

---

## 14. Protocol when blocked by Dev 1

Send a short message with: what you need, the exact endpoint or field name, why, and the time you need it by.

Template:
> "Need `GET /api/invoices?status=&q=&page=` to support `q` (invoice no. or customer name) by 2:30 PM for the filters task. Currently ignoring `q`. Can you add it, or tell me the real param name?"

Also report immediately: any security bug (an action works on someone else's subscription), any response shape that differs from Swagger, and any export with wrong columns.

---

## 15. Ready-to-paste prompts for Antigravity

### Step 0 (read-only discovery)
```
Read docs/IMPLEMENTATION.md sections 1 to 5. Do NOT write application code yet.
Inspect the repo and create docs/DEV2_ENDPOINTS.md answering every question in section 5.2
with exact file paths, endpoint paths, request and response shapes, and field names you found
in apps/api routes, Swagger definitions and apps/web/src. If something does not exist, say
"NOT FOUND". Do not guess. Do not modify anything under apps/api.
```

### Hour 1
```
Follow docs/IMPLEMENTATION.md section 7 and docs/DEV2_ENDPOINTS.md.
First write a short plan (files to create or edit, component props, query keys, endpoints used)
and wait for my approval. Then implement SubscriptionActions, the mutation hook, and the
confirm dialog in the customer portal. Use existing API client, toast and StatusBadge.
Respect sections 3 and 4 (money in paise, navy and indigo theme, no emojis or gradients).
Do not edit apps/api. When done, run the build and walk the acceptance checklist in 7.5.
```

### Hour 2
```
Follow docs/IMPLEMENTATION.md section 8. Check whether InvoiceDetailPage.tsx exists; if not,
create it and add the route and links from InvoicesPage. Build InvoiceSheet with the layout in 8.1,
use formatPaise, display server-provided tax lines, and add the print CSS from 8.3.
Hide chrome with .no-print and Tailwind print:hidden. Show a plan first, then implement.
```

### Hour 3
```
Follow docs/IMPLEMENTATION.md section 9. Implement lib/download.ts, useDebouncedValue,
SearchInput and StatusPills, wire URL-persisted server-side filters on InvoicesPage and the
Export CSV buttons on InvoicesPage and DashboardPage. Use the endpoint names from
docs/DEV2_ENDPOINTS.md. If an endpoint or query param is missing, stop and tell me exactly what
to ask Dev 1 instead of faking it.
```

### Hour 4
```
Follow docs/IMPLEMENTATION.md section 10. Add Toaster and wire toasts to every mutation,
add Zod validation with field-level errors, create EmptyState and loading skeletons without
illustrations, then run the consistency checklist in 10.4 across all pages and fix deviations.
List every file you changed.
```

### Hour 5
```
Follow docs/IMPLEMENTATION.md section 11. Write docs/DEMO.md and docs/SLIDES.md based on the
real, working features in this repo. Only include claims that the code and tests support.
Use real account emails from the seed data. Do not touch README.md.
```

### Review prompt (use after every hour)
```
Review the diff against docs/IMPLEMENTATION.md. List: (1) unmet acceptance items, (2) any use of
float math on money, (3) any missing loading, empty or error states, (4) any edits outside apps/web
and docs, (5) any fake or placeholder content. Then fix what is in scope.
```

---

## 16. Glossary

| Term | Meaning |
|---|---|
| RBAC | Role-based access control: what you can do depends on your role |
| IDOR | Insecure direct object reference: changing an ID in a request to access someone else's data |
| Paise | 1/100 of a rupee; money stored as whole numbers to avoid decimal errors |
| Mutation | A request that changes data (create, update, delete) |
| Invalidate | Mark cached data as stale so it is fetched again |
| Debounce | Wait a short time after the last keystroke before acting |
| Blob | A file-like chunk of data held in browser memory |
| HTTP-only cookie | A cookie JavaScript cannot read, which protects the login token |
| Idempotency | Running the same operation twice gives the same result as once |
| Feature freeze | After this time, no new features, only fixes and docs |
| MRR / ARR | Monthly / Annual Recurring Revenue |
