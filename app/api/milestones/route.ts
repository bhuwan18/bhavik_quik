import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const milestones = await prisma.userMilestone.findMany({
    where: { userId: session.user.id },
    select: { threshold: true, earnedAt: true },
    orderBy: { threshold: "asc" },
  });

  return NextResponse.json(milestones);
}
