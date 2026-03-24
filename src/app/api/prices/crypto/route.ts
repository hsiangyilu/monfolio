import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchCryptoPrices } from "@/lib/api/crypto";

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany({
      where: { category: "crypto" },
      select: { symbol: true },
    });

    const symbols = holdings.map((h) => h.symbol);
    if (symbols.length === 0) {
      return NextResponse.json({});
    }

    const prices = await fetchCryptoPrices(symbols);
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Crypto price API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch crypto prices" },
      { status: 500 }
    );
  }
}
