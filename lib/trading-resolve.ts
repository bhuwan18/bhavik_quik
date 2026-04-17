import { prisma } from "@/lib/db";
import { calculateSellerProceeds } from "@/lib/trading";

// ─── Lazy Auction Resolution ─────────────────────────────────────────────────
// Resolves expired listings on-demand. Called from trading GET endpoints.

let lastResolveTime = 0;
const RESOLVE_COOLDOWN_MS = 30_000; // 30 seconds

/** Resolve expired listings if cooldown has elapsed. Never throws. */
export async function maybeResolveExpired(): Promise<void> {
  const now = Date.now();
  if (now - lastResolveTime < RESOLVE_COOLDOWN_MS) return;
  lastResolveTime = now;
  await resolveExpiredListings().catch(() => {});
}

/** Process all expired active listings (batch of 50). */
export async function resolveExpiredListings(): Promise<number> {
  const expired = await prisma.tradeListing.findMany({
    where: { status: "active", expiresAt: { lte: new Date() } },
    include: {
      bids: { where: { isHeld: true }, orderBy: { amount: "desc" } },
      userQuizlet: true,
      quizlet: true,
      seller: { select: { id: true, name: true } },
    },
    take: 50,
  });

  for (const listing of expired) {
    try {
      await resolveOneListing(listing);
    } catch {
      // Never let a single listing failure block the rest or crash the page
    }
  }

  return expired.length;
}

type ListingWithIncludes = Awaited<ReturnType<typeof prisma.tradeListing.findMany<{
  include: {
    bids: { where: { isHeld: boolean }; orderBy: { amount: "desc" } };
    userQuizlet: true;
    quizlet: true;
    seller: { select: { id: true; name: true } };
  };
}>>>[number];

async function resolveOneListing(listing: ListingWithIncludes): Promise<void> {
  const winningBid = listing.bids[0]; // highest held bid

  if (winningBid) {
    // ── Auction won: transfer quizlet, credit seller, refund other bids ──
    const sellerProceeds = calculateSellerProceeds(winningBid.amount);

    // Check if winner already owns this quizlet type (unique constraint guard)
    const winnerAlreadyOwns = await prisma.userQuizlet.findUnique({
      where: { userId_quizletId: { userId: winningBid.bidderId, quizletId: listing.quizletId } },
    });

    if (winnerAlreadyOwns && winnerAlreadyOwns.id !== listing.userQuizletId) {
      // Winner already has this quizlet — increment their quantity and delete the listed record
      await prisma.$transaction([
        prisma.tradeListing.update({
          where: { id: listing.id },
          data: { status: "sold" },
        }),
        prisma.userQuizlet.update({
          where: { id: winnerAlreadyOwns.id },
          data: { quantity: { increment: 1 } },
        }),
        prisma.userQuizlet.delete({
          where: { id: listing.userQuizletId },
        }),
        prisma.user.update({
          where: { id: listing.sellerId },
          data: { coins: { increment: sellerProceeds } },
        }),
        prisma.tradeBid.update({
          where: { id: winningBid.id },
          data: { isHeld: false },
        }),
      ]);
    } else {
      // Normal transfer: update userId on the existing UserQuizlet record
      await prisma.$transaction([
        prisma.tradeListing.update({
          where: { id: listing.id },
          data: { status: "sold" },
        }),
        prisma.userQuizlet.update({
          where: { id: listing.userQuizletId },
          data: { userId: winningBid.bidderId, obtainedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: listing.sellerId },
          data: { coins: { increment: sellerProceeds } },
        }),
        prisma.tradeBid.update({
          where: { id: winningBid.id },
          data: { isHeld: false },
        }),
      ]);
    }

    // Refund all other held bids
    const otherBids = listing.bids.filter((b) => b.id !== winningBid.id);
    for (const bid of otherBids) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: bid.bidderId },
          data: { coins: { increment: bid.amount } },
        }),
        prisma.tradeBid.update({
          where: { id: bid.id },
          data: { isHeld: false },
        }),
      ]);
    }

    // Notifications (fire-and-forget)
    prisma.notification.createMany({
      data: [
        {
          userId: winningBid.bidderId,
          type: "trade_won",
          message: `You won the auction for ${listing.quizlet.name} (${listing.quizlet.icon}) for ${winningBid.amount} coins!`,
        },
        {
          userId: listing.sellerId,
          type: "trade_sold",
          message: `Your ${listing.quizlet.name} (${listing.quizlet.icon}) sold for ${winningBid.amount} coins! You received ${sellerProceeds} coins after the 5% fee.`,
        },
        ...otherBids.map((b) => ({
          userId: b.bidderId,
          type: "outbid" as const,
          message: `The auction for ${listing.quizlet.name} (${listing.quizlet.icon}) has ended. Your bid of ${b.amount} coins has been refunded.`,
        })),
      ],
    }).catch(() => {});

    // Feed activity (fire-and-forget)
    prisma.feedActivity.create({
      data: {
        userId: winningBid.bidderId,
        type: "trade_completed",
        data: {
          quizletName: listing.quizlet.name,
          rarity: listing.quizlet.rarity,
          icon: listing.quizlet.icon,
          colorFrom: listing.quizlet.colorFrom,
          colorTo: listing.quizlet.colorTo,
          price: winningBid.amount,
          sellerName: listing.seller.name ?? "Unknown",
        },
      },
    }).catch(() => {});
  } else {
    // ── No bids: expire listing ──
    await prisma.tradeListing.update({
      where: { id: listing.id },
      data: { status: "expired" },
    });

    // Notify seller (fire-and-forget)
    prisma.notification.create({
      data: {
        userId: listing.sellerId,
        type: "trade_expired",
        message: `Your listing for ${listing.quizlet.name} (${listing.quizlet.icon}) expired with no bids.`,
      },
    }).catch(() => {});
  }
}
