import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { spawnNextBoss } from "@/lib/boss";

// Called daily by Vercel Cron. A daily check against each boss's 7-day expiresAt
// produces the intended weekly cadence while self-healing a missed run.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const { count: expiredCount } = await prisma.boss.updateMany({
    where: { status: "active", expiresAt: { lt: now } },
    data: { status: "expired" },
  });

  const stillActive = await prisma.boss.findFirst({ where: { status: "active" } });

  let spawned = false;
  if (!stillActive) {
    await spawnNextBoss();
    spawned = true;
  }

  console.log(`[cron/boss-cycle] expired ${expiredCount} boss(es), spawned=${spawned}`);
  return NextResponse.json({ expired: expiredCount, spawned });
}
