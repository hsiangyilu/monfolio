import * as XLSX from "xlsx";

export interface ParsedHoldingResult {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number | null;
}

// Common column name mappings (支援中英文欄位名)
const SYMBOL_KEYS = ["symbol", "ticker", "代碼", "股票代號", "代號", "證券代號", "股票代碼", "stock_id", "stockid", "code"];
const NAME_KEYS = ["name", "名稱", "股票名稱", "證券名稱", "stock_name", "stockname", "商品"];
const QUANTITY_KEYS = ["quantity", "qty", "shares", "數量", "持有股數", "股數", "總股數", "庫存股數", "持股數", "unit", "units"];
// 持股成本 (total cost) has priority over 成交均價 (avg price per share)
const TOTAL_COST_KEYS = ["costbasis", "cost_basis", "持股成本", "總成本", "total_cost", "totalcost"];
const AVG_PRICE_KEYS = ["成交均價", "均價", "avg_cost", "avgcost", "平均成本", "買進均價", "成本價", "avgprice"];
const COST_KEYS = [...TOTAL_COST_KEYS, ...AVG_PRICE_KEYS, "cost", "成本"];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_\-\.]/g, "").trim();
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(normalizeKey);
  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeKey(headers[i]);
    if (normalizedCandidates.includes(normalized)) return i;
    // Partial match
    for (const candidate of normalizedCandidates) {
      if (normalized.includes(candidate) || candidate.includes(normalized)) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Extract clean stock symbol from strings like:
 * "富邦台50 (006208)" → "006208"
 * "台積電 (2330)" → "2330"
 * "2886" → "2886"
 * "AAPL" → "AAPL"
 * "兆豐金 (2886)" → "2886"
 */
/**
 * Taiwan stock symbols: 4-digit (e.g. 2330) or 6-digit with leading zeros (e.g. 006208).
 * Excel strips leading zeros from numbers, so "006208" becomes 6208.
 * We need to pad numeric-only symbols that are 1-3 digits to 4 digits,
 * and symbols that are exactly 4 digits starting with 6xxx to check if they should be 006xxx.
 */
function padTwSymbol(symbol: string): string {
  // Only pad if purely numeric
  if (!/^\d+$/.test(symbol)) return symbol;

  const num = parseInt(symbol, 10);

  // 1-3 digit numbers are likely ETFs with leading zeros stripped (e.g. 52 → 0052, 56 → 0056)
  if (symbol.length <= 3 && num < 1000) {
    return symbol.padStart(4, "0");
  }

  // Known TW ETF ranges that should be 00xxxx (6-digit).
  // When Excel strips leading zeros: 006208 → 6208, 00929 → 929 (handled above), etc.
  // Common 00xxxx ETFs: 006208 (富邦台50), 006205 (富邦上証), etc.
  // We can't auto-detect all cases, but the batch API endpoint will also
  // try "00" prefix lookup as a fallback.

  return symbol;
}

function cleanSymbol(raw: string): string {
  const trimmed = raw.trim();

  // Try to extract code from parentheses: "名稱 (代碼)" or "名稱（代碼）"
  const parenMatch = trimmed.match(/[（(]\s*([A-Za-z0-9.]+)\s*[）)]/);
  if (parenMatch) return parenMatch[1]; // Parenthesized codes preserve original format

  // If it's purely numeric or alphabetic, use as-is but pad TW symbols
  if (/^[A-Za-z0-9.]+$/.test(trimmed)) return padTwSymbol(trimmed);

  // Try to find a numeric code at the end: "兆豐金2886"
  const trailingNum = trimmed.match(/(\d{4,6})$/);
  if (trailingNum) return trailingNum[1];

  // Fallback: return as-is
  return trimmed;
}

/**
 * Extract name from raw fields. If name field contains "(代碼)", strip the code part.
 * e.g. "富邦台50 (006208)" → "富邦台50"
 */
function cleanName(rawName: string, rawSymbol: string): string {
  let name = rawName.trim();

  // Remove parenthesized code from name
  name = name.replace(/\s*[（(][A-Za-z0-9.]+[）)]\s*$/, "").trim();

  // If name is empty, try to extract from symbol field
  if (!name && rawSymbol) {
    const match = rawSymbol.match(/^(.+?)\s*[（(]/);
    if (match) name = match[1].trim();
  }

  return name;
}

export function parseSpreadsheet(buffer: ArrayBuffer, _fileName: string): ParsedHoldingResult[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("試算表中沒有工作表");

  const sheet = workbook.Sheets[sheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rows.length < 2) throw new Error("試算表資料不足（至少需要標題列 + 1 筆資料）");

  // Find header row (first row with at least 2 recognized columns)
  let headerIdx = -1;
  let symbolCol = -1;
  let nameCol = -1;
  let qtyCol = -1;
  let totalCostCol = -1;   // 持股成本 (total cost basis)
  let avgPriceCol = -1;    // 成交均價 (average price per share)
  let costCol = -1;        // generic "成本" fallback

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const headers = rows[i].map(String);
    const s = findColumn(headers, SYMBOL_KEYS);
    const n = findColumn(headers, NAME_KEYS);
    const q = findColumn(headers, QUANTITY_KEYS);

    // Need at least symbol + quantity, or name + quantity
    if ((s >= 0 || n >= 0) && q >= 0) {
      headerIdx = i;
      symbolCol = s;
      nameCol = n;
      qtyCol = q;
      // Try total cost first, then avg price, then generic
      totalCostCol = findColumn(headers, TOTAL_COST_KEYS);
      avgPriceCol = findColumn(headers, AVG_PRICE_KEYS);
      costCol = totalCostCol >= 0 ? totalCostCol : findColumn(headers, COST_KEYS);
      break;
    }
  }

  if (headerIdx < 0) {
    throw new Error(
      "無法辨識欄位。請確保試算表包含以下欄位：代碼/Symbol、名稱/Name、數量/Quantity。" +
      `偵測到的欄位：${rows[0]?.join(", ") ?? "（空）"}`
    );
  }

  const results: ParsedHoldingResult[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => !cell && String(cell) !== "0")) continue;

    const rawSymbol = symbolCol >= 0 ? String(row[symbolCol] ?? "").trim() : "";
    const rawName = nameCol >= 0 ? String(row[nameCol] ?? "").trim() : "";

    const symbol = cleanSymbol(rawSymbol || rawName);
    const name = cleanName(rawName || rawSymbol, rawSymbol);

    const qtyRaw = qtyCol >= 0 ? row[qtyCol] : 0;
    const quantity = typeof qtyRaw === "number" ? qtyRaw : parseFloat(String(qtyRaw).replace(/,/g, "")) || 0;

    // Determine costBasis:
    // Priority 1: 持股成本 (total cost) — use directly
    // Priority 2: 成交均價 (avg price) × quantity = total cost
    // Priority 3: generic cost column
    let costBasis: number | null = null;

    if (totalCostCol >= 0 && row[totalCostCol] != null && row[totalCostCol] !== "") {
      const raw = row[totalCostCol];
      costBasis = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, "")) || null;
    } else if (avgPriceCol >= 0 && row[avgPriceCol] != null && row[avgPriceCol] !== "") {
      const raw = row[avgPriceCol];
      const avgPrice = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, "")) || 0;
      if (avgPrice > 0 && quantity > 0) {
        costBasis = Math.round(avgPrice * quantity);
      }
    } else if (costCol >= 0 && row[costCol] != null && row[costCol] !== "") {
      const raw = row[costCol];
      costBasis = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, "")) || null;
    }

    // Skip summary/total rows (代碼 = "-" or "總計")
    if (symbol === "-" || symbol === "總計" || name === "總計") continue;

    // Skip rows with no meaningful data
    if (!symbol && !name) continue;
    if (quantity === 0 && !costBasis) continue;

    results.push({ symbol, name, quantity, costBasis });
  }

  if (results.length === 0) {
    throw new Error("未在試算表中找到有效的持股資料");
  }

  return results;
}
