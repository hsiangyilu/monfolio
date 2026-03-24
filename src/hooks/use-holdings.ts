import useSWR from "swr";
import type { GroupedHoldings, CreateHoldingInput, UpdateHoldingInput } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useHoldings() {
  const { data, error, isLoading, mutate } = useSWR<GroupedHoldings>(
    "/api/holdings",
    fetcher,
    { revalidateOnFocus: false }
  );

  async function addHolding(input: CreateHoldingInput) {
    const res = await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create holding");
    }
    const holding = await res.json();
    await mutate();
    return holding;
  }

  async function updateHolding(id: string, input: UpdateHoldingInput) {
    const res = await fetch(`/api/holdings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update holding");
    }
    const holding = await res.json();
    await mutate();
    return holding;
  }

  async function deleteHolding(id: string) {
    const res = await fetch(`/api/holdings/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete holding");
    }
    await mutate();
  }

  return {
    holdings: data,
    isLoading,
    error,
    mutate,
    addHolding,
    updateHolding,
    deleteHolding,
  };
}
