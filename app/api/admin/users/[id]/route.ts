import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function adminOnly(session: Session | null): boolean {
  return !!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin);
}

const ALLOWED_ACTIONS = ["lock", "unlock", "reset_daily", "grant_pro", "revoke_pro", "grant_max", "revoke_max"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let action: Action;
  try {
    const body = await req.json();
    if (!ALLOWED_ACTIONS.includes(body.action)) throw new Error("Invalid action");
    action = body.action as Action;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isAdmin: true, email: true },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Prevent admins from locking other admins or themselves
  if (target.isAdmin && (action === "lock")) {
    return NextResponse.json({ error: "Cannot lock an admin account" }, { status: 403 });
  }
  if (target.id === session!.user.id && action === "lock") {
    return NextResponse.json({ error: "Cannot lock yourself" }, { status: 403 });
  }

  let updateData: Record<string, unknown> = {};

  switch (action) {
    case "lock":
      updateData = { isLocked: true };
      break;
    case "unlock":
      updateData = { isLocked: false };
      break;
    case "reset_daily":
      updateData = { dailyCoinsEarned: 0, dailyCoinsReset: new Date() };
      break;
    case "grant_pro": {
      const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      updateData = { isPro: true, proExpiresAt };
      break;
    }
    case "revoke_pro":
      updateData = { isPro: false, proExpiresAt: null };
      break;
    case "grant_max": {
      const maxExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      updateData = { isMax: true, maxExpiresAt };
      break;
    }
    case "revoke_max":
      updateData = { isMax: false, maxExpiresAt: null };
      break;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, isLocked: true, isPro: true, proExpiresAt: true, isMax: true, maxExpiresAt: true, dailyCoinsEarned: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
