# Changelog

All notable changes to this project will be documented in this file.

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
