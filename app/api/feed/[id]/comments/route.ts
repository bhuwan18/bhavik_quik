import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const activity = await prisma.feedActivity.findUnique({ where: { id: activityId }, select: { id: true } });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let text: string;
  try {
    const body = await req.json();
    text = String(body.text ?? "").trim();
    if (!text) throw new Error("Empty");
    if (text.length > 280) throw new Error("Too long");
  } catch {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }

  const comment = await prisma.feedComment.create({
    data: { userId: session.user.id, activityId, text },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
