import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, type } = await req.json();
  if (!message || typeof message !== "string" || message.trim().length < 5) {
    return NextResponse.json({ error: "Message too short" }, { status: 400 });
  }

  await prisma.feedback.create({
    data: {
      userId: session.user.id,
      type: type ?? "General",
      message: message.trim(),
    },
  });

  return NextResponse.json({ ok: true });
}
