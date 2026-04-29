import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, holdings } = body;

    if (!category || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: category, holdings[]" },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;

    for (const h of holdings) {
      const { symbol, name, quantity, costBasis } = h;
      const cleanSymbol = String(symbol).trim();

      if (!cleanSymbol || quantity == null) continue;

      // Check if this holding already exists — also try "00" prefix for TW ETFs
      // Excel strips leading zeros: 006208 → 6208, so we check both variants
      let existing = await prisma.holding.findUnique({
        where: {
          category_symbol: { category, symbol: cleanSymbol },
        },
      });

      let resolvedSymbol = cleanSymbol;

      if (!existing && category === "tw_stock" && /^\d{4}$/.test(cleanSymbol)) {
        const paddedSymbol = "00" + cleanSymbol;
        const paddedExisting = await prisma.holding.findUnique({
          where: {
            category_symbol: { category, symbol: paddedSymbol },
          },
        });
        if (paddedExisting) {
          existing = paddedExisting;
          resolvedSymbol = paddedSymbol;
        }
      }

      if (existing) {
        // UPDATE existing holding
        await prisma.holding.update({
          where: { id: existing.id },
          data: {
            name: String(name || resolvedSymbol),
            quantity: Number(quantity) || 0,
            costBasis: costBasis != null ? Number(costBasis) : existing.costBasis,
            costCurrency: existing.costCurrency || "TWD",
          },
        });
        updated++;
      } else {
        // CREATE new holding
        await prisma.holding.create({
          data: {
            category,
            symbol: resolvedSymbol,
            name: String(name || resolvedSymbol),
            quantity: Number(quantity) || 0,
            costBasis: costBasis != null ? Number(costBasis) : null,
            costCurrency: "TWD",
          },
        });
        created++;
      }
    }

    return NextResponse.json(
      {
        message: `匯入完成：${updated} 筆更新，${created} 筆新增`,
        updated,
        created,
        total: updated + created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Batch holdings error:", error);
    return NextResponse.json(
      { error: "批次儲存持股失敗" },
      { status: 500 }
    );
  }
}

// GET: Preview which items will be updated vs created (for UI display)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, symbols } = body;

    if (!category || !Array.isArray(symbols)) {
      return NextResponse.json({ existing: [] });
    }

    const allSymbols = symbols.map(String);
    // Also check "00"-prefixed variants for TW ETFs (Excel strips leading zeros)
    const expandedSymbols = [...allSymbols];
    if (category === "tw_stock") {
      for (const s of allSymbols) {
        if (/^\d{4}$/.test(s)) expandedSymbols.push("00" + s);
      }
    }

    const existingHoldings = await prisma.holding.findMany({
      where: {
        category,
        symbol: { in: expandedSymbols },
      },
      select: { symbol: true, quantity: true, costBasis: true },
    });

    // Map "00"-prefixed results back to the original symbol for the UI
    const result = existingHoldings.map((h) => {
      const shortSymbol = h.symbol.startsWith("00") ? h.symbol.slice(2) : null;
      const matchesOriginal = allSymbols.includes(h.symbol);
      const matchesShort = shortSymbol && allSymbols.includes(shortSymbol);
      return {
        ...h,
        // If the UI sent "6208" but DB has "006208", report as "6208" so the UI can match
        symbol: matchesOriginal ? h.symbol : matchesShort ? shortSymbol : h.symbol,
      };
    });

    return NextResponse.json({
      existing: result,
    });
  } catch {
    return NextResponse.json({ existing: [] });
  }
}
