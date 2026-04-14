import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ONLINE_PING_DEBOUNCE_MS } from "@/lib/game-config";

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastSeenAt: true },
  });

  const now = new Date();
  const lastSeen = user?.lastSeenAt ?? null;

  // Server-side debounce: skip the DB write if we already updated recently
  const timeSincePing = lastSeen ? now.getTime() - lastSeen.getTime() : Infinity;
  if (timeSincePing < ONLINE_PING_DEBOUNCE_MS) {
    return NextResponse.json({ ok: true });
  }

  const isReturn = !lastSeen || timeSincePing > TWO_DAYS_MS;
  if (isReturn) {
    const daysMissed = lastSeen
      ? Math.max(2, Math.floor(timeSincePing / (24 * 60 * 60 * 1000)))
      : 2;
    prisma.feedActivity.create({
      data: { userId: session.user.id, type: "user_returned", data: { daysMissed } },
    }).catch(() => {});
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenAt: now },
  });

  return NextResponse.json({ ok: true });
}
