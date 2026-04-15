import { prisma } from "@/lib/db";
import { calculateSellerProceeds } from "@/lib/trading";

// ─── Lazy Auction Resolution ─────────────────────────────────────────────────
// Resolves expired listings on-demand. Called from trading GET endpoints.

let lastResolveTime = 0;
const RESOLVE_COOLDOWN_MS = 30_000; // 30 seconds

/** Resolve expired listings if cooldown has elapsed. */
export async function maybeResolveExpired(): Promise<void> {
  const now = Date.now();
  if (now - lastResolveTime < RESOLVE_COOLDOWN_MS) return;
  lastResolveTime = now;
  await resolveExpiredListings();
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
    const winningBid = listing.bids[0]; // highest held bid

    if (winningBid) {
      // ── Auction won: transfer quizlet, credit seller, refund other bids ──
      const sellerProceeds = calculateSellerProceeds(winningBid.amount);

      await prisma.$transaction([
        // Mark listing as sold
        prisma.tradeListing.update({
          where: { id: listing.id },
          data: { status: "sold" },
        }),
        // Transfer quizlet ownership to winner
        prisma.userQuizlet.update({
          where: { id: listing.userQuizletId },
          data: { userId: winningBid.bidderId, obtainedAt: new Date() },
        }),
        // Credit seller (95%)
        prisma.user.update({
          where: { id: listing.sellerId },
          data: { coins: { increment: sellerProceeds } },
        }),
        // Mark winning bid as no longer held
        prisma.tradeBid.update({
          where: { id: winningBid.id },
          data: { isHeld: false },
        }),
      ]);

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

  return expired.length;
}
