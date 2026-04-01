@AGENTS.md

# FinanceFlow — Project Guide

## Overview

FinanceFlow is a personal finance PWA for tracking income, expenses, transfers, budgets, and savings goals. It runs entirely client-side with IndexedDB (Dexie.js) and syncs across devices via Dexie Cloud.

**Live URL:** https://financeflow-five-iota.vercel.app
**Repo:** https://github.com/aofmbrucewayne-max/financeflow

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS 4 + inline styles (theme colors) | 4.x |
| Database | Dexie.js (IndexedDB) | 4.4.2 |
| Cloud Sync | dexie-cloud-addon | 4.4.8 |
| State | Zustand | 5.0.12 |
| Icons | lucide-react | 1.7.0 |
| Charts | Recharts | 3.8.1 |
| Toasts | sonner | 2.0.7 |
| IDs | uuid v4 (string-based, required by Dexie Cloud) | 13.0.0 |

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (Sidebar, ThemeProvider, Toaster)
│   ├── page.tsx                  # Dashboard (total balance, charts, account summary, goals)
│   ├── accounts/page.tsx         # Account management (CRUD, balance calc)
│   ├── transactions/page.tsx     # Transaction list with filters
│   ├── budgets/page.tsx          # Monthly budgets per category
│   ├── categories/page.tsx       # Income/expense categories
│   ├── goals/page.tsx            # Savings goals tracker
│   ├── settings/page.tsx         # Theme, cloud sync, demo data, export/import, danger zone
│   ├── recurring/                # (placeholder — not yet implemented)
│   └── reports/                  # (placeholder — not yet implemented)
├── components/
│   ├── accounts/AccountModal.tsx       # Create/edit account modal
│   ├── cloud/CloudLoginModal.tsx       # Dexie Cloud OTP login (2-step: email → code)
│   ├── cloud/CloudLoginWrapper.tsx     # Deprecated — renders null, kept in layout.tsx
│   ├── layout/AppInitializer.tsx       # Runs on mount (seeds default categories, loads settings)
│   ├── layout/Sidebar.tsx              # Desktop sidebar + mobile floating bottom nav (iOS-style)
│   ├── layout/ThemeProvider.tsx        # Applies theme CSS vars to <html>
│   ├── transactions/TransactionModal.tsx  # Create/edit transaction + transfer (with optional fee)
│   ├── transactions/TransactionRow.tsx    # Single transaction display row
│   └── ui/                             # shadcn primitives (button, calendar, tabs, etc.)
└── lib/
    ├── db.ts                     # Dexie database + cloud config (THE source of truth for schema)
    ├── themes.ts                 # 4 themes: dark, pink, marine, gold (color definitions)
    ├── utils.ts                  # cn() helper (clsx + tailwind-merge)
    ├── types/index.ts            # All TypeScript interfaces
    ├── hooks/                    # useLiveQuery wrappers (useAccounts, useTransactions, etc.)
    ├── stores/                   # Zustand stores (themeStore, settingsStore, uiStore)
    └── utils/                    # currency.ts, dates.ts, demoSeed.ts, seed.ts
```

## Database Schema (src/lib/db.ts)

Database name: `FinanceFlow`

### Synced Tables (string `id` primary key, generated with uuid v4)
| Table | Indexes |
|-------|---------|
| accounts | `id, type, currency, isArchived, createdAt` |
| categories | `id, type, parentId, isArchived, sortOrder` |
| transactions | `id, type, accountId, categoryId, date, createdAt` |
| recurringRules | `id, type, accountId, categoryId, isActive, nextDueDate` |
| savingsGoals | `id, isCompleted, createdAt` |
| budgets | `id, categoryId, month` |
| tags | `id, name` |

### Unsynced Tables (auto-increment `++id`, local-only)
| Table | Indexes |
|-------|---------|
| exchangeRates | `++id, baseCurrency` |
| settings | `++id` |

**CRITICAL:** Dexie Cloud requires string primary keys for synced tables. Tables with `++id` (auto-increment integer) MUST be listed in `unsyncedTables`. Violating this causes `ConstraintError: "Invalid primary key type Undefined"` and breaks the entire sync/login flow silently.

## Dexie Cloud Sync

- **Cloud URL:** `https://zpqvn0kac.dexie.cloud`
- **Config file:** `dexie-cloud.json` (committed), `dexie-cloud.key` (gitignored — admin private key)
- **Auth:** Email + OTP (one-time password sent via email)
- **Config flags:**
  - `requireAuth: false` — app works offline without login
  - `customLoginGui: true` — Dexie emits on `db.cloud.userInteraction` instead of showing its own dialog
  - `unsyncedTables: ['settings', 'exchangeRates']` — excludes `++id` tables from sync

