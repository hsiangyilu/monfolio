import type { HoldingCategory } from "@/types/index";

// Known crypto symbols (top coins + common ones)
const CRYPTO_SYMBOLS = new Set([
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "DOT", "AVAX", "MATIC",
  "LINK", "UNI", "ATOM", "LTC", "FIL", "NEAR", "APT", "ARB", "OP", "SUI",
  "PEPE", "SHIB", "TRX", "TON", "ICP", "RENDER", "FET", "INJ", "SEI",
  "TIA", "JUP", "WIF", "BONK", "PENDLE", "ENA", "STRK", "MANTA", "DYM",
  "USDT", "USDC", "DAI", "BUSD", "TUSD", "AAVE", "CRV", "MKR", "COMP",
  "SNX", "SUSHI", "YFI", "1INCH", "ALGO", "HBAR", "VET", "EOS", "XLM",
  "XTZ", "THETA", "EGLD", "FTM", "SAND", "MANA", "AXS", "ENJ", "GALA",
  "IMX", "BLUR", "PYTH", "JTO", "W", "ONDO", "ETHFI", "ALT",
]);

/**
 * Detect which asset category a symbol belongs to.
 * - Pure numeric (or starts with 00 + digits) → tw_stock
 * - Known crypto ticker → crypto
 * - Pure alphabetic (1-5 chars uppercase) → us_stock
 * - Fallback → us_stock
 */
export function detectCategory(symbol: string): HoldingCategory {
  const s = symbol.trim().toUpperCase();

  // Pure numeric → Taiwan stock (e.g. 2330, 0056, 006208)
  if (/^\d+$/.test(s)) return "tw_stock";

  // Known crypto
  if (CRYPTO_SYMBOLS.has(s)) return "crypto";

  // Crypto patterns: ends with USDT/USD/BTC pair notation
  if (/USDT$|USD$|BTC$|ETH$|BUSD$/.test(s) && s.length > 4) return "crypto";

  // Alphabetic 1-5 chars → likely US stock (e.g. AAPL, TSLA, MSFT)
  if (/^[A-Z]{1,5}$/.test(s)) return "us_stock";

  // Alphanumeric with letters → could be US stock (e.g. BRK.B) or crypto
  if (/^[A-Z0-9.]{1,10}$/.test(s)) return "us_stock";

  return "us_stock";
}

export const CATEGORY_LABELS: Record<HoldingCategory, string> = {
  tw_stock: "台股",
  us_stock: "美股",
  crypto: "虛擬貨幣",
  cash: "現金",
};
