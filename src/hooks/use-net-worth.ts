import { useMemo } from "react";
import { useHoldings } from "./use-holdings";
import {
  useTwStockPrices,
  useUsStockPrices,
  useCryptoPrices,
  useFxRate,
} from "./use-prices";
import type {
  HoldingWithPrice,
  CategoryValues,
  NetWorthData,
  Holding,
} from "@/types";

export function useNetWorth(): NetWorthData & { isLoading: boolean } {
  const { holdings } = useHoldings();
  const { data: twPrices } = useTwStockPrices();
  const { data: usPrices } = useUsStockPrices();
  const { data: cryptoPrices } = useCryptoPrices();
  const { data: fxData } = useFxRate();

  const isLoading = !holdings || !fxData;

  return useMemo(() => {
    const usdTwd = fxData?.usdTwd ?? 32;

    const holdingsWithPrices: HoldingWithPrice[] = [];
    const categoryValues: CategoryValues = {
      tw_stock: 0,
      us_stock: 0,
      crypto: 0,
      cash: 0,
      debt: 0,
    };

    if (!holdings) {
      return {
        totalNetWorth: 0,
        categoryValues,
        holdingsWithPrices,
        isLoading: true,
      };
    }

    // Process TW stocks
    for (const h of holdings["tw_stock"] ?? []) {
      const holding = h as unknown as Holding;
      const priceData = twPrices?.[holding.symbol];
      const currentPrice = priceData?.price ?? null;
      const marketValue =
        currentPrice != null ? currentPrice * holding.quantity : null;
      const marketValueTwd = marketValue;
      const costTotal =
        holding.costBasis != null ? holding.costBasis * holding.quantity : null;
      const profitLoss =
        marketValue != null && costTotal != null
          ? marketValue - costTotal
          : null;
      const profitLossPercent =
        profitLoss != null && costTotal != null && costTotal !== 0
          ? (profitLoss / costTotal) * 100
          : null;

      holdingsWithPrices.push({
        ...holding,
        currentPrice,
        marketValue,
        marketValueTwd,
        change: priceData?.change ?? null,
        changePercent: priceData?.changePercent ?? null,
        profitLoss,
        profitLossPercent,
      });

      if (marketValueTwd != null) {
        categoryValues.tw_stock += marketValueTwd;
      }
    }

    // Process US stocks
    for (const h of holdings["us_stock"] ?? []) {
      const holding = h as unknown as Holding;
      const priceData = usPrices?.[holding.symbol];
      const currentPrice = priceData?.price ?? null;
      const marketValue =
        currentPrice != null ? currentPrice * holding.quantity : null;
      const marketValueTwd =
        marketValue != null ? marketValue * usdTwd : null;
      const costTotal =
        holding.costBasis != null ? holding.costBasis * holding.quantity : null;
      const profitLoss =
        marketValue != null && costTotal != null
          ? marketValue - costTotal
          : null;
      const profitLossPercent =
        profitLoss != null && costTotal != null && costTotal !== 0
          ? (profitLoss / costTotal) * 100
          : null;

      holdingsWithPrices.push({
        ...holding,
        currentPrice,
        marketValue,
        marketValueTwd,
        change: priceData?.change ?? null,
        changePercent: priceData?.changePercent ?? null,
        profitLoss,
        profitLossPercent,
      });

      if (marketValueTwd != null) {
        categoryValues.us_stock += marketValueTwd;
      }
    }

    // Process crypto
    for (const h of holdings["crypto"] ?? []) {
      const holding = h as unknown as Holding;
      const priceData = cryptoPrices?.[holding.symbol.toUpperCase()];
      const currentPrice = priceData?.price ?? null;
      const marketValue =
        currentPrice != null ? currentPrice * holding.quantity : null;
      const marketValueTwd =
        marketValue != null ? marketValue * usdTwd : null;
      const costTotal =
        holding.costBasis != null ? holding.costBasis * holding.quantity : null;
      const profitLoss =
        marketValue != null && costTotal != null
          ? marketValue - costTotal
          : null;
      const profitLossPercent =
        profitLoss != null && costTotal != null && costTotal !== 0
          ? (profitLoss / costTotal) * 100
          : null;

      holdingsWithPrices.push({
        ...holding,
        currentPrice,
        marketValue,
        marketValueTwd,
        change: priceData?.change24h ?? null,
        changePercent: priceData?.change24h ?? null,
        profitLoss,
        profitLossPercent,
      });

      if (marketValueTwd != null) {
        categoryValues.crypto += marketValueTwd;
      }
    }

    // Process cash
    for (const h of holdings["cash"] ?? []) {
      const holding = h as unknown as Holding;
      const isTwd = holding.costCurrency === "TWD";
      const marketValue = holding.quantity;
      const marketValueTwd = isTwd ? marketValue : marketValue * usdTwd;

      holdingsWithPrices.push({
        ...holding,
        currentPrice: 1,
        marketValue,
        marketValueTwd,
        change: null,
        changePercent: null,
        profitLoss: null,
        profitLossPercent: null,
      });

      categoryValues.cash += marketValueTwd;
    }

    const totalNetWorth =
      categoryValues.tw_stock +
      categoryValues.us_stock +
      categoryValues.crypto +
      categoryValues.cash -
      categoryValues.debt;

    return {
      totalNetWorth: Math.round(totalNetWorth),
      categoryValues: {
        tw_stock: Math.round(categoryValues.tw_stock),
        us_stock: Math.round(categoryValues.us_stock),
        crypto: Math.round(categoryValues.crypto),
        cash: Math.round(categoryValues.cash),
        debt: Math.round(categoryValues.debt),
      },
      holdingsWithPrices,
      isLoading,
    };
  }, [holdings, twPrices, usPrices, cryptoPrices, fxData, isLoading]);
}
