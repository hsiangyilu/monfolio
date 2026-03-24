import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchUsStockPrices } from "@/lib/api/us-stocks";

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany({
      where: { category: "us_stock" },
      select: { symbol: true },
    });

    const symbols = holdings.map((h) => h.symbol);
    if (symbols.length === 0) {
      return NextResponse.json({});
    }

    const prices = await fetchUsStockPrices(symbols);
    return NextResponse.json(prices);
  } catch (error) {
    console.error("US stocks price API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch US stock prices" },
      { status: 500 }
    );
  }
}
