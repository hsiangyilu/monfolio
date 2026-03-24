interface FxRateResult {
  usdTwd: number;
}

interface CacheEntry {
  data: FxRateResult;
  timestamp: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cache: CacheEntry | null = null;

/**
 * Fetch USD/TWD exchange rate from open.er-api.com.
 */
export async function fetchFxRate(): Promise<FxRateResult> {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`FX API returned ${res.status}`);
    }

    const json = await res.json();
    const usdTwd = json.rates?.TWD ?? 32.0;

    const result: FxRateResult = {
      usdTwd: Math.round(usdTwd * 100) / 100,
    };

    cache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error("Failed to fetch FX rate:", error);
    // Return last cached value or fallback
    return cache?.data ?? { usdTwd: 32.0 };
  }
}
