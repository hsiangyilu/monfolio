"use client";

import { useState, useMemo, useCallback } from "react";
import { calcHoldingPnl } from "@/lib/pnl-calc";
import useSWR from "swr";
import SummaryCard from "@/components/cards/summary-card";
import HoldingsTable, {
  type HoldingRow,
} from "@/components/holdings/holdings-table";
import ScreenshotUpload, {
  type ParsedHolding,
} from "@/components/ocr/screenshot-upload";
import OcrPreview from "@/components/ocr/ocr-preview";
import { formatTWD, formatPercent } from "@/lib/format";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Scale } from "lucide-react";
import type {
  Holding,
  GroupedHoldings,
  TwStockPrice,
  UsStockPrice,
  CryptoPrice,
  FxRateData,
  HoldingCategory,
} from "@/types/index";
import { fetcher } from "@/lib/fetcher";

interface CategoryDetailPageProps {
  category: HoldingCategory;
  title: string;
  color: string;
}

export default function CategoryDetailPage({
  category,
  title,
  color,
}: CategoryDetailPageProps) {
  const { data: holdings, mutate: mutateHoldings } = useSWR<GroupedHoldings>(
    "/api/holdings",
    fetcher
  );
  const { data: twPrices } = useSWR<Record<string, TwStockPrice>>(
    category === "tw_stock" ? "/api/prices/tw-stocks" : null,
    fetcher
  );
  const { data: usPrices } = useSWR<Record<string, UsStockPrice>>(
    category === "us_stock" ? "/api/prices/us-stocks" : null,
    fetcher
  );
  const { data: cryptoPrices } = useSWR<Record<string, CryptoPrice>>(
    category === "crypto" ? "/api/prices/crypto" : null,
    fetcher
  );
  const { data: fxRate } = useSWR<FxRateData>("/api/prices/fx", fetcher);

  const [ocrResults, setOcrResults] = useState<ParsedHolding[]>([]);
  const [ocrPreviewOpen, setOcrPreviewOpen] = useState(false);

  const usdTwd = fxRate?.usdTwd ?? 31;
  const categoryHoldings = holdings?.[category] ?? [];

  const getPrice = useCallback(
    (symbol: string): number | null => {
      if (category === "tw_stock") return twPrices?.[symbol]?.price ?? null;
      if (category === "us_stock") return usPrices?.[symbol]?.price ?? null;
      if (category === "crypto") return cryptoPrices?.[symbol]?.price ?? null;
      return null;
    },
    [category, twPrices, usPrices, cryptoPrices]
  );

  const getChange = useCallback(
    (symbol: string): number => {
      if (category === "tw_stock") return twPrices?.[symbol]?.change ?? 0;
      if (category === "us_stock") return usPrices?.[symbol]?.change ?? 0;
      if (category === "crypto") {
        const price = cryptoPrices?.[symbol]?.price ?? 0;
        const change24h = cryptoPrices?.[symbol]?.change24h ?? 0;
        if (change24h === 0) return 0;
        const prevPrice = price / (1 + change24h / 100);
        return price - prevPrice;
      }
      return 0;
    },
    [category, twPrices, usPrices, cryptoPrices]
  );

  const needsFx = category === "us_stock" || category === "crypto";

  const holdingRows: HoldingRow[] = useMemo(() => {
    return categoryHoldings.map((h: Holding) => {
      const price = getPrice(h.symbol);
      if (price == null) {
        return { id: h.id, symbol: h.symbol, name: h.name, quantity: h.quantity, costBasis: h.costBasis, currentPrice: null, totalValueTwd: 0, unrealizedPnl: 0, pnlPercent: 0 };
      }
      const { totalValueTwd, pnl: unrealizedPnl, pnlPercent } = calcHoldingPnl({
        quantity: h.quantity,
        priceInNative: price,
        costBasisInNative: h.costBasis ?? 0,
        usdTwd,
        needsFx,
      });

      return {
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        costBasis: h.costBasis,
        currentPrice: price,
        totalValueTwd,
        unrealizedPnl,
        pnlPercent,
      };
    });
  }, [categoryHoldings, getPrice, needsFx, usdTwd]);

  const totalValue = holdingRows.reduce((s, h) => s + h.totalValueTwd, 0);
  const totalChange = useMemo(() => {
    return categoryHoldings.reduce((sum: number, h: Holding) => {
      const change = getChange(h.symbol);
      const fxMultiplier = needsFx ? usdTwd : 1;
      return sum + h.quantity * change * fxMultiplier;
    }, 0);
  }, [categoryHoldings, getChange, needsFx, usdTwd]);

  const { totalPnl, totalCostTwd } = useMemo(() => {
    let pnl = 0;
    let cost = 0;
    for (const row of holdingRows) {
      if (row.costBasis == null || row.currentPrice == null) continue;
      pnl += row.unrealizedPnl;
      const { costTwd } = calcHoldingPnl({ quantity: row.quantity, priceInNative: row.currentPrice, costBasisInNative: row.costBasis, usdTwd, needsFx });
      cost += costTwd;
    }
    return { totalPnl: pnl, totalCostTwd: cost };
  }, [holdingRows, needsFx, usdTwd]);

  const pnlPct = totalCostTwd > 0 ? (totalPnl / totalCostTwd) * 100 : 0;

  const changePct =
    totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;

  const handleOcrResult = (parsed: ParsedHolding[]) => {
    setOcrResults((prev) => [...prev, ...parsed]);
    setOcrPreviewOpen(true);
  };

  const handleOcrConfirm = async () => {
    await mutateHoldings(undefined, { revalidate: true });
    setOcrResults([]);
  };

  const handleAdd = async (data: {
    symbol: string;
    name: string;
    quantity: number;
    costBasis: number | null;
  }) => {
    // Temp optimistic row — real id arrives after revalidation
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticHolding: Holding = {
      id: tempId,
      category,
      symbol: data.symbol,
      name: data.name,
      quantity: data.quantity,
      costBasis: data.costBasis,
      costCurrency: "TWD",
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await mutateHoldings(
        async (current) => {
          await api<Holding>("/api/holdings", {
            method: "POST",
            json: { ...data, category },
          });
          return current; // let revalidate pick up the real row with server id
        },
        {
          optimisticData: (current) => {
            const base: GroupedHoldings = current ?? {
              tw_stock: [],
              us_stock: [],
              crypto: [],
              cash: [],
            };
            return {
              ...base,
              [category]: [...(base[category] ?? []), optimisticHolding],
            };
          },
          rollbackOnError: true,
          revalidate: true,
          populateCache: false,
        }
      );
      toast.success(`已新增 ${data.symbol}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "新增失敗";
      toast.error(`新增失敗: ${msg}`);
    }
  };

  const handleEdit = async (
    id: string,
    data: {
      symbol: string;
      name: string;
      quantity: number;
      costBasis: number | null;
    }
  ) => {
    try {
      await mutateHoldings(
        async (current) => {
          await api<Holding>(`/api/holdings/${id}`, {
            method: "PUT",
            json: data,
          });
          return current;
        },
        {
          optimisticData: (current) => {
            const base: GroupedHoldings = current ?? {
              tw_stock: [],
              us_stock: [],
              crypto: [],
              cash: [],
            };
            return {
              ...base,
              [category]: (base[category] ?? []).map((h) =>
                h.id === id ? { ...h, ...data } : h
              ),
            };
          },
          rollbackOnError: true,
          revalidate: true,
          populateCache: false,
        }
      );
      toast.success(`已更新 ${data.symbol}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "更新失敗";
      toast.error(`更新失敗,已還原: ${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    const removed = categoryHoldings.find((h) => h.id === id);
    try {
      await mutateHoldings(
        async (current) => {
          await api<void>(`/api/holdings/${id}`, { method: "DELETE" });
          return current;
        },
        {
          optimisticData: (current) => {
            const base: GroupedHoldings = current ?? {
              tw_stock: [],
              us_stock: [],
              crypto: [],
              cash: [],
            };
            return {
              ...base,
              [category]: (base[category] ?? []).filter((h) => h.id !== id),
            };
          },
          rollbackOnError: true,
          revalidate: true,
          populateCache: false,
        }
      );
      toast.success(removed ? `已刪除 ${removed.symbol}` : "已刪除");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "刪除失敗";
      toast.error(`刪除失敗,已還原: ${msg}`);
    }
  };

  const isLoading = !holdings;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card-premium rounded-xl p-5 animate-pulse">
          <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-40 bg-gray-200 rounded" />
        </div>
        <div className="card-premium rounded-xl p-6 animate-pulse">
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        {title}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title={`${title} 總市值`}
          value={formatTWD(totalValue)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <SummaryCard
          title="今日變化"
          value={formatTWD(totalChange)}
          change={formatPercent(changePct)}
          changeType={totalChange >= 0 ? "positive" : "negative"}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <SummaryCard
          title="未實現損益"
          value={totalCostTwd > 0 ? formatTWD(totalPnl) : "—"}
          change={totalCostTwd > 0 ? formatPercent(pnlPct) : undefined}
          changeType={totalPnl >= 0 ? "positive" : "negative"}
          icon={<Scale className="w-5 h-5" />}
        />
      </div>

      <HoldingsTable
        holdings={holdingRows}
        category={category}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ScreenshotUpload category={category} onResult={handleOcrResult} />

      <OcrPreview
        open={ocrPreviewOpen}
        onOpenChange={setOcrPreviewOpen}
        holdings={ocrResults}
        category={category}
        onConfirm={handleOcrConfirm}
      />
    </div>
  );
}
