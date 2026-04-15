import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveExpiredListings } from "@/lib/trading-resolve";

// ─── GET: Single listing detail ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Resolve this listing if expired
  const check = await prisma.tradeListing.findUnique({
    where: { id },
    select: { status: true, expiresAt: true },
  });
  if (check?.status === "active" && check.expiresAt <= new Date()) {
    await resolveExpiredListings();
  }

  const listing = await prisma.tradeListing.findUnique({
    where: { id },
    include: {
      quizlet: true,
      seller: { select: { id: true, name: true, image: true } },
      bids: {
        orderBy: { amount: "desc" },
        include: { bidder: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  return NextResponse.json({
    id: listing.id,
    quizlet: listing.quizlet,
    seller: listing.seller,
    startingPrice: listing.startingPrice,
    buyNowPrice: listing.buyNowPrice,
    status: listing.status,
    expiresAt: listing.expiresAt.toISOString(),
    createdAt: listing.createdAt.toISOString(),
    bids: listing.bids.map((b) => ({
      id: b.id,
      bidder: b.bidder,
      amount: b.amount,
      isHeld: b.isHeld,
      createdAt: b.createdAt.toISOString(),
    })),
    isOwner: listing.sellerId === session.user.id,
  });
}

// ─── DELETE: Cancel listing (only if no bids) ────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const listing = await prisma.tradeListing.findUnique({
    where: { id },
    include: { _count: { select: { bids: true } } },
  });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  if (listing.status !== "active") return NextResponse.json({ error: "Listing is not active" }, { status: 400 });
  if (listing._count.bids > 0) return NextResponse.json({ error: "Cannot cancel a listing with bids" }, { status: 400 });

  await prisma.tradeListing.update({
    where: { id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ success: true });
}
