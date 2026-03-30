import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const debts = await prisma.debt.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(debts);
  } catch (error) {
    console.error("Debt GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt info" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      principalTotal,
      remainingBalance,
      interestRate,
      remainingTerms,
      monthlyPayment,
      paymentDay,
      startDate,
    } = body;

    if (!id) {
      // Create new debt if no ID provided
      if (!name || principalTotal == null || remainingBalance == null) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: name, principalTotal, remainingBalance",
          },
          { status: 400 }
        );
      }

      const debt = await prisma.debt.create({
        data: {
          name,
          principalTotal,
          remainingBalance,
          interestRate: interestRate ?? 0,
          remainingTerms: remainingTerms ?? 0,
          monthlyPayment: monthlyPayment ?? 0,
          paymentDay: paymentDay ?? null,
          startDate: startDate ? new Date(startDate) : null,
        },
      });
      return NextResponse.json(debt, { status: 201 });
    }

    // Update existing debt
    const existing = await prisma.debt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    const debt = await prisma.debt.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(principalTotal !== undefined && { principalTotal }),
        ...(remainingBalance !== undefined && { remainingBalance }),
        ...(interestRate !== undefined && { interestRate }),
        ...(remainingTerms !== undefined && { remainingTerms }),
        ...(monthlyPayment !== undefined && { monthlyPayment }),
        ...(paymentDay !== undefined && { paymentDay: paymentDay ?? null }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
      },
    });

    return NextResponse.json(debt);
  } catch (error) {
    console.error("Debt PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update debt" },
      { status: 500 }
    );
  }
}
