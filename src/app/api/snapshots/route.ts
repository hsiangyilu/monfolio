import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const snapshots = await prisma.portfolioSnapshot.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("Snapshots GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      totalNetWorth,
      twStockValue,
      usStockValue,
      cryptoValue,
      cashValue,
      debtValue,
      fxRateUsdTwd,
      snapshotData,
    } = body;

    if (totalNetWorth == null || fxRateUsdTwd == null) {
      return NextResponse.json(
        { error: "Missing required fields: totalNetWorth, fxRateUsdTwd" },
        { status: 400 }
      );
    }

    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        totalNetWorth,
        twStockValue: twStockValue ?? 0,
        usStockValue: usStockValue ?? 0,
        cryptoValue: cryptoValue ?? 0,
        cashValue: cashValue ?? 0,
        debtValue: debtValue ?? 0,
        fxRateUsdTwd,
        snapshotData:
          typeof snapshotData === "string"
            ? snapshotData
            : JSON.stringify(snapshotData ?? {}),
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error("Snapshots POST error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
