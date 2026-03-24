interface UsStockResult {
  price: number;
  change: number;
  changePercent: number;
}

interface CacheEntry {
  data: Record<string, UsStockResult>;
  timestamp: number;
}

const CACHE_TTL = 10 * 1000; // 10 seconds
let cache: CacheEntry | null = null;

/**
 * Fetch US stock prices from Yahoo Finance v8 chart API.
 * Symbols like ["AAPL", "MSFT", "VOO"].
 */
export async function fetchUsStockPrices(
  symbols: string[]
): Promise<Record<string, UsStockResult>> {
  if (symbols.length === 0) return {};

  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    const hit: Record<string, UsStockResult> = {};
    let allFound = true;
    for (const s of symbols) {
      if (cache.data[s]) {
        hit[s] = cache.data[s];
      } else {
        allFound = false;
        break;
      }
    }
    if (allFound) return hit;
  }

  const result: Record<string, UsStockResult> = {};

  // Fetch each symbol in parallel
  const fetches = symbols.map(async (symbol) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        console.error(`Yahoo Finance returned ${res.status} for ${symbol}`);
        return;
      }

      const json = await res.json();
      const chartResult = json.chart?.result?.[0];
      if (!chartResult) return;

      const meta = chartResult.meta;
      const currentPrice = meta.regularMarketPrice ?? 0;
      const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
      const change = currentPrice - previousClose;
      const changePercent =
        previousClose > 0 ? (change / previousClose) * 100 : 0;

      result[symbol] = {
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
    }
  });

  await Promise.all(fetches);

  // Update cache
  cache = { data: { ...(cache?.data || {}), ...result }, timestamp: Date.now() };

  return result;
}
