import { describe, it, expect } from "vitest";
import { calcHoldingPnl } from "@/lib/pnl-calc";

describe("calcHoldingPnl", () => {
  const USD_TWD = 31.65;

  describe("TWD-denominated assets (tw_stock)", () => {
    it("calculates PnL for a gain", () => {
      const result = calcHoldingPnl({
        quantity: 100,
        priceInNative: 50,    // TWD per share, currently 50
        costBasisInNative: 3000, // paid 3000 TWD total
        usdTwd: USD_TWD,
        needsFx: false,
      });
      expect(result.totalValueTwd).toBe(5000);
      expect(result.costTwd).toBe(3000);
      expect(result.pnl).toBe(2000);
      expect(result.pnlPercent).toBeCloseTo(66.67, 1);
    });

    it("calculates PnL for a loss", () => {
      const result = calcHoldingPnl({
        quantity: 10,
        priceInNative: 80,
        costBasisInNative: 1000,
        usdTwd: USD_TWD,
        needsFx: false,
      });
      expect(result.totalValueTwd).toBe(800);
      expect(result.costTwd).toBe(1000);
      expect(result.pnl).toBe(-200);
      expect(result.pnlPercent).toBe(-20);
    });

    it("does not apply FX multiplier", () => {
      const result = calcHoldingPnl({
        quantity: 1,
        priceInNative: 100,
        costBasisInNative: 100,
        usdTwd: USD_TWD,
        needsFx: false,
      });
      // costTwd == costBasisInNative (no FX)
      expect(result.costTwd).toBe(100);
      expect(result.totalValueTwd).toBe(100);
    });
  });

  describe("USD-denominated assets (us_stock / crypto)", () => {
    it("converts both value and cost to TWD via usdTwd", () => {
      // VOO: 16.46 shares, cost 6207.85 USD, current price 660 USD
      const result = calcHoldingPnl({
        quantity: 16.46,
        priceInNative: 660,
        costBasisInNative: 6207.85,
        usdTwd: USD_TWD,
        needsFx: true,
      });
      expect(result.totalValueTwd).toBeCloseTo(16.46 * 660 * USD_TWD, 0);
      expect(result.costTwd).toBeCloseTo(6207.85 * USD_TWD, 0);
      expect(result.pnl).toBeCloseTo(result.totalValueTwd - result.costTwd, 0);
    });

    it("pnlPercent is based on TWD cost, not raw USD cost", () => {
      const result = calcHoldingPnl({
        quantity: 1,
        priceInNative: 200,   // USD
        costBasisInNative: 100, // USD total
        usdTwd: USD_TWD,
        needsFx: true,
      });
      // doubled in USD → 100% gain, same in TWD
      expect(result.pnlPercent).toBeCloseTo(100, 5);
    });

    it("does not produce 4000%+ PnL% when usdTwd is correctly applied", () => {
      // Regression: old bug divided TWD market value by raw USD costBasis
      const result = calcHoldingPnl({
        quantity: 16.46,
        priceInNative: 660,
        costBasisInNative: 6207.85,
        usdTwd: USD_TWD,
        needsFx: true,
      });
      // Before fix: pnlPercent ≈ 4000%+; after fix: should be ~75%
      expect(result.pnlPercent).toBeLessThan(200);
      expect(result.pnlPercent).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("returns 0% when cost is zero", () => {
      const result = calcHoldingPnl({
        quantity: 10,
        priceInNative: 50,
        costBasisInNative: 0,
        usdTwd: USD_TWD,
        needsFx: false,
      });
      expect(result.pnlPercent).toBe(0);
    });

    it("handles zero quantity", () => {
      const result = calcHoldingPnl({
        quantity: 0,
        priceInNative: 100,
        costBasisInNative: 500,
        usdTwd: USD_TWD,
        needsFx: true,
      });
      expect(result.totalValueTwd).toBe(0);
      expect(result.pnl).toBeCloseTo(-500 * USD_TWD, 0);
    });
  });
});
