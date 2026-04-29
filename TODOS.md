# TODOS

## Multi-user data isolation

**What:** Add User model to Prisma, add userId foreign key to all existing models (Holding, Debt, PortfolioSnapshot, TargetAllocation, OcrUpload, Settings), migrate existing data, filter all queries by userId.

**Why:** Currently all data is global (single-user). The app is open access — anyone with the URL sees all financial data. Multi-user isolation is required if the app is ever shared with others.

**Pros:** Enables true multi-user support, each user's financial data is private.

**Cons:** Touches 15+ files (schema, all API routes, seed data). Requires data migration for existing records. Breaking change for the database schema. Also requires adding authentication back first.

**Context:** The app is currently open access (no login). This item becomes relevant when/if a second user needs access.

**Depends on:** Authentication (removed in v0.2.1 — needs to be re-added if multi-user is desired).

---

## E2E test infrastructure (Playwright)

**What:** Set up Playwright for end-to-end testing of the main portfolio dashboard flows (viewing holdings, editing debt, snapshots, etc.).

**Why:** Current Vitest suite covers API routes and calculation logic. No browser-level tests exist for UI interactions.

**Pros:** Catches integration issues between the API layer and UI components. Automated regression testing for critical user flows.

**Cons:** Playwright setup adds ~30 min. Need to decide whether to test against a real or mocked database.

**Context:** Vitest was set up for unit/API tests. Playwright would complement it for browser-level testing. Note: the original E2E TODO was about auth flows — auth was removed in v0.2.1, so the focus should shift to portfolio CRUD flows instead.

**Depends on:** None.

---

## Mobile bottom nav redesign

**What:** Redesign the mobile bottom navigation bar. Currently has 7 nav items, which is crowded on smaller screens (375px width).

**Why:** 7 items in a bottom nav bar doesn't scale well. On iPhone SE / small Android devices, touch targets are too close together.

**Pros:** Better mobile UX, proper touch targets (44px min), cleaner navigation hierarchy.

**Cons:** Requires design decision on grouping strategy (hamburger menu, tabs with "more", etc.).

**Context:** User avatar was removed as part of auth removal in v0.2.1. Nav is back to 7 items.

**Depends on:** None.
