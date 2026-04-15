import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TRADING_CONFIG, getMinPrice } from "@/lib/trading";
import { maybeResolveExpired } from "@/lib/trading-resolve";

const PAGE_SIZE = 20;

// ─── GET: Browse active listings ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await maybeResolveExpired();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const rarity = searchParams.get("rarity");
  const search = searchParams.get("search")?.trim();

  const where: Record<string, unknown> = { status: "active", expiresAt: { gt: new Date() } };
  if (rarity) where.quizlet = { rarity };
  if (search) where.quizlet = { ...((where.quizlet as object) ?? {}), name: { contains: search, mode: "insensitive" } };

  const [listings, total] = await Promise.all([
    prisma.tradeListing.findMany({
      where,
      include: {
        quizlet: true,
        seller: { select: { id: true, name: true, image: true } },
        bids: { orderBy: { amount: "desc" }, take: 1, select: { amount: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tradeListing.count({ where }),
  ]);

  const data = listings.map((l) => ({
    id: l.id,
    quizlet: l.quizlet,
    seller: l.seller,
    startingPrice: l.startingPrice,
    buyNowPrice: l.buyNowPrice,
    currentBid: l.bids[0]?.amount ?? null,
    bidCount: l._count.bids,
    expiresAt: l.expiresAt.toISOString(),
    createdAt: l.createdAt.toISOString(),
  }));

  return NextResponse.json({ listings: data, total, page, pageSize: PAGE_SIZE });
}

// ─── POST: Create a new listing ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true },
  });
  if (dbUser?.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  let quizletId: string, startingPrice: number, buyNowPrice: number | null;
  try {
    const body = await req.json();
    quizletId = body.quizletId;
    startingPrice = body.startingPrice;
    buyNowPrice = body.buyNowPrice ?? null;
    if (typeof quizletId !== "string" || quizletId.length > 100) throw new Error();
    if (typeof startingPrice !== "number" || startingPrice < 1) throw new Error();
    if (buyNowPrice !== null && (typeof buyNowPrice !== "number" || buyNowPrice <= startingPrice)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify ownership
  const ownership = await prisma.userQuizlet.findUnique({
    where: { userId_quizletId: { userId: session.user.id, quizletId } },
    include: { quizlet: true },
  });
  if (!ownership) return NextResponse.json({ error: "You don't own this quizlet" }, { status: 404 });

  // Block mystical quizlets
  if (TRADING_CONFIG.BLOCKED_PACKS.includes(ownership.quizlet.pack)) {
    return NextResponse.json({ error: "This quizlet cannot be traded" }, { status: 400 });
  }

  // Validate minimum price
  const minPrice = getMinPrice(ownership.quizlet.sellValue);
  if (startingPrice < minPrice) {
    return NextResponse.json({ error: `Minimum starting price is ${minPrice} coins` }, { status: 400 });
  }

  // Check no existing active listing
  const existing = await prisma.tradeListing.findFirst({
    where: { userQuizletId: ownership.id, status: "active" },
  });
  if (existing) {
    return NextResponse.json({ error: "This quizlet is already listed for trading" }, { status: 400 });
  }

  const listing = await prisma.tradeListing.create({
    data: {
      sellerId: session.user.id,
      userQuizletId: ownership.id,
      quizletId,
      startingPrice,
      buyNowPrice,
      expiresAt: new Date(Date.now() + TRADING_CONFIG.AUCTION_DURATION_MS),
    },
    include: { quizlet: true },
  });

  return NextResponse.json({
    id: listing.id,
    quizletName: listing.quizlet.name,
    startingPrice: listing.startingPrice,
    buyNowPrice: listing.buyNowPrice,
    expiresAt: listing.expiresAt.toISOString(),
  });
}
