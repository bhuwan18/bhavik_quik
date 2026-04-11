import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const isAdmin = session.user.isAdmin === true;
  const isOwnProfile = session.user.id === userId;

  if (!isAdmin && !isOwnProfile)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (!target || target.isAdmin)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const type = req.nextUrl.searchParams.get("type");
  if (type !== "followers" && type !== "following")
    return NextResponse.json(
      { error: "type must be 'followers' or 'following'" },
      { status: 400 },
    );

  if (type === "followers") {
    const rows = await prisma.userFollow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { follower: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json({ users: rows.map((r) => r.follower) });
  } else {
    const rows = await prisma.userFollow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { following: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json({ users: rows.map((r) => r.following) });
  }
}
