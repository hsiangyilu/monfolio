import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchTwStockPrices } from "@/lib/api/tw-stocks";

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany({
      where: { category: "tw_stock" },
      select: { symbol: true },
    });

    const symbols = holdings.map((h) => h.symbol);
    if (symbols.length === 0) {
      return NextResponse.json({});
    }

    const prices = await fetchTwStockPrices(symbols);
    return NextResponse.json(prices);
  } catch (error) {
    console.error("TW stocks price API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TW stock prices" },
      { status: 500 }
    );
  }
}
