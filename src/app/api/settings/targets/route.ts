import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
