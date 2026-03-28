import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const EXCLUDED_EMAILS = ["test@bittsquiz.internal"];

// Cache the public leaderboard for 30 seconds
const getCachedLeaderboard = unstable_cache(
  async (adminEmail: string) =>
    prisma.user.findMany({
      where: { isAdmin: false, NOT: { email: { in: [...EXCLUDED_EMAILS, adminEmail] } } },
      select: {
        id: true,
        name: true,
        image: true,
        coins: true,
        totalCorrect: true,
        totalAnswered: true,
        _count: { select: { ownedQuizlets: true, quizAttempts: true } },
      },
      orderBy: { coins: "desc" },
      take: 50,
    }),
  ["leaderboard-public"],
  { revalidate: 30 }
);

export async function GET() {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin ?? false;
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@quizlet.internal";

  if (isAdmin) {
    const users = await prisma.user.findMany({
      where: { isAdmin: false, NOT: { email: { in: [...EXCLUDED_EMAILS, adminEmail] } } },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        coins: true,
        totalCorrect: true,
        totalAnswered: true,
        createdAt: true,
        _count: { select: { ownedQuizlets: true, quizAttempts: true } },
      },
      orderBy: { coins: "desc" },
      take: 50,
    });
    return NextResponse.json(users);
  }

  const users = await getCachedLeaderboard(adminEmail);
  return NextResponse.json(users);
}
