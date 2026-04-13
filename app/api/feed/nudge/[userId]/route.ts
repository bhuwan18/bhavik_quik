import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  if (userId === session.user.id)
    return NextResponse.json({ error: "Cannot nudge yourself" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  });
  if (!target || target.isAdmin)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Rate limit: 1 nudge per 24 h per sender→recipient pair
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.nudge.findFirst({
    where: { senderId: session.user.id, recipientId: userId, createdAt: { gte: since } },
  });
  if (recent)
    return NextResponse.json({ error: "Already nudged recently", alreadySent: true }, { status: 429 });

  await prisma.nudge.create({ data: { senderId: session.user.id, recipientId: userId } });

  const senderName = session.user.name ?? "Someone";

  // Fire-and-forget in-app notification + push
  prisma.notification.create({
    data: {
      userId,
      type: "user_nudge",
      message: `${senderName} is nudging you to practice today! 👊 Keep that streak alive!`,
    },
  }).catch(() => {});

  sendPushToUser(
    userId,
    "Practice Reminder 👊",
    `${senderName} wants you to practice today!`,
    "/feed"
  ).catch(() => {});

  return NextResponse.json({ success: true });
}
