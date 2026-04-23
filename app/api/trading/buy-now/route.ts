import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateSellerProceeds } from "@/lib/trading";

export const maxDuration = 10; // Vercel Hobby cap

// ─── POST: Instant buy-now purchase ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true },
  });
  if (dbUser?.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  let listingId: string;
  try {
    const body = await req.json();
    listingId = body.listingId;
    if (typeof listingId !== "string" || listingId.length > 100) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Fetch listing with all held bids
  const listing = await prisma.tradeListing.findUnique({
    where: { id: listingId },
    include: {
      bids: { where: { isHeld: true } },
      quizlet: true,
      seller: { select: { id: true, name: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.status !== "active") return NextResponse.json({ error: "Listing is not active" }, { status: 400 });
  if (listing.expiresAt <= new Date()) return NextResponse.json({ error: "Listing has expired" }, { status: 400 });
  if (!listing.buyNowPrice) return NextResponse.json({ error: "This listing has no buy-now price" }, { status: 400 });
  if (listing.sellerId === session.user.id) return NextResponse.json({ error: "Cannot buy your own listing" }, { status: 400 });

  const price = listing.buyNowPrice;
  const sellerProceeds = calculateSellerProceeds(price);

  // Single atomic transaction: coin deduction + trade + bid refunds all succeed or all roll back
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Conditional coin deduction
      const deducted = await tx.user.updateMany({
        where: { id: session.user.id, coins: { gte: price } },
        data: { coins: { decrement: price } },
      });
      if (deducted.count === 0)
        throw Object.assign(new Error("Not enough coins"), { code: "INSUFFICIENT_COINS" });

      // 2. Mark listing sold — status guard ensures only the first concurrent buyer wins
      const updated = await tx.tradeListing.updateMany({
        where: { id: listing.id, status: "active" },
        data: { status: "sold" },
      });
      if (updated.count === 0)
        throw Object.assign(
          new Error("This listing was just sold to someone else. Your coins have not been deducted."),
          { code: "ALREADY_SOLD" }
        );

      // 3. Transfer quizlet ownership
      await tx.userQuizlet.update({
        where: { id: listing.userQuizletId },
        data: { userId: session.user.id, obtainedAt: new Date() },
      });

      // 4. Credit seller
      await tx.user.update({
        where: { id: listing.sellerId },
        data: { coins: { increment: sellerProceeds } },
      });

      // 5. Refund all held bids inside the same transaction
      for (const bid of listing.bids) {
        await tx.user.update({
          where: { id: bid.bidderId },
          data: { coins: { increment: bid.amount } },
        });
        await tx.tradeBid.update({
          where: { id: bid.id },
          data: { isHeld: false },
        });
      }
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "Purchase failed";
    const status = code === "INSUFFICIENT_COINS" ? 400 : code === "ALREADY_SOLD" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  // Notifications (fire-and-forget)
  const notifications = [
    {
      userId: listing.sellerId,
      type: "trade_sold",
      message: `Your ${listing.quizlet.name} (${listing.quizlet.icon}) was bought instantly for ${price} coins! You received ${sellerProceeds} coins after the 5% fee.`,
    },
    ...listing.bids.map((b) => ({
      userId: b.bidderId,
      type: "outbid" as const,
      message: `The listing for ${listing.quizlet.name} (${listing.quizlet.icon}) was bought instantly. Your bid of ${b.amount} coins has been refunded.`,
    })),
  ];
  if (notifications.length > 0) {
    prisma.notification.createMany({ data: notifications }).catch(() => {});
  }

  // Feed activity (fire-and-forget)
  prisma.feedActivity.create({
    data: {
      userId: session.user.id,
      type: "trade_completed",
      data: {
        quizletName: listing.quizlet.name,
        rarity: listing.quizlet.rarity,
        icon: listing.quizlet.icon,
        colorFrom: listing.quizlet.colorFrom,
        colorTo: listing.quizlet.colorTo,
        price,
        sellerName: listing.seller.name ?? "Unknown",
      },
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    quizletName: listing.quizlet.name,
    price,
    sellerProceeds,
  });
}
