# TODOS

## Multi-user data isolation

**What:** Add User model to Prisma, add userId foreign key to all existing models (Holding, Debt, PortfolioSnapshot, TargetAllocation, OcrUpload, Settings), migrate existing data, filter all queries by userId.

**Why:** Currently all data is global (single-user). If a second email is added to ALLOWED_EMAILS, they'd see all financial data. Multi-user isolation is required for sharing the app.

**Pros:** Enables true multi-user support, each user's financial data is private.

**Cons:** Touches 15+ files (schema, all API routes, seed data). Requires data migration for existing records. Breaking change for the database schema.

**Context:** The app was originally built as a single-user personal finance dashboard. Google OAuth login gate was added as the first step. This is the natural next step when/if a second user needs access.

**Depends on:** Google OAuth login (completed).

---

## E2E test infrastructure (Playwright)

**What:** Set up Playwright for end-to-end testing. Write E2E tests for login flow (Google OAuth redirect, authorized access, unauthorized rejection, logout).

**Why:** Unit tests cover the email allowlist logic, but the full browser login flow (redirect to Google, callback, session creation) can only be verified with E2E tests.

**Pros:** Catches integration issues between Auth.js, middleware, and the browser. Automated regression testing for auth flows.

**Cons:** Playwright setup adds ~30 min. Google OAuth E2E requires mock OAuth provider or test credentials.

**Context:** Vitest was set up for unit tests. Playwright would complement it for browser-level testing.

**Depends on:** None.

---

## Mobile bottom nav redesign

**What:** Redesign the mobile bottom navigation bar. Currently has 7 nav items + 1 user avatar = 8 elements, which is crowded on smaller screens (375px width).

**Why:** 8 items in a bottom nav bar doesn't scale. On iPhone SE / small Android devices, touch targets will be too close together.

**Pros:** Better mobile UX, proper touch targets (44px min), cleaner navigation hierarchy.

**Cons:** Requires design decision on grouping strategy (hamburger menu, tabs with "more", etc.).

**Context:** User avatar was added to mobile nav as part of Google OAuth login feature. The nav was already at 7 items before this addition.

**Depends on:** None.
