import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GEM_REDEMPTION_TIERS } from "@/lib/game-config";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gems: true, totalGemsEarned: true, coins: true } });
  return NextResponse.json({ gems: user?.gems ?? 0, totalGemsEarned: user?.totalGemsEarned ?? 0, coins: user?.coins ?? 0 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tierIndex: number;
  try {
    const body = await req.json();
    tierIndex = body.tier;
    if (typeof tierIndex !== "number" || !Number.isInteger(tierIndex)) {
      throw new Error("Invalid tier");
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const tier = GEM_REDEMPTION_TIERS[tierIndex];
  if (!tier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Single guarded atomic update — never trust a client-supplied coin amount,
  // and never read-modify-write the gem balance (concurrent redemptions would race).
  const result = await prisma.user.updateMany({
    where: { id: session.user.id, gems: { gte: tier.gems } },
    data: {
      gems: { decrement: tier.gems },
      coins: { increment: tier.coins },
      // Matches the precedent for admin-approved coin purchases (app/api/admin/payments/[id]/route.ts):
      // redeemed coins count toward totalCoinsEarned, so they move the leaderboard and can
      // trip premium-category unlocks — same as a purchased-coin top-up.
      totalCoinsEarned: { increment: tier.coins },
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not enough gems" }, { status: 400 });
  }

  await prisma.gemRedemption.create({
    data: { userId: session.user.id, gemsSpent: tier.gems, coinsGained: tier.coins },
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gems: true, coins: true } });

  return NextResponse.json({ success: true, gemsSpent: tier.gems, coinsGained: tier.coins, gems: user?.gems ?? 0, coins: user?.coins ?? 0 });
}
