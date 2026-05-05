"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { formatTWD, formatPercent, formatCompactNumber } from "@/lib/format";
import { autoCalcDebt, calcRemainingInterest } from "@/lib/debt-calc";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Activity,
} from "lucide-react";
import type {
  Holding,
  GroupedHoldings,
  TwStockPrice,
  UsStockPrice,
  CryptoPrice,
  FxRateData,
  PortfolioSnapshot,
  TargetAllocation,
  Debt,
} from "@/types/index";
import { fetcher } from "@/lib/fetcher";

const CATEGORY_META = [
  { key: "tw_stock" as const, label: "台股", color: "#e8b462" },
  { key: "us_stock" as const, label: "美股", color: "#cd7b65" },
  { key: "crypto" as const, label: "虛擬貨幣", color: "#f8a01d" },
  { key: "cash" as const, label: "現金", color: "#7bb155" },
];

// ── Cost basis normalised to TWD ─────────────────────────────────────────────
// costBasis may be stored in USD (for US stocks/crypto entered in original currency).
// Always convert to TWD before comparing with market value.
function costTwd(h: Holding, usdTwd: number): number {
  return h.costCurrency === "USD"
    ? (h.costBasis ?? 0) * usdTwd
    : (h.costBasis ?? 0);
}

type TimeRange = "1M" | "3M" | "6M" | "ALL";
type HoldingsSort = "value" | "pnl_pct";

// ── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  positive,
  neutral,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  neutral?: boolean;
}) {
  const valueColor = neutral
    ? "text-gray-900"
    : positive
    ? "text-[#f44336]"
    : "text-[#7bb155]";
  return (
    <div className="card-premium rounded-xl p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function PnlTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 space-y-1"
      style={{ boxShadow: "var(--shadow-warm-tooltip)" }}
    >
      <p className="text-[11px] font-medium tracking-wide text-[color:var(--muted-foreground)]/80">{label}</p>
      {payload.map((p, i) => (
        <p
          key={i}
          className={`text-sm font-bold tabular-nums ${
            p.value >= 0 ? "text-[color:var(--color-gain)]" : "text-[color:var(--color-loss)]"
          }`}
        >
          {p.value >= 0 ? "+" : ""}
          {formatTWD(p.value)}
        </p>
      ))}
    </div>
  );
}

function HistoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 space-y-1.5"
      style={{ boxShadow: "var(--shadow-warm-tooltip)" }}
    >
      <p className="text-[11px] font-medium tracking-wide text-[color:var(--muted-foreground)]/80">
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            {p.name}
          </span>
          <span className="ml-auto text-sm font-bold text-[color:var(--foreground)] tabular-nums">
            {formatCompactNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [holdingsSort, setHoldingsSort] = useState<HoldingsSort>("value");

  const { data: holdings, isLoading: holdingsLoading } =
    useSWR<GroupedHoldings>("/api/holdings", fetcher);
  const { data: twPrices } = useSWR<Record<string, TwStockPrice>>(
    "/api/prices/tw-stocks",
    fetcher
  );
  const { data: usPrices } = useSWR<Record<string, UsStockPrice>>(
    "/api/prices/us-stocks",
    fetcher
  );
  const { data: cryptoPrices } = useSWR<Record<string, CryptoPrice>>(
    "/api/prices/crypto",
    fetcher
  );
  const { data: fxRate } = useSWR<FxRateData>("/api/prices/fx", fetcher);
  const { data: debts } = useSWR<Debt[]>("/api/debt", fetcher);
  const { data: snapshots } = useSWR<PortfolioSnapshot[]>(
    "/api/snapshots",
    fetcher
  );
  const { data: targets } = useSWR<TargetAllocation[]>(
    "/api/settings/targets",
    fetcher
  );

  const usdTwd = fxRate?.usdTwd ?? 31;

  // ── Market values per category ─────────────────────────────────────────────
  const categoryValues = useMemo(() => {
    if (!holdings)
      return { tw_stock: 0, us_stock: 0, crypto: 0, cash: 0, debt: 0 };

    let tw_stock = 0;
    holdings["tw_stock"]?.forEach((h: Holding) => {
      tw_stock += h.quantity * (twPrices?.[h.symbol]?.price ?? 0);
    });
    let us_stock = 0;
    holdings["us_stock"]?.forEach((h: Holding) => {
      us_stock += h.quantity * (usPrices?.[h.symbol]?.price ?? 0) * usdTwd;
    });
    let crypto = 0;
    holdings["crypto"]?.forEach((h: Holding) => {
      crypto += h.quantity * (cryptoPrices?.[h.symbol]?.price ?? 0) * usdTwd;
    });
    let cash = 0;
    holdings["cash"]?.forEach((h: Holding) => {
      cash += h.costCurrency === "USD" ? h.quantity * usdTwd : h.quantity;
    });
    let debt = 0;
    if (Array.isArray(debts)) debts.forEach((d) => {
      const calc = autoCalcDebt(d);
      debt += calc ? calc.remainingBalance : d.remainingBalance;
    });

    return { tw_stock, us_stock, crypto, cash, debt };
  }, [holdings, twPrices, usPrices, cryptoPrices, usdTwd, debts]);

  const totalAssets =
    categoryValues.tw_stock +
    categoryValues.us_stock +
    categoryValues.crypto +
    categoryValues.cash;
  const totalNetWorth = totalAssets - categoryValues.debt;

  // ── Unrealized P&L per category ────────────────────────────────────────────
  const pnlByCategory = useMemo(() => {
    if (!holdings) return [];

    const tw = (holdings["tw_stock"] ?? []).reduce((sum: number, h: Holding) => {
      return sum + h.quantity * (twPrices?.[h.symbol]?.price ?? 0) - costTwd(h, usdTwd);
    }, 0);

    const us = (holdings["us_stock"] ?? []).reduce((sum: number, h: Holding) => {
      return sum + h.quantity * (usPrices?.[h.symbol]?.price ?? 0) * usdTwd - costTwd(h, usdTwd);
    }, 0);

    const crypto = (holdings["crypto"] ?? []).reduce((sum: number, h: Holding) => {
      return sum + h.quantity * (cryptoPrices?.[h.symbol]?.price ?? 0) * usdTwd - costTwd(h, usdTwd);
    }, 0);

    return [
      { name: "台股", pnl: tw, color: "#e8b462" },
      { name: "美股", pnl: us, color: "#cd7b65" },
      { name: "虛擬貨幣", pnl: crypto, color: "#f8a01d" },
    ];
  }, [holdings, twPrices, usPrices, cryptoPrices, usdTwd]);

  const totalPnl = pnlByCategory.reduce((s, c) => s + c.pnl, 0);

  const totalCostBasis = useMemo(() => {
    if (!holdings) return 0;
    let basis = 0;
    (["tw_stock", "us_stock", "crypto"] as const).forEach((cat) => {
      holdings[cat]?.forEach((h: Holding) => { basis += costTwd(h, usdTwd); });
    });
    return basis;
  }, [holdings, usdTwd]);

  const totalPnlPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  // ── Net worth growth — with fallback to oldest snapshot ────────────────────
  const { momChange, momChangePct, momLabel } = useMemo(() => {
    if (!snapshots || snapshots.length < 2)
      return { momChange: null, momChangePct: null, momLabel: null };

    const sorted = [...snapshots].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latest = sorted[0].totalNetWorth;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Try 30-day snapshot first; fall back to oldest available
    let past = sorted.find((s) => new Date(s.createdAt) <= thirtyDaysAgo);
    let label = "vs 30 天前";

    if (!past) {
      past = sorted[sorted.length - 1];
      const d = new Date(past.createdAt);
      label = `自 ${d.toLocaleDateString("zh-TW", { month: "short", day: "numeric" })} 起`;
    }

    const change = latest - past.totalNetWorth;
    const pct = past.totalNetWorth > 0 ? (change / past.totalNetWorth) * 100 : 0;
    return { momChange: change, momChangePct: pct, momLabel: label };
  }, [snapshots]);

  // ── Debt-to-asset ratio ────────────────────────────────────────────────────
  const debtToAsset =
    totalAssets > 0 ? (categoryValues.debt / totalAssets) * 100 : 0;

  // ── History chart data — preserves rawDate for range filtering ─────────────
  const historyData = useMemo(() => {
    if (!snapshots) return [];
    return [...snapshots]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((s) => ({
        date: new Date(s.createdAt).toLocaleDateString("zh-TW", {
          month: "short",
          day: "numeric",
        }),
        rawDate: new Date(s.createdAt),
        tw_stock: s.twStockValue,
        us_stock: s.usStockValue,
        crypto: s.cryptoValue,
        cash: s.cashValue,
      }));
  }, [snapshots]);

  const filteredHistoryData = useMemo(() => {
    if (timeRange === "ALL") return historyData;
    const cutoff = new Date();
    const months = timeRange === "1M" ? 1 : timeRange === "3M" ? 3 : 6;
    cutoff.setMonth(cutoff.getMonth() - months);
    return historyData.filter((d) => d.rawDate >= cutoff);
  }, [historyData, timeRange]);

  // ── Allocation vs target ───────────────────────────────────────────────────
  const allocationRows = useMemo(() => {
    const targetMap = new Map<string, number>();
    targets?.forEach((t) => targetMap.set(t.category, t.targetPct));

    return CATEGORY_META.map((cat) => {
      const value = categoryValues[cat.key] ?? 0;
      const actual = totalAssets > 0 ? (value / totalAssets) * 100 : 0;
      const target = targetMap.get(cat.key) ?? null;
      const drift = target !== null ? actual - target : null;
      return { ...cat, value, actual, target, drift };
    });
  }, [categoryValues, totalAssets, targets]);

  // ── Holdings rows (all investable categories) ──────────────────────────────
  const allHoldingRows = useMemo(() => {
    if (!holdings) return [];

    const rows: {
      symbol: string;
      name: string;
      color: string;
      marketValueTwd: number;
      pct: number;
      pnl: number;
      pnlPct: number;
    }[] = [];

    holdings["tw_stock"]?.forEach((h: Holding) => {
      const mv = h.quantity * (twPrices?.[h.symbol]?.price ?? 0);
      const basis = costTwd(h, usdTwd);
      const pnl = mv - basis;
      rows.push({
        symbol: h.symbol,
        name: h.name,
        color: "#e8b462",
        marketValueTwd: mv,
        pct: totalAssets > 0 ? (mv / totalAssets) * 100 : 0,
        pnl,
        pnlPct: basis > 0 ? (pnl / basis) * 100 : 0,
      });
    });

    holdings["us_stock"]?.forEach((h: Holding) => {
      const mv = h.quantity * (usPrices?.[h.symbol]?.price ?? 0) * usdTwd;
      const basis = costTwd(h, usdTwd);
      const pnl = mv - basis;
      rows.push({
        symbol: h.symbol,
        name: h.name,
        color: "#cd7b65",
        marketValueTwd: mv,
        pct: totalAssets > 0 ? (mv / totalAssets) * 100 : 0,
        pnl,
        pnlPct: basis > 0 ? (pnl / basis) * 100 : 0,
      });
    });

    holdings["crypto"]?.forEach((h: Holding) => {
      const mv = h.quantity * (cryptoPrices?.[h.symbol]?.price ?? 0) * usdTwd;
      const basis = costTwd(h, usdTwd);
      const pnl = mv - basis;
      rows.push({
        symbol: h.symbol,
        name: h.name,
        color: "#f8a01d",
        marketValueTwd: mv,
        pct: totalAssets > 0 ? (mv / totalAssets) * 100 : 0,
        pnl,
        pnlPct: basis > 0 ? (pnl / basis) * 100 : 0,
      });
    });

    return rows;
  }, [holdings, twPrices, usPrices, cryptoPrices, usdTwd, totalAssets]);

  const sortedHoldings = useMemo(() => {
    const sorted =
      holdingsSort === "value"
        ? [...allHoldingRows].sort((a, b) => b.marketValueTwd - a.marketValueTwd)
        : [...allHoldingRows].sort((a, b) => b.pnlPct - a.pnlPct);
    return sorted.slice(0, 10);
  }, [allHoldingRows, holdingsSort]);

  // ── Debt summary — amortization-based interest ────────────────────────────
  const debtSummary = useMemo(() => {
    if (!Array.isArray(debts) || debts.length === 0) return null;
    const rows = debts.map((d) => {
      const calc = autoCalcDebt(d);
      return {
        d,
        remainingBalance: calc ? calc.remainingBalance : d.remainingBalance,
        remainingTerms: calc ? calc.remainingTerms : d.remainingTerms,
      };
    });
    const totalRemaining = rows.reduce((s, r) => s + r.remainingBalance, 0);
    const totalOriginal = debts.reduce((s, d) => s + d.principalTotal, 0);
    const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
    const totalInterest = rows.reduce((s, r) => {
      return s + calcRemainingInterest(
        r.remainingBalance,
        r.d.interestRate,
        r.d.monthlyPayment,
        r.remainingTerms
      );
    }, 0);
    return { totalRemaining, totalOriginal, totalMonthly, totalInterest, rows };
  }, [debts]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (holdingsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">數據洞察</h1>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="未實現損益"
          value={`${totalPnl >= 0 ? "+" : ""}${formatTWD(totalPnl)}`}
          sub={`${formatPercent(totalPnlPct)} vs 成本`}
          positive={totalPnl >= 0}
        />
        <StatCard
          label={momLabel ?? "增減"}
          value={
            momChange !== null
              ? `${momChange >= 0 ? "+" : ""}${formatTWD(momChange)}`
              : "—"
          }
          sub={
            momChangePct !== null ? formatPercent(momChangePct) : "快照不足"
          }
          positive={momChange !== null ? momChange >= 0 : undefined}
          neutral={momChange === null}
        />
        <StatCard
          label="負債比率"
          value={`${debtToAsset.toFixed(1)}%`}
          sub={`負債 ${formatTWD(categoryValues.debt)}`}
          neutral
        />
        <StatCard
          label="總資產"
          value={formatTWD(totalNetWorth)}
          sub={`資產 ${formatCompactNumber(totalAssets)}`}
          neutral
        />
      </div>

      {/* ── P&L by Category + History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Unrealized P&L bar chart */}
        <div className="card-premium rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            未實現損益（各類別）
          </h2>
          {pnlByCategory.every((c) => c.pnl === 0) ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Activity className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm">尚無持倉資料</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={pnlByCategory}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatCompactNumber(v)}
                  width={68}
                />
                <Tooltip content={<PnlTooltip />} cursor={{ fill: "var(--muted)" }} />
                <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlByCategory.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            {pnlByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-gray-500">{cat.name}</span>
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    cat.pnl >= 0 ? "text-[#f44336]" : "text-[#7bb155]"
                  }`}
                >
                  {cat.pnl >= 0 ? "+" : ""}
                  {formatTWD(cat.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Historical stacked area chart with time range filter */}
        <div className="card-premium rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              資產類別歷史走勢
            </h2>
            {/* Time range tabs */}
            <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
              {(["1M", "3M", "6M", "ALL"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    timeRange === r
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {filteredHistoryData.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm">
                {timeRange === "ALL" ? "需要更多歷史快照" : `${timeRange} 內無足夠資料`}
              </p>
              <p className="text-xs text-gray-400 mt-1">每日造訪將自動記錄</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={filteredHistoryData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  {CATEGORY_META.map((cat) => (
                    <linearGradient
                      key={cat.key}
                      id={`grad-${cat.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={cat.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={cat.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatCompactNumber(v)}
                  width={68}
                />
                <Tooltip content={<HistoryTooltip />} />
                {CATEGORY_META.map((cat) => (
                  <Area
                    key={cat.key}
                    type="monotone"
                    dataKey={cat.key}
                    name={cat.label}
                    stroke={cat.color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${cat.key})`}
                    stackId="1"
                    dot={false}
                    activeDot={{ r: 3, fill: cat.color }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-4">
            {CATEGORY_META.map((cat) => (
              <span key={cat.key} className="inline-flex items-center gap-2 text-[11px] text-[color:var(--muted-foreground)]">
                <span
                  className="h-[3px] w-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Allocation vs Target + Top Holdings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Allocation analysis */}
        <div className="card-premium rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">配比 vs 目標</h2>
          <div className="space-y-4">
            {allocationRows.map((row) => (
              <div key={row.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="text-sm text-gray-700">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {row.actual.toFixed(1)}%
                    </span>
                    {row.target !== null && (
                      <span
                        className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded ${
                          Math.abs(row.drift ?? 0) < 2
                            ? "text-gray-400 bg-gray-100"
                            : (row.drift ?? 0) > 0
                            ? "text-[#f44336] bg-[#f44336]/10"
                            : "text-[#7bb155] bg-[#7bb155]/10"
                        }`}
                      >
                        {(row.drift ?? 0) >= 0 ? "+" : ""}
                        {(row.drift ?? 0).toFixed(1)}%
                      </span>
                    )}
                    {row.target === null && (
                      <span className="text-xs text-gray-300">無目標</span>
                    )}
                  </div>
                </div>
                <div className="relative h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(row.actual, 100)}%`,
                      backgroundColor: row.color,
                      opacity: 0.8,
                    }}
                  />
                  {row.target !== null && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-gray-500 opacity-50"
                      style={{ left: `${Math.min(row.target, 100)}%` }}
                    />
                  )}
                </div>
                {row.target !== null && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    目標 {row.target.toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>

          {allocationRows.some(
            (r) => r.target !== null && Math.abs(r.drift ?? 0) > 5
          ) && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                部分類別配比偏離目標超過 5%，建議考慮再平衡。
              </p>
            </div>
          )}
        </div>

        {/* Top holdings with sort toggle */}
        <div className="card-premium rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">持倉排行</h2>
            <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
              {(["value", "pnl_pct"] as HoldingsSort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setHoldingsSort(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    holdingsSort === s
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {s === "value" ? "市值" : "損益率"}
                </button>
              ))}
            </div>
          </div>

          {sortedHoldings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TrendingDown className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm">尚無持倉資料</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedHoldings.map((h, i) => (
                <div
                  key={h.symbol}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-xs text-gray-300 w-4 shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div
                    className="h-6 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: h.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {h.symbol}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{h.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {holdingsSort === "value" ? (
                      <>
                        <p className="text-sm font-semibold text-gray-900 tabular-nums">
                          {h.pct.toFixed(1)}%
                        </p>
                        <p
                          className={`text-[11px] tabular-nums ${
                            h.pnl >= 0 ? "text-[#f44336]" : "text-[#7bb155]"
                          }`}
                        >
                          {h.pnl >= 0 ? "+" : ""}
                          {formatTWD(h.pnl)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            h.pnlPct >= 0 ? "text-[#f44336]" : "text-[#7bb155]"
                          }`}
                        >
                          {h.pnlPct >= 0 ? "+" : ""}
                          {h.pnlPct.toFixed(1)}%
                        </p>
                        <p className="text-[11px] text-gray-400 tabular-nums">
                          {formatTWD(h.marketValueTwd)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Debt Analysis ── */}
      {debtSummary && (
        <div className="card-premium rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">負債分析</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="text-xs text-gray-400 mb-1">剩餘總負債</p>
              <p className="text-lg font-bold text-[#f44336] tabular-nums">
                {formatTWD(debtSummary.totalRemaining)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">原始本金</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                {formatTWD(debtSummary.totalOriginal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">月還款</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                {formatTWD(debtSummary.totalMonthly)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">預估剩餘利息</p>
              <p className="text-lg font-bold text-amber-600 tabular-nums">
                {formatTWD(debtSummary.totalInterest)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {debtSummary.rows.map((r) => {
              const d = r.d;
              const paidPct =
                d.principalTotal > 0
                  ? ((d.principalTotal - r.remainingBalance) / d.principalTotal) * 100
                  : 0;
              return (
                <div key={d.id}>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    {d.name}
                  </p>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(paidPct, 100)}%`,
                        background: "linear-gradient(90deg, #cd7b65, #e8b462)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <p className="text-[11px] text-gray-400">
                      已還 {paidPct.toFixed(1)}% · 剩餘 {r.remainingTerms} 期
                    </p>
                    <p className="text-[11px] text-gray-400 tabular-nums">
                      {formatTWD(r.remainingBalance)} 剩餘 · {(d.interestRate * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
