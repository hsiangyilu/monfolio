import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.holding.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Holding not found" },
        { status: 404 }
      );
    }

    const holding = await prisma.holding.update({
      where: { id },
      data: {
        ...(body.category !== undefined && { category: body.category }),
        ...(body.symbol !== undefined && { symbol: body.symbol }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.costBasis !== undefined && { costBasis: body.costBasis }),
        ...(body.costCurrency !== undefined && {
          costCurrency: body.costCurrency,
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json(holding);
  } catch (error) {
    console.error("Holding PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update holding" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.holding.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Holding not found" },
        { status: 404 }
      );
    }

    await prisma.holding.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Holding DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete holding" },
      { status: 500 }
    );
  }
}
