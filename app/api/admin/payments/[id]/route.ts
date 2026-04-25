import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Session } from "next-auth";

function adminOnly(session: Session | null): boolean {
  return !!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let action: string, adminNote: string | undefined;
  try {
    const body = await req.json();
    action = body.action;
    adminNote = body.adminNote;
    if (action !== "approve" && action !== "reject") throw new Error("Invalid action");
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 });
  }

  const payment = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { user: { select: { isLocked: true, isPro: true, proExpiresAt: true, isMax: true, maxExpiresAt: true, isBlacksmith: true, blacksmithExpiresAt: true } } },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
  }

  if (action === "reject") {
    await prisma.paymentRequest.update({
      where: { id },
      data: { status: "rejected", adminNote: adminNote ?? null },
    });
    return NextResponse.json({ success: true, status: "rejected" });
  }

  // Approve: credit coins or grant pro, then mark approved
  if (payment.type === "coins" && payment.coins) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payment.userId },
        data: { coins: { increment: payment.coins }, totalCoinsEarned: { increment: payment.coins ?? 0 } },
      }),
      prisma.paymentRequest.update({
        where: { id },
        data: { status: "approved" },
      }),
    ]);
  } else if (payment.type === "pro") {
    const base =
      payment.user.isPro && payment.user.proExpiresAt && payment.user.proExpiresAt > new Date()
        ? payment.user.proExpiresAt
        : new Date();
    const proExpiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: payment.userId },
        data: { isPro: true, proExpiresAt },
      }),
      prisma.paymentRequest.update({
        where: { id },
        data: { status: "approved" },
      }),
    ]);
  } else if (payment.type === "reset") {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payment.userId },
        data: { dailyCoinsEarned: 0, dailyCoinsReset: new Date() },
      }),
      prisma.paymentRequest.update({
        where: { id },
        data: { status: "approved" },
      }),
    ]);
  } else if (payment.type === "max") {
    const base =
      payment.user.isMax && payment.user.maxExpiresAt && payment.user.maxExpiresAt > new Date()
        ? payment.user.maxExpiresAt
        : new Date();
    const maxExpiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payment.userId },
        data: { isMax: true, maxExpiresAt },
      }),
      prisma.paymentRequest.update({
        where: { id },
        data: { status: "approved" },
      }),
    ]);
  } else if (payment.type === "blacksmith") {
    const base =
      payment.user.isBlacksmith && payment.user.blacksmithExpiresAt && payment.user.blacksmithExpiresAt > new Date()
        ? payment.user.blacksmithExpiresAt
        : new Date();
    const blacksmithExpiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payment.userId },
        data: { isBlacksmith: true, blacksmithExpiresAt },
      }),
      prisma.paymentRequest.update({
        where: { id },
        data: { status: "approved" },
      }),
    ]);
  }

  return NextResponse.json({ success: true, status: "approved" });
}
