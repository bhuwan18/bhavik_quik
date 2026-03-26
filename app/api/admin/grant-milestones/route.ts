import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MILESTONE_THRESHOLDS } from "@/lib/milestones-data";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!dbUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { totalCoinsEarned: { gt: 0 } },
    select: { id: true, totalCoinsEarned: true },
  });

  let granted = 0;
  for (const user of users) {
    const thresholds = MILESTONE_THRESHOLDS.filter((t) => t <= user.totalCoinsEarned);
    if (thresholds.length > 0) {
      const result = await prisma.userMilestone.createMany({
        data: thresholds.map((t) => ({ userId: user.id, threshold: t })),
        skipDuplicates: true,
      });
      granted += result.count;
    }
  }

  return NextResponse.json({ granted, users: users.length });
}
