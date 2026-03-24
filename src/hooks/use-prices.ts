import useSWR from "swr";
import type { TwStockPrice, UsStockPrice, CryptoPrice, FxRateData } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PRICE_INTERVAL = 15 * 1000; // 15 seconds – real-time prices
const FX_INTERVAL = 5 * 60 * 1000; // 5 minutes – FX rate changes slowly

export function useTwStockPrices() {
  return useSWR<Record<string, TwStockPrice>>(
    "/api/prices/tw-stocks",
    fetcher,
    {
      refreshInterval: PRICE_INTERVAL,
      revalidateOnFocus: true,
    }
  );
}

export function useUsStockPrices() {
  return useSWR<Record<string, UsStockPrice>>(
    "/api/prices/us-stocks",
    fetcher,
    {
      refreshInterval: PRICE_INTERVAL,
      revalidateOnFocus: true,
    }
  );
}

export function useCryptoPrices() {
  return useSWR<Record<string, CryptoPrice>>(
    "/api/prices/crypto",
    fetcher,
    {
      refreshInterval: PRICE_INTERVAL,
      revalidateOnFocus: true,
    }
  );
}

export function useFxRate() {
  return useSWR<FxRateData>("/api/prices/fx", fetcher, {
    refreshInterval: FX_INTERVAL,
    revalidateOnFocus: true,
  });
}
