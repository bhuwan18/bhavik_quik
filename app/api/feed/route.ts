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
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  const hasMore = raw.length > PAGE_SIZE;
  const activities = raw.slice(0, PAGE_SIZE).map((a) => {
    // Aggregate reactions by emoji
    const reactionMap = new Map<string, { count: number; reacted: boolean }>();
    for (const r of a.reactions) {
      const cur = reactionMap.get(r.emoji) ?? { count: 0, reacted: false };
      reactionMap.set(r.emoji, {
        count: cur.count + 1,
        reacted: cur.reacted || r.userId === session.user.id,
      });
    }
    const reactions = Array.from(reactionMap.entries()).map(([emoji, v]) => ({ emoji, ...v }));

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
