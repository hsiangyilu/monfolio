import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const allocations = await prisma.targetAllocation.findMany({
      orderBy: { category: "asc" },
    });
    return NextResponse.json(allocations);
  } catch (error) {
    console.error("Allocation GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch target allocations" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();

    // Expect an array of { category, targetPct } or a single object
    const items = Array.isArray(body) ? body : [body];

    const results = [];
    for (const item of items) {
      const { category, targetPct } = item;

      if (!category || targetPct == null) {
        return NextResponse.json(
          { error: "Each item must have category and targetPct" },
          { status: 400 }
        );
      }

      const allocation = await prisma.targetAllocation.upsert({
        where: { category },
        update: { targetPct },
        create: { category, targetPct },
      });
      results.push(allocation);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Allocation PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update target allocations" },
      { status: 500 }
    );
  }
}
