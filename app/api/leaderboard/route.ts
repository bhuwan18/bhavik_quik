import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin ?? false;

  const users = await prisma.user.findMany({
    where: {
      // exclude internal accounts (admin + test user) from leaderboard
      NOT: { email: { in: [process.env.ADMIN_EMAIL ?? "admin@quizlet.internal", "test@bittsquiz.internal"] } },
    },
    select: {
      id: true,
      name: true,
      image: true,
      email: isAdmin,
      coins: true,
      totalCorrect: true,
      totalAnswered: true,
      createdAt: isAdmin,
      _count: { select: { ownedQuizlets: true, quizAttempts: true } },
    },
    orderBy: { coins: "desc" },
    take: 50,
  });

  return NextResponse.json(users);
}
