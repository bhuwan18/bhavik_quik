import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maybeResolveExpired } from "@/lib/trading-resolve";
import TradingClient from "@/components/trading/TradingClient";

export default async function TradingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Resolve any expired auctions
  await maybeResolveExpired();

  const userId = session.user.id;

  const [user, listings, listingsCount, myListings, myBids, owned] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    }),
    prisma.tradeListing.findMany({
      where: { status: "active", expiresAt: { gt: new Date() } },
      include: {
        quizlet: true,
        seller: { select: { id: true, name: true, image: true } },
        bids: { orderBy: { amount: "desc" }, take: 1, select: { amount: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.tradeListing.count({
      where: { status: "active", expiresAt: { gt: new Date() } },
    }),
    prisma.tradeListing.findMany({
      where: { sellerId: userId },
      include: {
        quizlet: true,
        seller: { select: { id: true, name: true, image: true } },
        bids: { orderBy: { amount: "desc" }, take: 1, select: { amount: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.tradeBid.findMany({
      where: { bidderId: userId },
      include: {
        listing: {
          include: {
            quizlet: true,
            seller: { select: { id: true, name: true, image: true } },
            bids: { orderBy: { amount: "desc" }, take: 1, select: { amount: true } },
            _count: { select: { bids: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.userQuizlet.findMany({
      where: { userId },
      include: { quizlet: { select: { id: true, name: true, rarity: true, pack: true, icon: true, colorFrom: true, colorTo: true, sellValue: true } } },
    }),
  ]);

  const formatListing = (l: typeof listings[number]) => ({
    id: l.id,
    quizlet: l.quizlet,
    seller: l.seller,
    startingPrice: l.startingPrice,
    buyNowPrice: l.buyNowPrice,
    currentBid: l.bids[0]?.amount ?? null,
    bidCount: l._count.bids,
    expiresAt: l.expiresAt.toISOString(),
    createdAt: l.createdAt.toISOString(),
    status: l.status,
  });

  return (
    <TradingClient
      initialListings={listings.map(formatListing)}
      initialTotal={listingsCount}
      myListings={myListings.map(formatListing)}
      myBids={myBids.map((b) => ({
        id: b.id,
        amount: b.amount,
        isHeld: b.isHeld,
        listing: formatListing(b.listing),
      }))}
      ownedQuizlets={owned.map((o) => o.quizlet)}
      userCoins={user?.coins ?? 0}
      userId={userId}
    />
  );
}
