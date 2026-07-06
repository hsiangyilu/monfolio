# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deploy Configuration

- Platform: Vercel — auto-deploy on push to `main`
- Production URL: https://money-portfolio-red.vercel.app
- Health check: https://money-portfolio-red.vercel.app/api/health
- Pre-merge check: `npm run build && npm run lint`
- Merge method: squash

## Commands

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run lint       # ESLint
npm run db:seed    # seed database
npm run db:studio  # Prisma Studio (local SQLite only)

# Run all tests
npx vitest

# Run a single test file
npx vitest tests/api/holdings.test.ts
```

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Recharts + SWR + Prisma + Turso (libsql)

### Key directories

```
src/
├── app/
│   ├── (dashboard)/      ← Route group: cash, crypto, debt, tw-stocks, us-stocks, settings, insights
│   ├── api/              ← API routes: allocation, debt, health, holdings, ocr, prices, settings, snapshots
│   ├── globals.css       ← Design tokens (@theme inline), utility classes (.card-premium, .glass-card)
│   └── layout.tsx        ← Root layout
├── components/
│   ├── layout/           ← sidebar.tsx, mobile-nav.tsx, top-banner.tsx
│   ├── cards/            ← summary-card.tsx
│   ├── charts/           ← net-worth-chart, allocation-pie, asset-line-chart, debt-progress
│   ├── pages/            ← home-page.tsx, category-detail-page.tsx
│   ├── holdings/         ← holdings-table.tsx (CRUD table)
│   └── ocr/              ← screenshot-upload.tsx, ocr-preview.tsx
├── lib/
│   ├── db.ts             ← Prisma singleton (libsql adapter; reads DATABASE_URL + DATABASE_AUTH_TOKEN)
│   ├── api-client.ts     ← Typed fetch wrappers for all API routes
│   ├── constants.ts      ← Category keys, color maps
│   ├── format.ts         ← NT$ number formatting, percentage helpers
│   ├── debt-calc.ts      ← Debt amortization logic
│   └── snapshot.ts       ← Portfolio snapshot capture
├── types/                ← Shared TypeScript types
└── generated/prisma/     ← Prisma client output (auto-generated, do not edit)

prisma/
├── schema.prisma         ← Models: Holding, Debt, PortfolioSnapshot, TargetAllocation, OcrUpload, Settings
├── seed.ts               ← Seed script
└── migrations/           ← Local SQLite migration history
```

### Database (critical)

The app uses **Turso (libsql)** in production and local SQLite (`prisma/dev.db`) for dev/tests. The Prisma adapter pattern only works at runtime — the Prisma CLI (`db push`, `migrate deploy`) does NOT work with `libsql://` URLs.

**To apply schema changes to production:**
1. Edit `schema.prisma`
2. Run the SQL manually via Turso CLI:
   ```bash
   turso db shell monfolio "ALTER TABLE ... ;"
   turso db shell monfolio "SELECT name FROM pragma_table_info('<Table>');"  # verify
   ```
3. Do NOT add `prisma db push` or `prisma migrate deploy` to the build script — both will break the Vercel deploy.

Local dev migrations use `npm run db:migrate` (writes to `prisma/dev.db`).

### Testing

Tests use Vitest with a real database (not mocked). `tests/setup.ts` runs `deleteMany()` on Holding, Debt, and PortfolioSnapshot before each test. Tests run serially (`fileParallelism: false`) to prevent cross-file teardown races.

### AI features

- OCR: `src/lib/ocr/` + `src/app/api/ocr/` — uses `@anthropic-ai/sdk` and `@google/generative-ai` to parse brokerage screenshots into holdings data
- Insights page: AI-generated portfolio commentary

## Design System

Defined in `DESIGN_SYSTEM.md` and implemented in `src/app/globals.css`.

Key tokens (all `@theme inline` in globals.css):
- `--primary`: `#E8B462` (Gold Amber) — brand accent, CTAs, active nav
- `--accent`: `#CD7B65` (Coral) — secondary accent
- `--color-gain`: `#F44336` (red — gain in TW market) / `--color-loss`: `#7BB155` (green — loss)
- `--sidebar`: `#3D2B2F` (Woody Brown)

Reusable CSS classes: `.card-premium` (white card with warm shadow), `.glass-card` (dark sidebar style).

Category color keys: `tw_stock`, `us_stock`, `crypto`, `cash`, `debt` — mapped in `src/lib/constants.ts`.

Number format: NT$ with comma separators; use `format.ts` helpers, never inline.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill tool as your FIRST action.

- Product ideas, brainstorming → `office-hours`
- Bugs, errors, 500s → `investigate`
- Ship, deploy, create PR → `ship`
- QA, find bugs → `qa`
- Code review → `review`
- Update docs after shipping → `document-release`
- Weekly retro → `retro`
- Design system / brand → `design-consultation`
- Visual audit / design polish → `design-review`
- Architecture review → `plan-eng-review`
- Save progress / checkpoint → `context-save`
- Code quality / health → `health`

### gstack

Available gstack commands:
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /autoplan,
/design-consultation, /design-shotgun, /design-html,
/review, /investigate, /codex,
/browse, /qa, /qa-only, /qa-design-review, /benchmark, /cso,
/ship, /land-and-deploy, /canary, /document-release,
/retro, /learn,
/careful, /freeze, /guard, /unfreeze, /checkpoint, /gstack-upgrade
