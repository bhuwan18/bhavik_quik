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
    take: 1000,
  });
  const followingIds = following.map((f) => f.followingId);

  // Include own activities + followed users' activities
  const allUserIds = [session.user.id, ...followingIds];

  const raw = await prisma.feedActivity.findMany({
    where: { userId: { in: allUserIds } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: {
      user: { select: { id: true, name: true, image: true, lastSeenAt: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
      // Only fetch current user's own reactions — counts come from grouped query below
      reactions: { where: { userId: session.user.id }, select: { emoji: true } },
    },
  });

  const hasMore = raw.length > PAGE_SIZE;
  const page_activities = raw.slice(0, PAGE_SIZE);

  // Fetch per-emoji counts for this page's activities in one grouped query
  const activityIds = page_activities.map((a) => a.id);
  const reactionCounts = activityIds.length > 0
    ? await prisma.$queryRaw<{ activityId: string; emoji: string; count: bigint }[]>`
        SELECT "activityId", emoji, COUNT(*)::bigint AS count
        FROM "FeedReaction"
        WHERE "activityId" = ANY(${activityIds}::text[])
        GROUP BY "activityId", emoji
      `
    : [];

  // Build a lookup: activityId → emoji → count
  const countMap = new Map<string, Map<string, number>>();
  for (const row of reactionCounts) {
    if (!countMap.has(row.activityId)) countMap.set(row.activityId, new Map());
    countMap.get(row.activityId)!.set(row.emoji, Number(row.count));
  }

  const activities = page_activities.map((a) => {
    const myReacted = new Set(a.reactions.map((r) => r.emoji));
    const emojiCounts = countMap.get(a.id) ?? new Map<string, number>();
    const reactions = Array.from(emojiCounts.entries()).map(([emoji, count]) => ({
      emoji,
      count,
      reacted: myReacted.has(emoji),
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
