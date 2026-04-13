import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

const ALLOWED_EMOJIS = new Set(["🔥", "🎉", "👏", "😱"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: activityId } = await params;

  let emoji: string;
  try {
    const body = await req.json();
    emoji = String(body.emoji ?? "").trim();
    if (!ALLOWED_EMOJIS.has(emoji)) throw new Error("Invalid emoji");
  } catch {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const activity = await prisma.feedActivity.findUnique({
    where: { id: activityId },
    select: { id: true, userId: true, type: true },
  });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.feedReaction.findUnique({
    where: { userId_activityId_emoji: { userId: session.user.id, activityId, emoji } },
  });

  let reacted: boolean;
  if (existing) {
    await prisma.feedReaction.delete({ where: { id: existing.id } });
    reacted = false;
  } else {
    await prisma.feedReaction.create({ data: { userId: session.user.id, activityId, emoji } });
    reacted = true;

    // Notify activity owner (not self-reactions)
    if (activity.userId !== session.user.id) {
      const reactor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });
      const name = reactor?.name ?? "Someone";
      prisma.notification.create({
        data: {
          userId: activity.userId,
          type: "feed_reaction",
          message: `${name} reacted ${emoji} to your activity`,
        },
      }).catch(() => {});
      sendPushToUser(activity.userId, `New reaction ${emoji}`, `${name} reacted to your activity`, "/feed").catch(() => {});
    }
  }

  // Return updated reaction counts for this activity
  const allReactions = await prisma.feedReaction.findMany({
    where: { activityId },
    select: { emoji: true, userId: true },
  });

  const reactionMap = new Map<string, { count: number; reacted: boolean }>();
  for (const r of allReactions) {
    const cur = reactionMap.get(r.emoji) ?? { count: 0, reacted: false };
    reactionMap.set(r.emoji, {
      count: cur.count + 1,
      reacted: cur.reacted || r.userId === session.user.id,
    });
  }
  const reactions = Array.from(reactionMap.entries()).map(([e, v]) => ({ emoji: e, ...v }));

  return NextResponse.json({ emoji, reacted, reactions });
}
