import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Called daily by Vercel Cron. Deletes FeedActivity older than 30 days.
// Cascade deletes FeedLike, FeedComment, FeedReaction automatically.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { count } = await prisma.feedActivity.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(`[cron/cleanup-feed] deleted ${count} rows older than ${cutoff.toISOString()}`);
  return NextResponse.json({ deleted: count });
}
