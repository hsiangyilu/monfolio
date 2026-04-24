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
      totalTerms,
      remainingTerms,
      monthlyPayment,
      paymentDay,
      startDate,
    } = body;

    // interestRate must be stored as a decimal (e.g. 0.0238 for 2.38%).
    // Reject values > 1 to prevent accidentally storing percent (e.g. 2.38).
    if (interestRate != null && interestRate > 1) {
      return NextResponse.json(
        { error: "interestRate must be a decimal (e.g. 0.0238 for 2.38%), not a percentage" },
        { status: 400 }
      );
    }
    if (totalTerms != null && (totalTerms < 0 || !Number.isInteger(totalTerms))) {
      return NextResponse.json(
        { error: "totalTerms must be a non-negative integer" },
        { status: 400 }
      );
    }

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
          totalTerms: totalTerms ?? 0,
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
        ...(totalTerms !== undefined && { totalTerms }),
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