### How the Login Flow Works
1. User clicks "Login with Email" in Settings → opens `CloudLoginModal`
2. Modal calls `db.cloud.login({ email, grant_type: 'otp' })`
3. Dexie emits `userInteraction` with `type: 'email'` → modal auto-submits the email
4. Dexie sends OTP to user's email, emits `userInteraction` with `type: 'otp'`
5. Modal shows OTP input, user enters code
6. Modal calls `ia.onSubmit({ otp })` via stored ref
7. Login completes → `db.cloud.currentUser` emits logged-in user → modal closes

### Whitelisted Origins
- `http://localhost:3000`
- `https://financeflow-five-iota.vercel.app`

To whitelist a new origin:
```bash
npx dexie-cloud whitelist https://your-domain.com
```

## Balance Calculation Logic

Account balance = `initialBalance` + sum of all transaction adjustments:
- **Income** (`tx.accountId === account.id`): `+amount`
- **Expense** (`tx.accountId === account.id`): `-amount`
- **Transfer source** (`tx.accountId === account.id`): `-amount`
- **Transfer destination** (`tx.toAccountId === account.id`): `+amount`

This logic MUST be identical everywhere balances are shown (dashboard total, dashboard account list, accounts page). Forgetting transfers in any location causes balance mismatches.

### Transfer Fees
When creating a transfer with a fee, the fee is saved as a **separate expense transaction** on the source account, categorized under "Fees & Commissions". The `fee` field on the Transaction type is metadata only.

## Theme System

4 themes defined in `src/lib/themes.ts`, managed by `useThemeStore` (Zustand, persisted to `localStorage` key `ff-theme`).

| ID | Name | Accent |
|----|------|--------|
| `dark` | Dark Purple | Purple gradient |
| `pink` | Pink Rose | Pink gradient |
| `marine` | Blue Marine | Blue gradient |
| `gold` | Gold Luxe | Gold gradient |

### How to Use Theme Colors
```tsx
const c = useThemeStore((s) => s.colors);
// Then use inline styles:
style={{ backgroundColor: c.bgSecondary, color: c.textPrimary, border: `1px solid ${c.borderDefault}` }}
```

Available color keys: `bgPrimary`, `bgSecondary`, `bgTertiary`, `bgElevated`, `textPrimary`, `textSecondary`, `textTertiary`, `borderDefault`, `borderHover`, `accent`, `accentHover`, `accentSubtle`, `navBg`, `navBorder`, `gradient`, `gradientSubtle`.

**DO NOT hardcode colors.** Always use `c.xxx` from the theme store so all 4 themes work correctly.

## Mobile Considerations

- **Bottom nav:** Floating iOS-style bar in `Sidebar.tsx`, visible only on mobile (`md:hidden`)
- **Touch interactions:** Don't use `opacity-0 group-hover:opacity-100` for action buttons — hover doesn't work on touch devices. Use `md:opacity-0 md:group-hover:opacity-100` to hide on desktop only, always visible on mobile.
- **Button visibility:** Ensure button colors have enough contrast against their backgrounds. Test with all 4 themes.
- **Layout offset:** Main content has `pt-14 md:pt-0 pb-24 md:pb-0` to account for mobile top bar and bottom nav.

## Key Patterns

- **Data fetching:** `useLiveQuery()` from `dexie-react-hooks` — reactive, auto-updates when DB changes
- **All pages are `'use client'`** — this is a fully client-side app with no SSR data fetching
- **ID generation:** Always use `import { v4 as uuid } from 'uuid'` for new entity IDs (string format required by Dexie Cloud)
- **Date format:** Stored as `YYYY-MM-DD` strings in the database
- **Month format:** `YYYY-MM` for budgets
- **Currency formatting:** Use `formatCurrency(amount, currencyCode)` from `src/lib/utils/currency.ts`
- **Toasts:** `import { toast } from 'sonner'` — `toast.success()`, `toast.error()`

## Known Constraints

- `recurring/` and `reports/` pages exist as empty directories — not yet implemented
- `CloudLoginWrapper.tsx` renders null but is still imported in `layout.tsx` — can be cleaned up
- Exchange rates are local-only (not synced) — multi-currency conversion is basic
- No server-side logic — everything runs in the browser
