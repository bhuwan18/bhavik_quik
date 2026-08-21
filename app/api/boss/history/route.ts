import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bosses = await prisma.boss.findMany({
    where: { status: { in: ["defeated", "expired"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      icon: true,
      colorFrom: true,
      colorTo: true,
      maxHp: true,
      status: true,
      defeatedAt: true,
      finalBlowUserId: true,
      _count: { select: { contributions: true } },
    },
  });

  const finalBlowIds = bosses.map((b) => b.finalBlowUserId).filter((id): id is string => !!id);
  const finalBlowUsers = finalBlowIds.length
    ? await prisma.user.findMany({ where: { id: { in: finalBlowIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(finalBlowUsers.map((u) => [u.id, u.name ?? "Someone"]));

  return NextResponse.json({
    history: bosses.map((b) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      colorFrom: b.colorFrom,
      colorTo: b.colorTo,
      maxHp: b.maxHp,
      status: b.status,
      defeatedAt: b.defeatedAt,
      contributorCount: b._count.contributions,
      finalBlowName: b.finalBlowUserId ? (nameById.get(b.finalBlowUserId) ?? null) : null,
    })),
  });
}
