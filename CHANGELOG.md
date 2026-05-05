# Changelog

All notable changes to this project will be documented in this file.

## [0.2.3] - 2026-05-05

### Fixed
- **Insights page**: Remaining hardcoded gain/loss hex colors (`#f44336`, `#7bb155`) replaced with CSS tokens (`--color-gain`, `--color-loss`) in holdings table PnL column, debt remaining balance value, StatCard value, PnL legend, and allocation drift badges.
- **Insights page**: `paidPct` debt progress bar now clamped with `Math.max(0, ...)` in addition to `Math.min(100, ...)` to handle edge-case negative-balance loans.
- **Insights page**: Recharts tooltip payload map callbacks now guard against non-numeric values with a `typeof p.value !== 'number'` check, preventing a potential render crash on malformed chart data.
- **Settings page**: Fixed mismatched `<h2>`/`</h3>` JSX tags introduced in the pre-landing review — all three section headings now use `<h2>` consistently.

### Refactored
- **Insights page**: Extracted `TooltipCard` wrapper component shared by `PnlTooltip` and `HistoryTooltip`, eliminating duplicate container JSX.

## [0.2.2] - 2026-05-04

### Changed
- **Insights page**: PnL tooltip now uses correct Taiwan market color convention — red for gain, green for loss. All gain/loss colors now reference CSS design tokens (`--color-gain`, `--color-loss`) instead of hardcoded hex values.
- **Insights page**: Tooltip popups (PnL and asset history) match the home page's tooltip style — warm card shadow, muted label, bold values.
- **Insights page**: Asset history chart legend uses horizontal lines instead of dots, consistent with the Overview chart.
- **Insights page**: Debt section now shows remaining balance and interest rate below the progress bar, aligned with the repayment percentage.
- **Insights page**: Page title localized to 數據洞察.
- **Settings page**: OCR engine selection uses brand amber highlight instead of generic gray.
- **Settings page**: Page title localized to 設定.
- **Design system**: `--primary` color token used for interactive highlights; hardcoded `#e8b462` removed from component code.
- **CLAUDE.md**: Expanded with full architecture guide, database notes, design system tokens, and skill routing table.

### Fixed
- **Turbopack crash on load**: Removed orphaned `src/app/api/auth/[...nextauth]/route.ts` that referenced a deleted auth module, causing Turbopack to panic on every page load after auth was removed in v0.2.1.

## [0.2.1] - 2026-04-29

### Removed
- **Google OAuth authentication**: Removed login requirement entirely — the app is now open access. Deleted `next-auth`, the login page, auth middleware, email allowlist, and all API auth guards. Anyone with the URL can use the app.

### Fixed
- **App crash on load**: The dashboard was crashing with `TypeError: E?.forEach is not a function` because the SWR fetcher silently returned 401 error objects as data. The new `fetcher.ts` throws properly on non-2xx responses.
- **Test parallelism**: Vitest was running test files in parallel against the same real database, causing flaky failures when `beforeEach` teardown in one file deleted records created by another. Tests now run serially.

### Added
- `src/lib/fetcher.ts`: Shared SWR fetcher that throws on non-2xx responses with the server's error message and HTTP status attached. Replaces inline `fetch().then(r => r.json())` calls that swallowed errors.
- Unit tests for `fetcher.ts` (3 tests: happy path, error with JSON body, error with non-JSON body).

## [0.2.0] - 2026-04-23

### Added
- **Debt total terms tracking**: New `totalTerms` field on debt records lets you set the full loan period (e.g. 36 months). The app now shows "已繳 N / 36 期" and clamps displayed payments so they never exceed the loan term.
- **Unit tests for debt calculation logic**: 18 tests covering `calcRemainingInterest`, `calcPaymentsMade`, and `autoCalcDebt` — including zero-rate semantics, Feb day clamping, loan payoff clamping, and edge cases.

### Fixed
- **Interest rate precision**: `calcRemainingInterest` now accepts the database-native decimal format (e.g. `0.0238` for 2.38%) directly, eliminating a manual `* 100` conversion that could cause incorrect interest estimates.
- **Auto-calculated remaining balance on save**: When editing a debt with `paymentDay` and `startDate` set, the saved `totalTerms` was not being passed to `autoCalcDebt` — causing the remaining balance to use an unclamped payments count. Now correctly clamps on both preview and save.

### Changed
- `calcRemainingInterest` moved from a local function in the Insights page to a shared export in `src/lib/debt-calc.ts`, so all pages use the same calculation.
- Debt auto-calculation now respects `totalTerms`: when set, `paymentsMade` is clamped to `totalTerms` and `remainingTerms` is derived from the difference rather than re-estimated from payments.

## [0.1.0] - Initial release
