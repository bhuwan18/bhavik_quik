import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Session } from "next-auth";

function adminOnly(session: Session | null): boolean {
  return !!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "pending"; // "pending" | "approved" | "rejected" | "all"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = status === "all" ? {} : { status };

  const [payments, total] = await Promise.all([
    prisma.paymentRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.paymentRequest.count({ where }),
  ]);

  return NextResponse.json({ payments, total });
}
