"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatTWD, formatPercent, formatCompactNumber } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Bitcoin,
  Wallet,
  CreditCard,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from "lucide-react";
import OverviewUpload from "@/components/ocr/overview-upload";
import type {
  Holding,
  GroupedHoldings,
  TwStockPrice,
  UsStockPrice,
  CryptoPrice,
  FxRateData,
  PortfolioSnapshot,
  TargetAllocation,
} from "@/types/index";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CATEGORY_META = [
  {
    key: "tw_stock" as const,
    label: "台股",
    slug: "/tw-stocks",
    icon: TrendingUp,
    color: "#e8b462",
  },
  {
    key: "us_stock" as const,
    label: "美股",
    slug: "/us-stocks",
    icon: Globe,
    color: "#cd7b65",
  },
  {
    key: "crypto" as const,
    label: "虛擬貨幣",
    slug: "/crypto",
    icon: Bitcoin,
    color: "#f8a01d",
  },
  {
    key: "cash" as const,
    label: "現金",
    slug: "/cash",
    icon: Wallet,
    color: "#7bb155",
  },
  {
    key: "debt" as const,
    label: "負債",
    slug: "/debt",
    icon: CreditCard,
    color: "#f44336",
  },
];

function ChartTooltip({
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
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs text-gray-400">
        {label}
      </p>
      <p className="text-sm font-bold text-gray-900">
        {formatTWD(payload[0].value)}
      </p>
    </div>
  );
}

const MASK = "••••••";

