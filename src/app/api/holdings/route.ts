import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { GroupedHoldings } from "@/types";

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany({
      orderBy: { updatedAt: "desc" },
    });

    const grouped: GroupedHoldings = {
      "tw_stock": [],
      "us_stock": [],
      crypto: [],
      cash: [],
    };

    for (const h of holdings) {
      const category = h.category as keyof GroupedHoldings;
      if (grouped[category]) {
        grouped[category].push(h as never);
      }
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Holdings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, symbol, name, quantity, costBasis, costCurrency, notes } =
      body;

    if (!category || !symbol || !name || quantity == null) {
      return NextResponse.json(
        { error: "Missing required fields: category, symbol, name, quantity" },
        { status: 400 }
      );
    }

    // Upsert: create or update by (category, symbol) unique constraint
    const holding = await prisma.holding.upsert({
      where: {
        category_symbol: { category, symbol },
      },
      update: {
        name,
        quantity,
        costBasis: costBasis ?? null,
        costCurrency: costCurrency ?? "TWD",
        notes: notes ?? null,
      },
      create: {
        category,
        symbol,
        name,
        quantity,
        costBasis: costBasis ?? null,
        costCurrency: costCurrency ?? "TWD",
        notes: notes ?? null,
      },
    });

    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error("Holdings POST error:", error);
    return NextResponse.json(
      { error: "Failed to create/update holding" },
      { status: 500 }
    );
  }
}
