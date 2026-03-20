import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  try {
    subscription = await req.json();
    if (
      typeof subscription.endpoint !== "string" ||
      typeof subscription.keys?.p256dh !== "string" ||
      typeof subscription.keys?.auth !== "string"
    ) {
      throw new Error("Invalid shape");
    }
  } catch {
    return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      userId: session.user.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let endpoint: string;
  try {
    const body = await req.json();
    endpoint = body.endpoint;
    if (typeof endpoint !== "string") throw new Error();
  } catch {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription
    .deleteMany({ where: { endpoint, userId: session.user.id } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
