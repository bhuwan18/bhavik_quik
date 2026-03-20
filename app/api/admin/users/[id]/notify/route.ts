import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let title: string, body: string, url: string;
  try {
    const data = await req.json();
    title = String(data.title ?? "").trim();
    body = String(data.body ?? "").trim();
    url = String(data.url ?? "/notifications").trim() || "/notifications";
    if (!title) throw new Error("Title is required");
    if (title.length > 100) throw new Error("Title too long");
    if (body.length > 300) throw new Error("Body too long");
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const subCount = await prisma.pushSubscription.count({ where: { userId: id } });

  await sendPushToUser(id, title, body, url);

  return NextResponse.json({ success: true, subscriptions: subCount });
}
