import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STACKABLE_RARITIES = new Set(["secret", "unique", "impossible"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify user not locked
  const dbUserCheck = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true },
  });
  if (dbUserCheck?.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  let quizletId: string;
  try {
    const body = await req.json();
    quizletId = body.quizletId;
    if (typeof quizletId !== "string" || quizletId.length > 100) throw new Error("Invalid quizletId");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ownership = await prisma.userQuizlet.findUnique({
    where: { userId_quizletId: { userId: session.user.id, quizletId } },
    include: { quizlet: true },
  });

  if (!ownership) return NextResponse.json({ error: "You don't own this quizlet" }, { status: 404 });

  // Mystical quizlets are achievement trophies — cannot be sold
  if (ownership.quizlet.rarity === "mystical") {
    return NextResponse.json({ error: "Mystical quizlets cannot be sold" }, { status: 400 });
  }

  // Block sell if quizlet is currently listed for trading
  const activeListing = await prisma.tradeListing.findFirst({
    where: { userQuizletId: ownership.id, status: "active" },
  });
  if (activeListing) {
    return NextResponse.json({ error: "This quizlet is currently listed for trading" }, { status: 400 });
  }

  const sellValue = ownership.quizlet.sellValue;
  const isStackable = STACKABLE_RARITIES.has(ownership.quizlet.rarity);
  const quantityRemaining = isStackable && ownership.quantity > 1 ? ownership.quantity - 1 : 0;

  if (quantityRemaining > 0) {
    await prisma.userQuizlet.update({
      where: { userId_quizletId: { userId: session.user.id, quizletId } },
      data: { quantity: { decrement: 1 } },
    });
  } else {
    await prisma.userQuizlet.delete({
      where: { userId_quizletId: { userId: session.user.id, quizletId } },
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { coins: { increment: sellValue } },
  });

  return NextResponse.json({ coinsEarned: sellValue, quizletName: ownership.quizlet.name, quantityRemaining });
}
