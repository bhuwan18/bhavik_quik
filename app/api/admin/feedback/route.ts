import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, image: true } } },
  });

  return NextResponse.json(items);
}

export async function PATCH(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, isRead, reply } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Admin reply: create a notification for the feedback author
  if (reply !== undefined) {
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.notification.create({
      data: {
        userId: feedback.userId,
        type: "feedback_reply",
        message: `Admin replied to your feedback: "${reply}"`,
      },
    });
    // Auto-mark as read when replied
    await prisma.feedback.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { isRead },
  });

  return NextResponse.json(updated);
}
