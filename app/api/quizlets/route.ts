import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await prisma.userQuizlet.findMany({
    where: { userId: session.user.id },
    select: {
      obtainedAt: true,
      quantity: true,
      quizlet: {
        select: {
          id: true, name: true, icon: true, rarity: true, pack: true,
          colorFrom: true, colorTo: true, description: true,
          sellValue: true, isHidden: true,
        },
      },
    },
    orderBy: { obtainedAt: "desc" },
  });

  return NextResponse.json(owned.map((r) => ({ ...r.quizlet, obtainedAt: r.obtainedAt, quantity: r.quantity })));
}
