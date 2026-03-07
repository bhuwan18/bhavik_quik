import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function adminOnly(session: Session | null): boolean {
  return !!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const search = url.searchParams.get("search")?.slice(0, 100) ?? "";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        coins: true,
        isAdmin: true,
        isLocked: true,
        isPro: true,
        proExpiresAt: true,
        dailyCoinsEarned: true,
        dailyCoinsReset: true,
        totalCorrect: true,
        totalAnswered: true,
        createdAt: true,
        _count: { select: { quizAttempts: true, ownedQuizlets: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit });
}
