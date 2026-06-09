import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  // Get IDs of users this person follows
  const following = await prisma.userFollow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
    take: 200,
  });
  const followingIds = following.map((f) => f.followingId);

  // Include own activities + followed users' activities
  const allUserIds = [session.user.id, ...followingIds];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const raw = await prisma.feedActivity.findMany({
    where: { userId: { in: allUserIds }, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: {
      user: { select: { id: true, name: true, image: true, lastSeenAt: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  const hasMore = raw.length > PAGE_SIZE;
  const page_activities = raw.slice(0, PAGE_SIZE);

  // Single query: per-emoji counts + whether the current user reacted
  const activityIds = page_activities.map((a) => a.id);
  const userId = session.user.id;
  const reactionRows = activityIds.length > 0
    ? await prisma.$queryRaw<{ activityId: string; emoji: string; count: bigint; userReacted: boolean }[]>`
        SELECT "activityId", emoji, COUNT(*)::bigint AS count,
               BOOL_OR("userId" = ${userId}) AS "userReacted"
        FROM "FeedReaction"
        WHERE "activityId" = ANY(${activityIds}::text[])
        GROUP BY "activityId", emoji
      `
    : [];

  // Build a lookup: activityId → emoji → { count, userReacted }
  const reactionMap = new Map<string, Map<string, { count: number; userReacted: boolean }>>();
  for (const row of reactionRows) {
    if (!reactionMap.has(row.activityId)) reactionMap.set(row.activityId, new Map());
    reactionMap.get(row.activityId)!.set(row.emoji, { count: Number(row.count), userReacted: row.userReacted });
  }

  const activities = page_activities.map((a) => {
    const emojiData = reactionMap.get(a.id) ?? new Map<string, { count: number; userReacted: boolean }>();
    const reactions = Array.from(emojiData.entries()).map(([emoji, { count, userReacted }]) => ({
      emoji,
      count,
      reacted: userReacted,
    }));

    return {
      id: a.id,
      type: a.type,
      data: a.data,
      createdAt: a.createdAt,
      user: a.user,
      likeCount: a._count.likes,
      commentCount: a._count.comments,
      liked: a.likes.length > 0,
      reactions,
      isOwn: a.userId === session.user.id,
    };
  });

  return NextResponse.json({ activities, hasMore, nextPage: hasMore ? page + 1 : null });
}
