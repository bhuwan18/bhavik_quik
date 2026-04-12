import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastSeenAt: true },
  });

  const now = new Date();

  if (user) {
    const lastSeen = user.lastSeenAt;
    const isReturn = !lastSeen || now.getTime() - lastSeen.getTime() > TWO_DAYS_MS;
    if (isReturn) {
      const daysMissed = lastSeen
        ? Math.max(2, Math.floor((now.getTime() - lastSeen.getTime()) / (24 * 60 * 60 * 1000)))
        : 2;
      prisma.feedActivity.create({
        data: { userId: session.user.id, type: "user_returned", data: { daysMissed } },
      }).catch(() => {});
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenAt: now },
  });

  return NextResponse.json({ ok: true });
}