export default function ClientHomePage() {
  const [masked, setMasked] = useState(false);
  const toggleMask = useCallback(() => setMasked((v) => !v), []);

  const { data: holdings, isLoading: holdingsLoading, mutate: mutateHoldings } =
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
  const { data: fxRate } = useSWR<FxRateData>("/api/prices/fx-rate", fetcher);
  const { data: snapshots } = useSWR<PortfolioSnapshot[]>(
    "/api/snapshots",
    fetcher
  );
  const { data: targets } = useSWR<TargetAllocation[]>(
    "/api/settings/targets",
    fetcher
  );

  const isLoading = holdingsLoading;
  const usdTwd = fxRate?.usdTwd ?? 31;

  const categoryValues = useMemo(() => {
    if (!holdings)
      return { tw_stock: 0, us_stock: 0, crypto: 0, cash: 0, debt: 0 };

    let tw_stock = 0;
    holdings["tw_stock"]?.forEach((h: Holding) => {
      const price = twPrices?.[h.symbol]?.price ?? 0;
      tw_stock += h.quantity * price;
    });

    let us_stock = 0;
    holdings["us_stock"]?.forEach((h: Holding) => {
      const price = usPrices?.[h.symbol]?.price ?? 0;
      us_stock += h.quantity * price * usdTwd;
    });

    let crypto = 0;
    holdings["crypto"]?.forEach((h: Holding) => {
      const price = cryptoPrices?.[h.symbol]?.price ?? 0;
      crypto += h.quantity * price * usdTwd;
    });

    let cash = 0;
    holdings["cash"]?.forEach((h: Holding) => {
      if (h.costCurrency === "USD") {
        cash += h.quantity * usdTwd;
      } else {
        cash += h.quantity;
      }
    });

    return { tw_stock, us_stock, crypto, cash, debt: 0 };
  }, [holdings, twPrices, usPrices, cryptoPrices, usdTwd]);

  const totalNetWorth =
    categoryValues.tw_stock +
    categoryValues.us_stock +
    categoryValues.crypto +
    categoryValues.cash;

  const totalUnrealizedPnl = useMemo(() => {
    if (!holdings) return 0;
    let pnl = 0;
    holdings["tw_stock"]?.forEach((h: Holding) => {
      const price = twPrices?.[h.symbol]?.price ?? 0;
      pnl += h.quantity * price - (h.costBasis ?? 0);
    });
    holdings["us_stock"]?.forEach((h: Holding) => {
      const price = usPrices?.[h.symbol]?.price ?? 0;
      pnl += h.quantity * price * usdTwd - (h.costBasis ?? 0);
    });
    holdings["crypto"]?.forEach((h: Holding) => {
      const price = cryptoPrices?.[h.symbol]?.price ?? 0;
      pnl += h.quantity * price * usdTwd - (h.costBasis ?? 0);
    });
    return pnl;
  }, [holdings, twPrices, usPrices, cryptoPrices, usdTwd]);

  const todayChange = useMemo(() => {
    if (!holdings) return 0;
    let change = 0;
    holdings["tw_stock"]?.forEach((h: Holding) => {
      change += h.quantity * (twPrices?.[h.symbol]?.change ?? 0);
    });
    holdings["us_stock"]?.forEach((h: Holding) => {
      change += h.quantity * (usPrices?.[h.symbol]?.change ?? 0) * usdTwd;
    });
    holdings["crypto"]?.forEach((h: Holding) => {
      const price = cryptoPrices?.[h.symbol]?.price ?? 0;
      const change24h = cryptoPrices?.[h.symbol]?.change24h ?? 0;
      const prevPrice = change24h !== 0 ? price / (1 + change24h / 100) : price;
      change += h.quantity * (price - prevPrice) * usdTwd;
    });
    return change;
  }, [holdings, twPrices, usPrices, cryptoPrices, usdTwd]);

  const chartData = useMemo(() => {
    if (!snapshots) return [];
    return snapshots.map((s) => ({
      date: new Date(s.createdAt).toLocaleDateString("zh-TW", {
        month: "short",
        day: "numeric",
      }),
      value: s.totalNetWorth,
    }));
  }, [snapshots]);

  const allocationData = useMemo(() => {
    return [
      { name: "台股", value: categoryValues.tw_stock, color: "#e8b462" },
      { name: "美股", value: categoryValues.us_stock, color: "#cd7b65" },
      { name: "虛擬貨幣", value: categoryValues.crypto, color: "#f8a01d" },
      { name: "現金", value: categoryValues.cash, color: "#7bb155" },
    ].filter((d) => d.value > 0);
  }, [categoryValues]);

  const targetMap = useMemo(() => {
    const map = new Map<string, number>();
    const labelMap: Record<string, string> = {
      tw_stock: "台股",
      us_stock: "美股",
      crypto: "虛擬貨幣",
      cash: "現金",
    };
    targets?.forEach((t) => {
      const label = labelMap[t.category] ?? t.category;
      map.set(label, t.targetPct);
    });
    return map;
  }, [targets]);

  const todayChangePct =
    totalNetWorth > 0
      ? (todayChange / (totalNetWorth - todayChange)) * 100
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card-premium rounded-xl p-8 animate-pulse">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
          <div className="h-10 w-56 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card-premium rounded-xl p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                <div className="h-6 w-28 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="col-span-12 lg:col-span-8 card-premium rounded-2xl p-6 animate-pulse">
            <div className="h-[380px] bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero: Total Net Worth */}
      <div className="card-premium rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Total Net Worth
              </p>
              <button
                onClick={toggleMask}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={masked ? "顯示金額" : "隱藏金額"}
              >
                {masked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-none">
              {masked ? `NT$ ${MASK}` : formatTWD(totalNetWorth)}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold ${
                  todayChange >= 0
                    ? "bg-[#f44336]/10 text-[#f44336]"
                    : "bg-[#7bb155]/10 text-[#7bb155]"
                }`}
              >
                {todayChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {formatPercent(todayChangePct)}
              </span>
              <span className="text-sm text-gray-400">
                {masked ? "NT$ ••••" : `${todayChange >= 0 ? "+" : ""}${formatTWD(todayChange)}`} today
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">USD / TWD</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                {usdTwd.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">未實現損益</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  masked ? "text-gray-400" : totalUnrealizedPnl >= 0 ? "text-[#f44336]" : "text-[#7bb155]"
                }`}
              >
                {masked ? `NT$ ${MASK}` : `${totalUnrealizedPnl >= 0 ? "+" : ""}${formatTWD(totalUnrealizedPnl)}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: Asset List + Chart */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left column: Asset categories */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-3">
          {CATEGORY_META.map((cat) => {
            const Icon = cat.icon;
            const value =
              cat.key === "debt"
                ? categoryValues.debt
                : categoryValues[cat.key] ?? 0;
            const pct =
              totalNetWorth > 0 && cat.key !== "debt"
                ? (value / totalNetWorth) * 100
                : 0;
            const target = targetMap.get(cat.label);

            return (
              <Link
                key={cat.key}
                href={cat.slug}
                className="group block rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-150 hover:border-gray-300 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        background: `${cat.color}15`,
                      }}
                    >
                      <Icon
                        className="w-[18px] h-[18px]"
                        style={{ color: cat.color }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                        {cat.label}
                      </p>
                      {cat.key !== "debt" && (
                        <p className="text-[11px] text-gray-400 tabular-nums">
                          {pct.toFixed(1)}%
                          {target !== undefined && (
                            <span className="text-gray-300">
                              {" "}
                              / 目標 {target.toFixed(0)}%
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {cat.key === "debt" ? "—" : masked ? "NT$ ••••" : formatTWD(value)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
                {cat.key !== "debt" && totalNetWorth > 0 && (
                  <div className="mt-3 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                )}
              </Link>
            );
          })}

          {/* Mini allocation donut */}
          <div className="card-premium rounded-lg p-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              配比
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        allocationData.length > 0
                          ? allocationData
                          : [{ name: "empty", value: 1, color: "#e5e7eb" }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {(allocationData.length > 0
                        ? allocationData
                        : [{ name: "empty", value: 1, color: "#e5e7eb" }]
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {allocationData.map((item) => {
                  const pct =
                    totalNetWorth > 0
                      ? (item.value / totalNetWorth) * 100
                      : 0;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-gray-500">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Net Worth Chart */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="card-premium rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">
                總資產走勢
              </h2>
              <div className="flex items-center gap-2">
                {todayChange !== 0 && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                      todayChange >= 0
                        ? "text-[#f44336] bg-[#f44336]/10"
                        : "text-[#7bb155] bg-[#7bb155]/10"
                    }`}
                  >
                    {todayChange >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatPercent(todayChangePct)}
                  </span>
                )}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="flex flex-col h-[380px] items-center justify-center text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">尚無歷史資料</p>
                <p className="text-xs text-gray-400 mt-1">
                  新增持倉後將自動記錄淨值走勢
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="homeNetWorthGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#e8b462"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="#e8b462"
                        stopOpacity={0}
                      />
                    </linearGradient>
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
                    tickFormatter={(v: number) =>
                      formatCompactNumber(v)
                    }
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#e8b462"
                    strokeWidth={2.5}
                    fill="url(#homeNetWorthGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#e8b462",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Overview Upload */}
      <OverviewUpload onConfirm={() => mutateHoldings()} />
    </div>
  );
}
