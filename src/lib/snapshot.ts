/**
 * Server-side snapshot computation. Fetches all current holdings + live prices
 * + FX, calculates per-category TWD values, and writes a PortfolioSnapshot row.
 *
 * Used by:
 *   - /api/snapshots/cron (Vercel daily cron)
 *   - any future "snapshot now" admin endpoint
 *
 * NOT used by /api/snapshots POST (that one accepts client-supplied totals to
 * preserve backwards-compat with the existing OCR confirm flow).
 */

import { prisma } from "@/lib/db";
import { fetchFxRate } from "@/lib/api/fx";
import { fetchTwStockPrices } from "@/lib/api/tw-stocks";
import { fetchUsStockPrices } from "@/lib/api/us-stocks";
import { fetchCryptoPrices } from "@/lib/api/crypto";

export interface SnapshotTotals {
  totalNetWorth: number;
  twStockValue: number;
  usStockValue: number;
  cryptoValue: number;
  cashValue: number;
  debtValue: number;
  fxRateUsdTwd: number;
  /** JSON-serialized per-symbol breakdown for future audits/replay. */
  snapshotData: string;
}

/**
 * Compute a fresh snapshot from current DB state + live market prices.
 * Pure (apart from network calls) — does not write to DB.
 */
export async function computeSnapshot(): Promise<SnapshotTotals> {
  const [holdings, debts, fx] = await Promise.all([
    prisma.holding.findMany(),
    prisma.debt.findMany(),
    fetchFxRate(),
  ]);

  const usdTwd = fx.usdTwd;

  const twSymbols = holdings
    .filter((h) => h.category === "tw_stock")
    .map((h) => h.symbol);
  const usSymbols = holdings
    .filter((h) => h.category === "us_stock")
    .map((h) => h.symbol);
  const cryptoSymbols = holdings
    .filter((h) => h.category === "crypto")
    .map((h) => h.symbol.toUpperCase());

  const [twPrices, usPrices, cryptoPrices] = await Promise.all([
    twSymbols.length
      ? fetchTwStockPrices(twSymbols)
      : ({} as Awaited<ReturnType<typeof fetchTwStockPrices>>),
    usSymbols.length
      ? fetchUsStockPrices(usSymbols)
      : ({} as Awaited<ReturnType<typeof fetchUsStockPrices>>),
    cryptoSymbols.length
      ? fetchCryptoPrices(cryptoSymbols)
      : ({} as Awaited<ReturnType<typeof fetchCryptoPrices>>),
  ]);

  let twStockValue = 0;
  let usStockValue = 0;
  let cryptoValue = 0;
  let cashValue = 0;
  const breakdown: Record<
    string,
    { quantity: number; price: number | null; valueTwd: number }
  > = {};

  for (const h of holdings) {
    const key = `${h.category}:${h.symbol}`;
    if (h.category === "tw_stock") {
      const p = twPrices[h.symbol]?.price ?? null;
      const v = p != null ? h.quantity * p : 0;
      twStockValue += v;
      breakdown[key] = { quantity: h.quantity, price: p, valueTwd: v };
    } else if (h.category === "us_stock") {
      const p = usPrices[h.symbol]?.price ?? null;
      const v = p != null ? h.quantity * p * usdTwd : 0;
      usStockValue += v;
      breakdown[key] = { quantity: h.quantity, price: p, valueTwd: v };
    } else if (h.category === "crypto") {
      const p = cryptoPrices[h.symbol.toUpperCase()]?.price ?? null;
      const v = p != null ? h.quantity * p * usdTwd : 0;
      cryptoValue += v;
      breakdown[key] = { quantity: h.quantity, price: p, valueTwd: v };
    } else if (h.category === "cash") {
      const v = h.costCurrency === "USD" ? h.quantity * usdTwd : h.quantity;
      cashValue += v;
      breakdown[key] = { quantity: h.quantity, price: 1, valueTwd: v };
    }
  }

  const debtValue = debts.reduce((s, d) => s + d.remainingBalance, 0);
  const totalNetWorth =
    twStockValue + usStockValue + cryptoValue + cashValue - debtValue;

  return {
    totalNetWorth: Math.round(totalNetWorth),
    twStockValue: Math.round(twStockValue),
    usStockValue: Math.round(usStockValue),
    cryptoValue: Math.round(cryptoValue),
    cashValue: Math.round(cashValue),
    debtValue: Math.round(debtValue),
    fxRateUsdTwd: usdTwd,
    snapshotData: JSON.stringify({ breakdown, computedAt: new Date().toISOString() }),
  };
}

/**
 * Has a snapshot already been written today (server local time, UTC)?
 * Used for cron dedup so a single day never has more than one cron-written row.
 */
export async function hasSnapshotToday(): Promise<boolean> {
  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.portfolioSnapshot.findFirst({
    where: { createdAt: { gte: startOfDayUtc } },
    select: { id: true },
  });
  return existing != null;
}
