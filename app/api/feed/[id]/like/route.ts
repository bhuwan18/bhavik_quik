import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: activityId } = await params;

  const activity = await prisma.feedActivity.findUnique({
    where: { id: activityId },
    select: { id: true, userId: true },
  });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.feedLike.findUnique({
    where: { userId_activityId: { userId: session.user.id, activityId } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.feedLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.feedLike.create({ data: { userId: session.user.id, activityId } });
    liked = true;

    // Notify activity owner (not self-likes)
    if (activity.userId !== session.user.id) {
      const liker = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });
      const name = liker?.name ?? "Someone";
      prisma.notification.create({
        data: {
          userId: activity.userId,
          type: "feed_like",
          message: `${name} liked your activity ❤️`,
        },
      }).catch(() => {});
      sendPushToUser(activity.userId, "New like ❤️", `${name} liked your activity`, "/feed").catch(() => {});
    }
  }

  const likeCount = await prisma.feedLike.count({ where: { activityId } });
  return NextResponse.json({ liked, likeCount });
}
