import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MilestonesClient from "@/components/milestones/MilestonesClient";

export default async function MilestonesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [earned, user] = await Promise.all([
    prisma.userMilestone.findMany({
      where: { userId: session.user.id },
      select: { threshold: true, earnedAt: true },
      orderBy: { threshold: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totalCoinsEarned: true },
    }),
  ]);

  return (
    <MilestonesClient
      earned={earned.map((e) => ({ threshold: e.threshold, earnedAt: e.earnedAt.toISOString() }))}
      totalCoinsEarned={user?.totalCoinsEarned ?? 0}
    />
  );
}
