import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PRO_AMOUNT_INR = 500;
const MIN_COINS = 10;
const MAX_COINS = 10000;
// UTR: alphanumeric, 8–30 characters
const UTR_RE = /^[A-Za-z0-9]{8,30}$/;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let type: string, utrNumber: string, coins: number | undefined;
  try {
    const body = await req.json();
    type = body.type;
    utrNumber = body.utrNumber;
    coins = body.coins;

    if (type !== "pro" && type !== "coins") throw new Error("Invalid type");
    if (typeof utrNumber !== "string" || !UTR_RE.test(utrNumber)) {
      throw new Error("UTR must be 8–30 alphanumeric characters");
    }
    if (type === "coins") {
      if (typeof coins !== "number" || !Number.isInteger(coins) || coins < MIN_COINS || coins > MAX_COINS) {
        throw new Error(`Coins must be between ${MIN_COINS} and ${MAX_COINS}`);
      }
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  // Prevent duplicate pending UTR submissions
  const existing = await prisma.paymentRequest.findFirst({
    where: { utrNumber, status: "pending" },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "This UTR is already submitted and pending review" }, { status: 409 });
  }

  const amountInr = type === "pro" ? PRO_AMOUNT_INR : coins!;

  const payment = await prisma.paymentRequest.create({
    data: {
      userId: session.user.id,
      type,
      coins: type === "coins" ? coins : null,
      amountInr,
      utrNumber: utrNumber.toUpperCase(),
      status: "pending",
    },
  });

  return NextResponse.json({ success: true, paymentId: payment.id });
}
