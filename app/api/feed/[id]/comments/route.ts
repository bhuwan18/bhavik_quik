import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: activityId } = await params;

  const comments = await prisma.feedComment.findMany({
    where: { activityId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: activityId } = await params;

  const activity = await prisma.feedActivity.findUnique({ where: { id: activityId }, select: { id: true, userId: true } });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let text: string;
  try {
    const body = await req.json();
    text = String(body.text ?? "").trim();
    if (!text) throw new Error("Empty");
    if (text.length > 500) throw new Error("Too long");
  } catch {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }

  const comment = await prisma.feedComment.create({
    data: { userId: session.user.id, activityId, text },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  // Notify activity owner (not self-comments)
  if (activity.userId !== session.user.id) {
    const commenter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const name = commenter?.name ?? "Someone";
    prisma.notification.create({
      data: {
        userId: activity.userId,
        type: "feed_comment",
        message: `${name} commented on your activity 💬`,
      },
    }).catch(() => {});
    sendPushToUser(activity.userId, "New comment 💬", `${name} commented on your activity`, "/feed").catch(() => {});
  }

  return NextResponse.json(comment, { status: 201 });
}
