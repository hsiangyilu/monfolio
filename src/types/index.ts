// ─── Holding ───
export interface Holding {
  id: string;
  category: HoldingCategory;
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number | null;
  costCurrency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HoldingCategory = "tw_stock" | "us_stock" | "crypto" | "cash";

export interface HoldingWithPrice extends Holding {
  currentPrice: number | null;
  marketValue: number | null;
  marketValueTwd: number | null;
  change: number | null;
  changePercent: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
}

export interface GroupedHoldings {
  tw_stock: Holding[];
  us_stock: Holding[];
  crypto: Holding[];
  cash: Holding[];
}

export interface CreateHoldingInput {
  category: HoldingCategory;
  symbol: string;
  name: string;
  quantity: number;
  costBasis?: number | null;
  costCurrency?: string;
  notes?: string | null;
}

export interface UpdateHoldingInput extends Partial<CreateHoldingInput> {}

// ─── Prices ───
export interface TwStockPrice {
  price: number;
  change: number;
  changePercent: number;
  name: string;
}

export interface UsStockPrice {
  price: number;
  change: number;
  changePercent: number;
}

export interface CryptoPrice {
  price: number;
  change24h: number;
}

export interface FxRateData {
  usdTwd: number;
}

// ─── Debt ───
export interface Debt {
  id: string;
  name: string;
  principalTotal: number;
  remainingBalance: number;
  interestRate: number;
  remainingTerms: number;
  monthlyPayment: number;
  paymentDay: number | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Snapshot ───
export interface PortfolioSnapshot {
  id: string;
  totalNetWorth: number;
  twStockValue: number;
  usStockValue: number;
  cryptoValue: number;
  cashValue: number;
  debtValue: number;
  fxRateUsdTwd: number;
  snapshotData: string;
  createdAt: string;
}

// ─── Target Allocation ───
export interface TargetAllocation {
  id: string;
  category: string;
  targetPct: number;
}

// ─── Net Worth ───
export interface CategoryValues {
  tw_stock: number;
  us_stock: number;
  crypto: number;
  cash: number;
  debt: number;
}

export interface NetWorthData {
  totalNetWorth: number;
  categoryValues: CategoryValues;
  holdingsWithPrices: HoldingWithPrice[];
}

// ─── OCR ───
export interface ParsedHolding {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number | null;
}
