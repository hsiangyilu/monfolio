import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeSnapshot, hasSnapshotToday } from "@/lib/snapshot";

/**
 * Daily snapshot cron, called by Vercel Cron.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically.
 * Set CRON_SECRET in Vercel project env (any random string, e.g. `openssl rand -hex 32`).
 *
 * Dedup: skips if a snapshot already exists today (UTC). Safe to retry / call manually.
 *
 * Schedule: see vercel.json. Default = 06:00 UTC (14:00 Taipei, post tw close).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // No secret configured: only allow on Vercel (which sets x-vercel-cron-signature)
    // or block entirely in production.
    if (process.env.VERCEL_ENV === "production") {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }
  }

  try {
    if (await hasSnapshotToday()) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "snapshot already exists today",
      });
    }

    const totals = await computeSnapshot();
    const snapshot = await prisma.portfolioSnapshot.create({ data: totals });

    return NextResponse.json({
      ok: true,
      id: snapshot.id,
      totalNetWorth: snapshot.totalNetWorth,
    });
  } catch (error) {
    console.error("Snapshot cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to write snapshot",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
