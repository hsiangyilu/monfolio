import { NextResponse } from "next/server";
import { fetchFxRate } from "@/lib/api/fx";

export async function GET() {
  try {
    const rate = await fetchFxRate();
    return NextResponse.json(rate);
  } catch (error) {
    console.error("FX rate API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch FX rate" },
      { status: 500 }
    );
  }
}
