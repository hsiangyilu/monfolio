interface TwStockResult {
  price: number;
  change: number;
  changePercent: number;
  name: string;
}

interface CacheEntry {
  data: Record<string, TwStockResult>;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Cache configuration
// ---------------------------------------------------------------------------

// Real-time cache: short TTL for intraday prices
const REALTIME_CACHE_TTL = 10 * 1000; // 10 seconds
let realtimeCache: CacheEntry | null = null;

// Closing price cache: long TTL – closing data doesn't change until next trading day
const CLOSING_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
let closingCache: CacheEntry | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch Taiwan stock prices with multi-source fallback.
 *
 * Strategy:
 * 1. Try TWSE real-time API (mis.twse.com.tw) for intraday prices
 * 2. For any symbol with price === 0, fall back to TWSE/TPEX afterTrading
 *    closing price data (official, very reliable, works 24/7)
 * 3. Merge results so every symbol has the best available price
 */
export async function fetchTwStockPrices(
  symbols: string[]
): Promise<Record<string, TwStockResult>> {
  if (symbols.length === 0) return {};

  // Step 1: Try real-time prices
  const result = await fetchRealtime(symbols);

  // Step 2: Find symbols missing or with price === 0
  const missingSymbols = symbols.filter(
    (s) => !result[s] || result[s].price === 0
  );

  if (missingSymbols.length > 0) {
    // Fetch comprehensive closing price data (cached for 2 hours)
    const closingPrices = await fetchClosingPrices();

    for (const s of missingSymbols) {
      if (closingPrices[s]) {
        result[s] = closingPrices[s];
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Source 1: TWSE Real-time API (mis.twse.com.tw)
// Works best during market hours (09:00–13:30 TWTime)
// ---------------------------------------------------------------------------

async function fetchRealtime(
  symbols: string[]
): Promise<Record<string, TwStockResult>> {
  // Return cached data if fresh and complete
  if (realtimeCache && Date.now() - realtimeCache.timestamp < REALTIME_CACHE_TTL) {
    const hit: Record<string, TwStockResult> = {};
    let allFound = true;
    for (const s of symbols) {
      if (realtimeCache.data[s] && realtimeCache.data[s].price > 0) {
        hit[s] = realtimeCache.data[s];
      } else {
        allFound = false;
        break;
      }
    }
    if (allFound) return hit;
  }

  // Build query: try both tse_ and otc_ for each symbol
  const querySymbols = symbols.map((s) => `tse_${s}.tw|otc_${s}.tw`);
  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${querySymbols.join("|")}&json=1&delay=0`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`TWSE real-time API returned ${res.status}`);
      return {};
    }

    const json = await res.json();
    const result: Record<string, TwStockResult> = {};

    if (json.msgArray && Array.isArray(json.msgArray)) {
      for (const item of json.msgArray) {
        const symbol = item.c; // stock code
        const name = item.n || symbol;
        const yesterdayClose = safeParseFloat(item.y);

        // Multi-field fallback for current price:
        // z (last trade) → pz (previous close during match) → opening → yesterday close
        const currentPrice =
          safeParseFloat(item.z) ||
          safeParseFloat(item.pz) ||
          safeParseFloat(item.o) ||
          yesterdayClose;

        if (currentPrice > 0) {
          const change = yesterdayClose > 0 ? currentPrice - yesterdayClose : 0;
          const changePercent =
            yesterdayClose > 0 ? (change / yesterdayClose) * 100 : 0;

          result[symbol] = {
            price: currentPrice,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            name,
          };
        }
      }
    }

    // Update cache (merge with existing)
    realtimeCache = {
      data: { ...(realtimeCache?.data || {}), ...result },
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("TWSE real-time API timed out");
    } else {
      console.error("Failed to fetch TW real-time prices:", error);
    }
    return {};
  }
}

// ---------------------------------------------------------------------------
// Source 2: TWSE + TPEX afterTrading closing prices
// Official data, extremely reliable, available after ~14:30 on trading days.
// Returns data for the most recent trading day.
// ---------------------------------------------------------------------------

async function fetchClosingPrices(): Promise<Record<string, TwStockResult>> {
  // Return cached data if fresh
  if (closingCache && Date.now() - closingCache.timestamp < CLOSING_CACHE_TTL) {
    return closingCache.data;
  }

  const result: Record<string, TwStockResult> = {};

  // Fetch TWSE (上市) and TPEX (上櫃) in parallel
  await Promise.all([
    fetchTwseClosing(result),
    fetchTpexClosing(result),
  ]);

  if (Object.keys(result).length > 0) {
    closingCache = { data: result, timestamp: Date.now() };
  }

  return result;
}

/**
 * TWSE afterTrading: all listed stocks closing prices.
 * Endpoint: https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY_ALL
 * Fields: [證券代號, 證券名稱, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數]
 *          0          1          2         3        4       5       6       7        8         9
 */
async function fetchTwseClosing(
  result: Record<string, TwStockResult>
): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      "https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY_ALL?response=json",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: controller.signal,
        next: { revalidate: 0 },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`TWSE afterTrading API returned ${res.status}`);
      return;
    }

    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return;

    for (const row of json.data) {
      const symbol = (row[0] as string).trim();
      const name = (row[1] as string).trim();
      const close = parseNumeric(row[7] as string);
      const changeStr = (row[8] as string).replace(/,/g, "").trim();
      const change = parseFloat(changeStr) || 0;
      const prevClose = close - change;
      const changePercent =
        prevClose > 0 ? (change / prevClose) * 100 : 0;

      if (close > 0) {
        result[symbol] = {
          price: close,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          name,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch TWSE closing prices:", error);
  }
}

/**
 * TPEX afterTrading: all OTC stocks closing prices.
 * Endpoint: https://www.tpex.org.tw/web/stock/aftertrading/daily_close_quotes/stk_quote_result.php
 * Fields: [代號, 名稱, 收盤, 漲跌, 開盤, 最高, 最低, 均價, 成交股數, 成交金額(元), 成交筆數, ...]
 *          0     1     2     3     4     5     6     7     8          9              10
 */
async function fetchTpexClosing(
  result: Record<string, TwStockResult>
): Promise<void> {
  try {
    // TPEX uses ROC calendar dates: year = western - 1911
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    // Try today first; if weekend/holiday the API returns the last trading day
    const dateStr = `${rocYear}/${month}/${day}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      `https://www.tpex.org.tw/web/stock/aftertrading/daily_close_quotes/stk_quote_result.php?l=zh-tw&o=json&d=${dateStr}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: controller.signal,
        next: { revalidate: 0 },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`TPEX afterTrading API returned ${res.status}`);
      return;
    }

    const json = await res.json();

    // TPEX response has tables array; stock data is in the first table
    const tables = json.tables;
    if (!tables || !Array.isArray(tables)) return;

    for (const table of tables) {
      if (!table.data || !Array.isArray(table.data)) continue;

      for (const row of table.data) {
        const symbol = (row[0] as string).trim();
        const name = (row[1] as string).trim();
        const close = parseNumeric(row[2] as string);
        const changeStr = (row[3] as string).replace(/,/g, "").trim();
        // TPEX change includes direction symbols like △ ▽ or spaces
        const changeNum = parseFloat(changeStr.replace(/[^\d.-]/g, "")) || 0;
        const isNegative = changeStr.includes("-") || changeStr.includes("▽");
        const change = isNegative ? -Math.abs(changeNum) : changeNum;
        const prevClose = close - change;
        const changePercent =
          prevClose > 0 ? (change / prevClose) * 100 : 0;

        if (close > 0) {
          result[symbol] = {
            price: close,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            name,
          };
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch TPEX closing prices:", error);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a float, returning 0 for "-", empty strings, and NaN. */
function safeParseFloat(value: string | undefined | null): number {
  if (!value || value === "-" || value === "") return 0;
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

/** Parse a numeric string that may contain commas (e.g. "1,810.00"). */
function parseNumeric(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
