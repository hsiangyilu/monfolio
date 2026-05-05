/**
 * Calculate unrealized PnL for a single holding.
 *
 * costBasis is stored in the asset's native currency:
 *   - TWD for tw_stock (needsFx = false)
 *   - USD for us_stock and crypto (needsFx = true)
 *
 * priceInNative is the current price per unit in native currency.
 * costBasisInNative is the total cost (not per-unit) in native currency.
 */
export function calcHoldingPnl(params: {
  quantity: number;
  priceInNative: number;
  costBasisInNative: number;
  usdTwd: number;
  needsFx: boolean;
}): { totalValueTwd: number; costTwd: number; pnl: number; pnlPercent: number } {
  const { quantity, priceInNative, costBasisInNative, usdTwd, needsFx } = params;
  const fxMultiplier = needsFx ? usdTwd : 1;
  const totalValueTwd = quantity * priceInNative * fxMultiplier;
  const costTwd = costBasisInNative * fxMultiplier;
  const pnl = totalValueTwd - costTwd;
  const pnlPercent = costTwd > 0 ? (pnl / costTwd) * 100 : 0;
  return { totalValueTwd, costTwd, pnl, pnlPercent };
}
