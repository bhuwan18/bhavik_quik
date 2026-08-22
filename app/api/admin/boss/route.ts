import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { spawnNextBoss, resolveBossDefeat } from "@/lib/boss";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const boss = await prisma.boss.findFirst({ where: { status: "active" }, orderBy: { createdAt: "desc" } });
  const contributorCount = boss ? await prisma.bossContribution.count({ where: { bossId: boss.id } }) : 0;

  return NextResponse.json({ boss, contributorCount });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { currentHp?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const boss = await prisma.boss.findFirst({ where: { status: "active" } });
  if (!boss) return NextResponse.json({ error: "No active boss" }, { status: 404 });

  if (typeof body.currentHp !== "number" || !Number.isInteger(body.currentHp) || body.currentHp < 0 || body.currentHp > boss.maxHp) {
    return NextResponse.json({ error: "currentHp must be an integer between 0 and the boss's maxHp" }, { status: 400 });
  }

  if (body.currentHp === 0) {
    // Dropping HP to 0 is a kill, not just a stat edit — flip status and run the
    // same defeat resolution (gem payout to contributors, notifications) that a
    // player's killing blow gets, otherwise the boss is stuck "active" at 0 HP
    // forever: immune to further damage, no death animation, no gems paid out.
    const updated = await prisma.boss.update({
      where: { id: boss.id },
      data: { currentHp: 0, status: "defeated", defeatedAt: new Date() },
    });
    resolveBossDefeat(boss.id).catch((err) => console.error("[admin boss] resolveBossDefeat failed:", err));
    return NextResponse.json({ boss: updated });
  }

  const updated = await prisma.boss.update({
    where: { id: boss.id },
    data: { currentHp: body.currentHp },
  });

  return NextResponse.json({ boss: updated });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.action === "force-spawn") {
    // End any current active boss first (as expired, no payout) so we never have two active at once.
    await prisma.boss.updateMany({ where: { status: "active" }, data: { status: "expired" } });
    const boss = await spawnNextBoss();
    return NextResponse.json({ boss });
  }

  if (body.action === "force-end") {
    const boss = await prisma.boss.findFirst({ where: { status: "active" } });
    if (!boss) return NextResponse.json({ error: "No active boss" }, { status: 404 });
    const updated = await prisma.boss.update({ where: { id: boss.id }, data: { status: "expired" } });
    return NextResponse.json({ boss: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
