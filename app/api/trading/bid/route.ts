import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const maxDuration = 10; // Vercel Hobby cap

// ─── POST: Place a bid (escrow pattern) ──────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true },
  });
  if (dbUser?.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  let listingId: string, amount: number;
  try {
    const body = await req.json();
    listingId = body.listingId;
    amount = body.amount;
    if (typeof listingId !== "string" || listingId.length > 100) throw new Error();
    if (typeof amount !== "number" || amount < 1 || !Number.isInteger(amount)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Fetch listing for quizlet name (used in notifications after the transaction)
  const listing = await prisma.tradeListing.findUnique({
    where: { id: listingId },
    include: {
      quizlet: { select: { name: true, icon: true, isHidden: true } },
      seller: { select: { id: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === session.user.id) return NextResponse.json({ error: "Cannot bid on your own listing" }, { status: 400 });

  // Force buy-now route if bid >= buyNowPrice (pre-check using outer snapshot — enforced again inside tx)
  if (listing.buyNowPrice && amount >= listing.buyNowPrice) {
    return NextResponse.json({ error: "Bid equals or exceeds buy-now price. Use buy-now instead." }, { status: 400 });
  }

  // Mutable state updated inside the transaction callback.
  // Object wrapper avoids TypeScript CFA narrowing let-variables to their initial type
  // when assigned inside async callbacks.
  const txState = {
    newBidId: "",
    refundedBid: null as { bidderId: string; amount: number } | null,
  };

  try {
    await prisma.$transaction(async (tx) => {
      // Re-fetch listing + current highest held bid inside transaction for consistency
      const freshListing = await tx.tradeListing.findUnique({
        where: { id: listingId },
        include: { bids: { where: { isHeld: true }, orderBy: { amount: "desc" }, take: 1 } },
      });

      if (!freshListing || freshListing.status !== "active")
        throw Object.assign(new Error("Listing is no longer active"), { code: "NOT_ACTIVE" });
      if (freshListing.expiresAt <= new Date())
        throw Object.assign(new Error("Listing has expired"), { code: "EXPIRED" });

      const freshHighest = freshListing.bids[0] ?? null;
      const freshMin = freshHighest ? freshHighest.amount + 1 : freshListing.startingPrice;

      if (amount < freshMin)
        throw Object.assign(new Error(`Minimum bid is now ${freshMin} coins`), { code: "TOO_LOW" });
      if (freshListing.buyNowPrice && amount >= freshListing.buyNowPrice)
        throw Object.assign(new Error("Bid equals or exceeds buy-now price. Use buy-now instead."), { code: "USE_BUY_NOW" });

      if (!listing.quizlet.isHidden) {
        const alreadyOwns = await tx.userQuizlet.findUnique({
          where: { userId_quizletId: { userId: session.user.id, quizletId: freshListing.quizletId } },
        });
        if (alreadyOwns)
          throw Object.assign(new Error("You already own this quizlet"), { code: "ALREADY_OWNED" });
      }

      // Deduct coins
      const deducted = await tx.user.updateMany({
        where: { id: session.user.id, coins: { gte: amount } },
        data: { coins: { decrement: amount } },
      });
      if (deducted.count === 0)
        throw Object.assign(new Error("Not enough coins"), { code: "INSUFFICIENT_COINS" });

      // Create bid already held (no placeholder needed)
      const bid = await tx.tradeBid.create({
        data: { listingId, bidderId: session.user.id, amount, isHeld: true },
      });
      txState.newBidId = bid.id;

      // Refund previous highest bidder using fresh data (prevents double-refund on concurrent bids)
      if (freshHighest && freshHighest.bidderId !== session.user.id) {
        await tx.user.update({
          where: { id: freshHighest.bidderId },
          data: { coins: { increment: freshHighest.amount } },
        });
        await tx.tradeBid.update({
          where: { id: freshHighest.id },
          data: { isHeld: false },
        });
        txState.refundedBid = { bidderId: freshHighest.bidderId, amount: freshHighest.amount };
      } else if (freshHighest && freshHighest.bidderId === session.user.id) {
        // Same user raising their own bid — refund their previous held amount
        await tx.user.update({
          where: { id: session.user.id },
          data: { coins: { increment: freshHighest.amount } },
        });
        await tx.tradeBid.update({
          where: { id: freshHighest.id },
          data: { isHeld: false },
        });
      }
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "Bid failed";
    const status =
      code === "INSUFFICIENT_COINS" || code === "TOO_LOW" || code === "USE_BUY_NOW" || code === "ALREADY_OWNED"
        ? 400
        : code === "NOT_ACTIVE" || code === "EXPIRED"
        ? 409
        : 500;
    return NextResponse.json({ error: message }, { status });
  }

  // Notify outbid user (fire-and-forget) — uses outer listing snapshot for quizlet name
  if (txState.refundedBid) {
    const rb = txState.refundedBid;
    prisma.notification.create({
      data: {
        userId: rb.bidderId,
        type: "outbid",
        message: `You were outbid on ${listing.quizlet.name} (${listing.quizlet.icon}). Your ${rb.amount} coins have been refunded. New highest bid: ${amount} coins.`,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, bidId: txState.newBidId, amount });
}
