import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  // Fetch listing with current highest bid
  const listing = await prisma.tradeListing.findUnique({
    where: { id: listingId },
    include: {
      bids: { where: { isHeld: true }, orderBy: { amount: "desc" }, take: 1 },
      quizlet: { select: { name: true, icon: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.status !== "active") return NextResponse.json({ error: "Listing is not active" }, { status: 400 });
  if (listing.expiresAt <= new Date()) return NextResponse.json({ error: "Listing has expired" }, { status: 400 });
  if (listing.sellerId === session.user.id) return NextResponse.json({ error: "Cannot bid on your own listing" }, { status: 400 });

  const currentHighest = listing.bids[0]?.amount ?? 0;
  const minBid = currentHighest > 0 ? currentHighest + 1 : listing.startingPrice;

  if (amount < minBid) {
    return NextResponse.json({ error: `Minimum bid is ${minBid} coins` }, { status: 400 });
  }

  // Force buy-now route if bid >= buyNowPrice
  if (listing.buyNowPrice && amount >= listing.buyNowPrice) {
    return NextResponse.json({ error: "Bid equals or exceeds buy-now price. Use buy-now instead." }, { status: 400 });
  }

  // Step 1: Create placeholder bid (not yet held)
  const bid = await prisma.tradeBid.create({
    data: { listingId, bidderId: session.user.id, amount, isHeld: false },
  });

  // Step 2: Atomic coin deduction
  const deducted = await prisma.user.updateMany({
    where: { id: session.user.id, coins: { gte: amount } },
    data: { coins: { decrement: amount } },
  });

  if (deducted.count === 0) {
    // Deduction failed — clean up placeholder
    await prisma.tradeBid.delete({ where: { id: bid.id } });
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  // Step 3: Mark bid as held
  await prisma.tradeBid.update({ where: { id: bid.id }, data: { isHeld: true } });

  // Step 4: Refund previous highest bidder
  const prevBid = listing.bids[0];
  if (prevBid && prevBid.bidderId !== session.user.id) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: prevBid.bidderId },
        data: { coins: { increment: prevBid.amount } },
      }),
      prisma.tradeBid.update({
        where: { id: prevBid.id },
        data: { isHeld: false },
      }),
    ]);

    // Notify outbid user (fire-and-forget)
    prisma.notification.create({
      data: {
        userId: prevBid.bidderId,
        type: "outbid",
        message: `You were outbid on ${listing.quizlet.name} (${listing.quizlet.icon}). Your ${prevBid.amount} coins have been refunded. New highest bid: ${amount} coins.`,
      },
    }).catch(() => {});
  } else if (prevBid && prevBid.bidderId === session.user.id) {
    // Same user raising their bid — refund their previous bid
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { coins: { increment: prevBid.amount } },
      }),
      prisma.tradeBid.update({
        where: { id: prevBid.id },
        data: { isHeld: false },
      }),
    ]);
  }

  return NextResponse.json({ success: true, bidId: bid.id, amount });
}
