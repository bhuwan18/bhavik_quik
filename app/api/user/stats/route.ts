import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, totalQuizlets, ownedQuizlets, recentAttempts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true, totalCorrect: true, totalAnswered: true, createdAt: true },
    }),
    prisma.quizlet.count(),
    prisma.userQuizlet.count({ where: { userId: session.user.id } }),
    prisma.quizAttempt.findMany({
      where: { userId: session.user.id },
      include: { quiz: { select: { title: true, category: true } } },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    coins: user.coins,
    totalCorrect: user.totalCorrect,
    totalAnswered: user.totalAnswered,
    accuracy: user.totalAnswered > 0 ? Math.round((user.totalCorrect / user.totalAnswered) * 100) : 0,
    ownedQuizlets,
    totalQuizlets,
    hasCompletedAll: ownedQuizlets >= totalQuizlets && totalQuizlets > 0,
    recentAttempts,
    memberSince: user.createdAt,
  });
}
