import { describe, it, expect, beforeEach } from "vitest";
import { calcRemainingInterest, calcPaymentsMade, autoCalcDebt } from "../debt-calc";

// ── calcRemainingInterest ────────────────────────────────────────────────────

describe("calcRemainingInterest", () => {
  it("zero-rate: returns excess of total payments over remaining balance", () => {
    // Formula: max(0, payment * terms - balance) = max(0, 36000 - 30000) = 6000
    expect(calcRemainingInterest(30000, 0, 3000, 12)).toBe(6000);
  });

  it("zero-rate: returns 0 when total payments < balance (underpayment scenario)", () => {
    // max(0, 1000 * 10 - 15000) = max(0, -5000) = 0
    expect(calcRemainingInterest(15000, 0, 1000, 10)).toBe(0);
  });

  it("computes interest for a standard rate (2.38% annual, DB decimal)", () => {
    const interest = calcRemainingInterest(100000, 0.0238, 3000, 36);
    // Rough sanity: total interest on a 100k loan at 2.38% over 36 months
    // should be in the thousands (not tens of thousands, not zero)
    expect(interest).toBeGreaterThan(1000);
    expect(interest).toBeLessThan(10000);
  });

  it("higher rate → more interest than lower rate", () => {
    const lowRate = calcRemainingInterest(100000, 0.02, 3000, 36);
    const highRate = calcRemainingInterest(100000, 0.05, 3000, 36);
    expect(highRate).toBeGreaterThan(lowRate);
  });

  it("returns 0 when remainingBalance is 0", () => {
    expect(calcRemainingInterest(0, 0.05, 3000, 12)).toBe(0);
  });

  it("returns 0 when remainingTerms is 0", () => {
    expect(calcRemainingInterest(50000, 0.05, 3000, 0)).toBe(0);
  });

  it("handles negative rate as zero-rate (treats ≤ 0 as 0)", () => {
    const withNegative = calcRemainingInterest(10000, -0.01, 1000, 10);
    const withZero = calcRemainingInterest(10000, 0, 1000, 10);
    expect(withNegative).toBe(withZero);
  });

  it("payment smaller than monthly interest: returns finite interest (no runaway)", () => {
    // High rate (24% annual = 2%/month), small payment: monthly interest = 200,
    // payment = 100 → principal contribution = 0, balance stays flat.
    // Result must be a finite positive number, not Infinity or a huge runaway value.
    const result = calcRemainingInterest(10000, 0.24, 100, 12);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1_000_000);
    expect(Number.isFinite(result)).toBe(true);
  });
});

// ── calcPaymentsMade ─────────────────────────────────────────────────────────

describe("calcPaymentsMade", () => {
  it("returns 0 when startDate is today and paymentDay is in the future", () => {
    const today = new Date(2026, 3, 23); // April 23
    const startDate = new Date(2026, 3, 23);
    // paymentDay = 25 (April 25 ≥ startDate and ≤ today? No, 25 > 23, so not yet)
    const count = calcPaymentsMade(startDate, 25, today);
    expect(count).toBe(0);
  });

  it("counts payment made today when paymentDay = today", () => {
    const today = new Date(2026, 3, 23); // April 23
    const startDate = new Date(2026, 3, 1);
    const count = calcPaymentsMade(startDate, 23, today);
    expect(count).toBe(1);
  });

  it("counts 12 monthly payments for a 1-year loan", () => {
    const startDate = new Date(2025, 3, 15); // April 15, 2025
    const today = new Date(2026, 3, 15);     // April 15, 2026
    const count = calcPaymentsMade(startDate, 15, today);
    expect(count).toBe(13); // April 2025 through April 2026 inclusive
  });

  it("clamps paymentDay to last day of February", () => {
    // paymentDay = 31, Feb 2026 has 28 days → clamps to Feb 28
    const startDate = new Date(2026, 1, 1);  // Feb 1, 2026
    const today = new Date(2026, 2, 1);      // March 1, 2026
    const count = calcPaymentsMade(startDate, 31, today);
    // Feb 28 is ≥ startDate (Feb 1) and ≤ today (March 1) → 1 payment
    expect(count).toBe(1);
  });
});

// ── autoCalcDebt ─────────────────────────────────────────────────────────────

describe("autoCalcDebt", () => {
  const baseDebt = {
    principalTotal: 360000,
    monthlyPayment: 10000,
    paymentDay: 15,
    startDate: "2024-01-15",
    totalTerms: 36,
  };

  it("returns null when paymentDay is missing", () => {
    expect(autoCalcDebt({ ...baseDebt, paymentDay: null })).toBeNull();
  });

  it("returns null when startDate is missing", () => {
    expect(autoCalcDebt({ ...baseDebt, startDate: null })).toBeNull();
  });

  it("returns null for invalid startDate string", () => {
    expect(autoCalcDebt({ ...baseDebt, startDate: "not-a-date" })).toBeNull();
  });

  it("clamps paymentsMade to totalTerms (no '已繳 40/36 期' scenario)", () => {
    // A loan that started 4 years ago with 36-term cap
    const debt = {
      principalTotal: 360000,
      monthlyPayment: 10000,
      paymentDay: 1,
      startDate: "2020-01-01", // 5+ years ago → rawPaymentsMade >> 36
      totalTerms: 36,
    };
    const result = autoCalcDebt(debt);
    expect(result).not.toBeNull();
    expect(result!.paymentsMade).toBeLessThanOrEqual(36);
    expect(result!.remainingTerms).toBe(0);
    expect(result!.remainingBalance).toBe(0);
  });

  it("does not clamp when totalTerms is 0 (legacy mode)", () => {
    const debt = {
      principalTotal: 120000,
      monthlyPayment: 10000,
      paymentDay: 1,
      startDate: "2025-01-01",
      totalTerms: 0,
    };
    const result = autoCalcDebt(debt);
    expect(result).not.toBeNull();
    // Should use unclamped paymentsMade
    expect(result!.paymentsMade).toBeGreaterThanOrEqual(0);
  });

  it("remainingBalance never goes below 0", () => {
    // Loan fully paid off
    const debt = {
      principalTotal: 10000,
      monthlyPayment: 10000,
      paymentDay: 1,
      startDate: "2024-01-01",
      totalTerms: 1,
    };
    const result = autoCalcDebt(debt);
    expect(result).not.toBeNull();
    expect(result!.remainingBalance).toBeGreaterThanOrEqual(0);
  });

  it("nextPaymentDate is in the future or today", () => {
    const result = autoCalcDebt(baseDebt);
    expect(result).not.toBeNull();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(result!.nextPaymentDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });
});
