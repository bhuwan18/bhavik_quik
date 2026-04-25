import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function adminOnly(session: Session | null): boolean {
  return !!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = status === "all" ? {} : { status };

  const [submissions, total] = await Promise.all([
    prisma.quizletSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.quizletSubmission.count({ where }),
  ]);

  return NextResponse.json({ submissions, total });
}
