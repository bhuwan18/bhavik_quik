import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function resolveTarget(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: targetId } = await params;

  if (targetId === session.user.id)
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const target = await resolveTarget(targetId);
  if (!target || target.isAdmin)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    await prisma.userFollow.create({
      data: { followerId: session.user.id, followingId: targetId },
    });
  } catch {
    // Unique constraint violation — already following; treat as success
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: targetId } = await params;

  await prisma.userFollow.deleteMany({
    where: { followerId: session.user.id, followingId: targetId },
  });

  return NextResponse.json({ ok: true });
}
