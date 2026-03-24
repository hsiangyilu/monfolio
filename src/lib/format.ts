/**
 * Format a number as TWD currency: "NT$ 1,234,567"
 */
export function formatTWD(value: number): string {
  const formatted = Math.round(value).toLocaleString("zh-TW");
  return `NT$ ${formatted}`;
}

/**
 * Format a number as USD currency: "$1,234.56"
 */
export function formatUSD(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as a signed percentage: "+12.34%" or "-5.67%"
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format a number in compact notation: "1.2M", "456K", etc.
 */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}${abs.toFixed(0)}`;
}
