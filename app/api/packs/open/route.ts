import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rollPackOpening } from "@/lib/roll";
import { SELL_VALUES } from "@/lib/utils";

const MAX_BULK_QUANTITY = 20;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true, coins: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  let packSlug: string;
  let quantity: number;
  try {
    const body = await req.json();
    packSlug = body.packSlug;
    if (typeof packSlug !== "string" || packSlug.length > 100) throw new Error("Invalid packSlug");
    quantity = typeof body.quantity === "number" ? Math.floor(body.quantity) : 1;
    if (quantity < 1 || quantity > MAX_BULK_QUANTITY) throw new Error("Invalid quantity");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const pack = await prisma.pack.findUnique({ where: { slug: packSlug } });
  if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const totalCost = pack.cost * quantity;
  if (user.coins < totalCost) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const [packQuizlets, allQuizlets] = await Promise.all([
    prisma.quizlet.findMany({ where: { pack: packSlug } }),
    prisma.quizlet.findMany(),
  ]);

  // Roll once per quantity
  const rolled = Array.from({ length: quantity }, () =>
    rollPackOpening(packSlug, packQuizlets, allQuizlets)
  ).flat();

  const ownedIds = new Set(
    (
      await prisma.userQuizlet.findMany({
        where: { userId: session.user.id, quizletId: { in: rolled.map((q) => q.id) } },
        select: { quizletId: true },
      })
    ).map((r) => r.quizletId)
  );

  let refundCoins = 0;
  const newQuizlets: typeof rolled = [];
  const duplicates: typeof rolled = [];
  // Track newly gained quizlets within this roll to avoid double-granting
  const grantedIds = new Set<string>();

  for (const quizlet of rolled) {
    if (ownedIds.has(quizlet.id) || grantedIds.has(quizlet.id)) {
      refundCoins += SELL_VALUES[quizlet.rarity] ?? 10;
      duplicates.push(quizlet);
    } else {
      newQuizlets.push(quizlet);
      grantedIds.add(quizlet.id);
    }
  }

  if (newQuizlets.length > 0) {
    await prisma.userQuizlet.createMany({
      data: newQuizlets.map((q) => ({ userId: session.user.id, quizletId: q.id })),
      skipDuplicates: true,
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { coins: { increment: refundCoins - totalCost } },
  });

  return NextResponse.json({
    results: [
      ...newQuizlets.map((q) => ({ ...q, isDuplicate: false })),
      ...duplicates.map((q) => ({ ...q, isDuplicate: true })),
    ],
    coinsSpent: totalCost,
    coinsRefunded: refundCoins,
  });
}
