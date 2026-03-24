interface CryptoResult {
  price: number;
  change24h: number;
}

interface CacheEntry {
  data: Record<string, CryptoResult>;
  timestamp: number;
}

const CACHE_TTL = 10 * 1000; // 10 seconds
let cache: CacheEntry | null = null;

/** Map common symbols to CoinGecko IDs */
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  CRV: "curve-dao-token",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
};

function symbolToId(symbol: string): string {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
}

/**
 * Fetch crypto prices from CoinGecko.
 * Symbols like ["BTC", "SOL", "CRV"].
 */
export async function fetchCryptoPrices(
  symbols: string[]
): Promise<Record<string, CryptoResult>> {
  if (symbols.length === 0) return {};

  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    const hit: Record<string, CryptoResult> = {};
    let allFound = true;
    for (const s of symbols) {
      if (cache.data[s.toUpperCase()]) {
        hit[s.toUpperCase()] = cache.data[s.toUpperCase()];
      } else {
        allFound = false;
        break;
      }
    }
    if (allFound) return hit;
  }

  // Build reverse map: coingecko id -> original symbol
  const idToSymbol: Record<string, string> = {};
  const ids: string[] = [];
  for (const symbol of symbols) {
    const id = symbolToId(symbol);
    ids.push(id);
    idToSymbol[id] = symbol.toUpperCase();
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko API returned ${res.status}`);
    }

    const json = await res.json();
    const result: Record<string, CryptoResult> = {};

    for (const [id, data] of Object.entries(json)) {
      const symbol = idToSymbol[id];
      if (!symbol) continue;
      const d = data as { usd?: number; usd_24h_change?: number };
      result[symbol] = {
        price: d.usd ?? 0,
        change24h: Math.round((d.usd_24h_change ?? 0) * 100) / 100,
      };
    }

    // Update cache
    cache = {
      data: { ...(cache?.data || {}), ...result },
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    console.error("Failed to fetch crypto prices:", error);
    return {};
  }
}
