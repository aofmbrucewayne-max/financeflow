<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# FinanceFlow Development Rules

## Code Quality

### Never Hardcode Colors
Every color MUST come from `useThemeStore((s) => s.colors)`. There are 4 themes — hardcoded hex values break 3 of them. The only exceptions are semantic colors like error red (`#ef4444`) used consistently across all themes.

### Balance Calculation Must Be Consistent
Account balances are computed in multiple places (dashboard total, dashboard account list, accounts page). The formula is:
```
balance = initialBalance + income - expenses - transfersOut + transfersIn
```
If you add or modify balance display anywhere, copy the EXACT same logic. A partial formula (e.g., forgetting transfers) causes user-visible bugs.

### Mobile-First UI
- Never use `hover:` alone for interactive elements — always pair with `md:hover:` or make the element always visible on mobile
- Never use `opacity-0 group-hover:opacity-100` for action buttons — use `md:opacity-0 md:group-hover:opacity-100` instead
- Test button/icon contrast against ALL 4 theme backgrounds before committing
- The floating bottom nav has `pb-24` padding on mobile — account for it in scrollable content

### Database Rules
- All synced table IDs MUST be `string` type generated with `uuid v4`. Never use `++id` (auto-increment) on synced tables
- Tables with `++id` MUST be listed in `unsyncedTables` in `db.cloud.configure()`
- When adding a new table: decide if it needs sync. If yes → `id` (string). If no → `++id` and add to `unsyncedTables`
- Never bump `this.version()` without a migration strategy — Dexie Cloud complicates schema changes
- The database name is `FinanceFlow` — changing it loses all user data

### Dexie Cloud
- `customLoginGui: true` means WE handle the login UI, not Dexie. The flow goes through `db.cloud.userInteraction` observable
- Never call `db.cloud.login()` without `customLoginGui: true` — Dexie's default dialog doesn't work in Next.js
- After changing cloud config, users must clear IndexedDB for changes to take effect
- `dexie-cloud.key` is a secret — never commit it. It's in `.gitignore`
- To whitelist a new deployment origin: `npx dexie-cloud whitelist <url>`

## Architecture

### State Management
- **Database state** → Dexie + `useLiveQuery()` (accounts, transactions, categories, budgets, goals, tags)
- **UI state** → Zustand `useUIStore` (modals, filters)
- **Theme state** → Zustand `useThemeStore` (persisted to localStorage)
- **Settings state** → Zustand `useSettingsStore` (loaded from Dexie `settings` table)

Do NOT mix these. Don't store DB data in Zustand. Don't store UI state in Dexie.

### Component Patterns
- All pages are `'use client'` — no server components, no SSR data fetching
- Modals receive `isOpen` + `onClose` props and render `null` when closed
- Data fetching happens via `useLiveQuery()` at the page level, passed down as props or accessed directly
- Use `sonner` for user feedback: `toast.success()`, `toast.error()`

### File Organization
- New pages go in `src/app/<name>/page.tsx`
- New components go in `src/components/<domain>/ComponentName.tsx`
- New hooks go in `src/lib/hooks/useXxx.ts`
- New utility functions go in `src/lib/utils/<name>.ts`
- Types go in `src/lib/types/index.ts` (single file)
- Don't create new store files unless there's a genuinely separate state domain

## Production & Deployment

### Vercel
- Auto-deploys from `main` branch
- Live at `https://financeflow-five-iota.vercel.app`
- After pushing, changes are live in ~1-2 minutes
- If adding environment variables, set them in Vercel dashboard too

### PWA
- `manifest.json` is in `/public/`
- App is installable on iOS (Add to Home Screen) and Android
- All data is local (IndexedDB) — the app works fully offline
- Cloud sync is optional, enabled per-user via Settings → Login

### Pre-Push Checklist
1. Does `npm run build` succeed? (catches TypeScript errors, unused imports)
2. Are colors using theme store, not hardcoded?
3. Do interactive elements work on mobile (no hover-only actions)?
4. Is balance calculation consistent across all display locations?
5. Are new DB tables using the correct primary key strategy?

## Common Pitfalls (Learned from Production Bugs)

| Pitfall | What Happens | Fix |
|---------|-------------|-----|
| `++id` on synced table | `ConstraintError`, login/sync breaks silently | Use string `id` + uuid, or add to `unsyncedTables` |
| Hardcoded colors | Looks fine on dark theme, invisible on other 3 | Use `c.xxx` from theme store |
| `opacity-0 group-hover:opacity-100` | Buttons invisible on mobile, can't edit/delete | Use `md:` prefix for hover effects |
| Forgetting transfers in balance calc | Account balances don't match reality | Always include transfer source (-) and destination (+) |
| `monthEnd = "-31"` for date ranges | Breaks February and 30-day months | Use `new Date(year, month, 0).getDate()` |
| Button color matches background | Button exists but user can't see it | Ensure sufficient contrast, test all themes |
| Direct fetch to Dexie Cloud API | "No white-listed app found" error | Use `db.cloud.login()` — it handles origin headers |
