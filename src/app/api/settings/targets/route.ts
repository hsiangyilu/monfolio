import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const targets = await prisma.targetAllocation.findMany();
    return NextResponse.json(targets);
  } catch (error) {
    console.error("Target allocation GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch target allocations" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { allocations } = await request.json();

    for (const alloc of allocations) {
      await prisma.targetAllocation.upsert({
        where: { category: alloc.category },
        update: { targetPct: alloc.targetPct },
        create: { category: alloc.category, targetPct: alloc.targetPct },
      });
    }

    const targets = await prisma.targetAllocation.findMany();
    return NextResponse.json(targets);
  } catch (error) {
    console.error("Target allocation PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save target allocations" },
      { status: 500 }
    );
  }
}
