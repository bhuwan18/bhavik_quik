import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rollPackOpening } from "@/lib/roll";
import { SELL_VALUES } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packSlug } = await req.json();

  const pack = await prisma.pack.findUnique({ where: { slug: packSlug } });
  if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.coins < pack.cost) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const packQuizlets = await prisma.quizlet.findMany({ where: { pack: packSlug } });
  const allQuizlets = await prisma.quizlet.findMany();

  const rolled = rollPackOpening(packSlug, packQuizlets, allQuizlets);

  const ownedIds = (
    await prisma.userQuizlet.findMany({
      where: { userId: session.user.id, quizletId: { in: rolled.map((q) => q.id) } },
      select: { quizletId: true },
    })
  ).map((r) => r.quizletId);

  let refundCoins = 0;
  const newQuizlets = [];
  const duplicates = [];

  for (const quizlet of rolled) {
    if (ownedIds.includes(quizlet.id)) {
      refundCoins += SELL_VALUES[quizlet.rarity] ?? 10;
      duplicates.push({ ...quizlet, isDuplicate: true });
    } else {
      newQuizlets.push(quizlet);
    }
  }

  // Award new quizlets
  if (newQuizlets.length > 0) {
    await prisma.userQuizlet.createMany({
      data: newQuizlets.map((q) => ({ userId: session.user.id, quizletId: q.id })),
      skipDuplicates: true,
    });
  }

  // Deduct pack cost + refund duplicates
  await prisma.user.update({
    where: { id: session.user.id },
    data: { coins: { increment: refundCoins - pack.cost } },
  });

  return NextResponse.json({
    results: [
      ...newQuizlets.map((q) => ({ ...q, isDuplicate: false })),
      ...duplicates,
    ],
    coinsSpent: pack.cost,
    coinsRefunded: refundCoins,
  });
}
