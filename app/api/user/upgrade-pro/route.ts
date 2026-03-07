import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Pro costs 500 INR/month — in a real app this would integrate with Razorpay/Stripe.
// For now, this endpoint simulates a successful payment and grants 30 days of pro.

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate body
  let paymentToken: string;
  try {
    const body = await req.json();
    paymentToken = body.paymentToken;
    if (typeof paymentToken !== "string" || paymentToken.length < 8) {
      throw new Error("Invalid payment token");
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true, isPro: true, proExpiresAt: true },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  // Calculate new expiry: extend from current if already pro, else from now
  const base =
    dbUser.isPro && dbUser.proExpiresAt && dbUser.proExpiresAt > new Date()
      ? dbUser.proExpiresAt
      : new Date();
  const proExpiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  await prisma.user.update({
    where: { id: session.user.id },
    data: { isPro: true, proExpiresAt },
  });

  return NextResponse.json({ success: true, proExpiresAt });
}
